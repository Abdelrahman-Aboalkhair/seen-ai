import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { baseConfig } from "@/config/index.js";
import cacheService from "@/services/cache.service.js";
import logger, { logError } from "@/lib/logger.js";

// Rate limit configuration for different endpoints
export const rateLimitConfig = {
  // General API rate limit
  general: {
    windowMs: baseConfig.rateLimit.windowMs, // 15 minutes
    max: baseConfig.rateLimit.maxRequests, // 100 requests per window
    message: {
      error: "Too many requests",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil(baseConfig.rateLimit.windowMs / 1000),
    },
  },

  // AI operations (more restrictive)
  ai: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 AI requests per 15 minutes
    message: {
      error: "Too many AI requests",
      code: "AI_RATE_LIMIT_EXCEEDED",
      retryAfter: 900,
    },
  },

  // Payment operations (very restrictive)
  payment: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 payment attempts per hour
    message: {
      error: "Too many payment attempts",
      code: "PAYMENT_RATE_LIMIT_EXCEEDED",
      retryAfter: 3600,
    },
  },

  // Authentication attempts
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 auth attempts per 15 minutes
    message: {
      error: "Too many authentication attempts",
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      retryAfter: 900,
    },
  },

  // File upload
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: {
      error: "Too many upload requests",
      code: "UPLOAD_RATE_LIMIT_EXCEEDED",
      retryAfter: 60,
    },
  },
};

// Custom key generator that uses user ID when available
const keyGenerator = (req: Request): string => {
  if (req.user?.id) {
    return `rate_limit:user:${req.user.id}`;
  }

  // Fallback to IP address
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  return `rate_limit:ip:${ip}`;
};

// Custom store using Redis
const createRedisStore = (windowMs: number) => {
  return {
    incr: async (
      key: string
    ): Promise<{ totalHits: number; resetTime?: Date }> => {
      try {
        const count = await cacheService.incrementRateLimit(
          key.replace("rate_limit:", ""),
          "api",
          windowMs
        );

        const resetTime = new Date(Date.now() + windowMs);

        return { totalHits: count, resetTime };
      } catch (error) {
        logError(error as Error, { operation: "rate_limit_incr", key });
        return { totalHits: 1 };
      }
    },

    decrement: async (key: string): Promise<void> => {
      // Redis automatically handles expiration, so we don't need to decrement
    },

    resetKey: async (key: string): Promise<void> => {
      try {
        await cacheService.delete(key.replace("rate_limit:", ""));
      } catch (error) {
        logError(error as Error, { operation: "rate_limit_reset", key });
      }
    },
  };
};

// Create rate limiter with custom configuration
const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: any;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    keyGenerator,
    store: createRedisStore(options.windowMs),
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req: Request, res: Response) => {
      const key = keyGenerator(req);

      logger.warn("Rate limit exceeded", {
        key,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        endpoint: req.originalUrl,
      });

      res.status(429).json(options.message);
    },
  });
};

// Pre-configured rate limiters
export const generalRateLimit = createRateLimiter(rateLimitConfig.general);
export const aiRateLimit = createRateLimiter(rateLimitConfig.ai);
export const paymentRateLimit = createRateLimiter(rateLimitConfig.payment);
export const authRateLimit = createRateLimiter(rateLimitConfig.auth);
export const uploadRateLimit = createRateLimiter(rateLimitConfig.upload);

// Advanced rate limiter with user-specific limits
export const createUserSpecificRateLimit = (
  baseConfig: { windowMs: number; max: number; message: any },
  userLimits: Record<string, number> = {}
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const key = keyGenerator(req);

      // Get user-specific limit or use default
      const userLimit =
        userId && userLimits[userId]
          ? userLimits[userId]
          : rateLimitConfig.general.max;

      // Check current count
      const currentCount = await cacheService.getRateLimitCount(
        userId || req.ip || "unknown",
        req.route?.path || req.originalUrl
      );

      if (currentCount >= userLimit) {
        logger.warn("User-specific rate limit exceeded", {
          userId,
          currentCount,
          limit: userLimit,
          endpoint: req.originalUrl,
        });

        return res.status(429).json({
          ...rateLimitConfig.general.message,
          current: currentCount,
          limit: userLimit,
        });
      }

      // Increment counter
      await cacheService.incrementRateLimit(
        userId || req.ip || "unknown",
        req.route?.path || req.originalUrl,
        rateLimitConfig.general.windowMs
      );

      return next();
    } catch (error) {
      logError(error as Error, { operation: "user_specific_rate_limit" });
      return next(); // Continue on error to avoid blocking legitimate requests
    }
  };
};

// Credit-based rate limiting
export const creditBasedRateLimit = (creditsPerRequest: number = 1) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "MISSING_AUTH",
        });
      }

      if (req.user.credits < creditsPerRequest) {
        logger.warn("Insufficient credits for rate limit", {
          userId: req.user.id,
          currentCredits: req.user.credits,
          requiredCredits: creditsPerRequest,
        });

        return res.status(402).json({
          error: "Insufficient credits",
          code: "INSUFFICIENT_CREDITS",
          current: req.user.credits,
          required: creditsPerRequest,
        });
      }

      return next();
    } catch (error) {
      logError(error as Error, { operation: "credit_based_rate_limit" });
      return next();
    }
  };
};

// Burst rate limiter (allows short bursts but limits sustained usage)
export const createBurstRateLimit = (
  shortWindow: { windowMs: number; max: number },
  longWindow: { windowMs: number; max: number },
  message: any
) => {
  const shortLimiter = createRateLimiter({
    ...shortWindow,
    message,
    skipSuccessfulRequests: true,
  });

  const longLimiter = createRateLimiter({
    ...longWindow,
    message,
    skipFailedRequests: true,
  });

  return [shortLimiter, longLimiter];
};

// IP-based rate limiter (ignores authentication)
export const createIPRateLimit = (options: {
  windowMs: number;
  max: number;
  message: any;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    keyGenerator: (req: Request) => {
      const ip = req.ip || req.connection.remoteAddress || "unknown";
      return `ip_rate_limit:${ip}`;
    },
    store: createRedisStore(options.windowMs),
    handler: (req: Request, res: Response) => {
      logger.warn("IP rate limit exceeded", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        endpoint: req.originalUrl,
      });

      res.status(429).json(options.message);
    },
  });
};

// Rate limit bypass for admins
export const adminBypass = (limiter: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role === "admin" || req.user?.role === "super_admin") {
      logger.debug("Rate limit bypassed for admin", { userId: req.user.id });
      return next();
    }

    return limiter(req, res, next);
  };
};

// Dynamic rate limiter based on endpoint
export const dynamicRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const endpoint = req.originalUrl;

  // AI endpoints
  if (
    endpoint.includes("/ai/") ||
    endpoint.includes("/analyze") ||
    endpoint.includes("/generate")
  ) {
    return aiRateLimit(req, res, next);
  }

  // Payment endpoints
  if (endpoint.includes("/payment") || endpoint.includes("/stripe")) {
    return paymentRateLimit(req, res, next);
  }

  // Auth endpoints
  if (
    endpoint.includes("/auth") ||
    endpoint.includes("/login") ||
    endpoint.includes("/register")
  ) {
    return authRateLimit(req, res, next);
  }

  // Upload endpoints
  if (
    endpoint.includes("/upload") ||
    (req.method === "POST" && req.is("multipart/form-data"))
  ) {
    return uploadRateLimit(req, res, next);
  }

  // Default to general rate limit
  return generalRateLimit(req, res, next);
};

// Rate limit status endpoint
export const rateLimitStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const ip = req.ip || "unknown";

    if (!userId && ip === "unknown") {
      return res.status(400).json({
        error: "Unable to determine rate limit status",
        code: "INVALID_REQUEST",
      });
    }

    // Get current counts for different endpoints
    const endpoints = ["api", "ai", "payment", "auth", "upload"];
    const status: Record<string, any> = {};

    for (const endpoint of endpoints) {
      const count = await cacheService.getRateLimitCount(
        userId || ip,
        endpoint
      );

      const config =
        rateLimitConfig[endpoint as keyof typeof rateLimitConfig] ||
        rateLimitConfig.general;

      status[endpoint] = {
        current: count,
        limit: config.max,
        windowMs: config.windowMs,
        remaining: Math.max(0, config.max - count),
        resetTime: new Date(Date.now() + config.windowMs).toISOString(),
      };
    }

    return res.json({
      userId,
      ip: userId ? undefined : ip,
      limits: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error as Error, { operation: "rate_limit_status" });
    return res.status(500).json({
      error: "Failed to get rate limit status",
      code: "INTERNAL_ERROR",
    });
  }
};

// Export all rate limiters and utilities
export { createRateLimiter, createRedisStore, keyGenerator };
