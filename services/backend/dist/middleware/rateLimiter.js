import rateLimit from "express-rate-limit";
import { baseConfig } from "@/config/index.js";
import cacheService from "@/services/cache.service.js";
import logger, { logError } from "@/lib/logger.js";
export const rateLimitConfig = {
    general: {
        windowMs: baseConfig.rateLimit.windowMs,
        max: baseConfig.rateLimit.maxRequests,
        message: {
            error: "Too many requests",
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter: Math.ceil(baseConfig.rateLimit.windowMs / 1000),
        },
    },
    ai: {
        windowMs: 15 * 60 * 1000,
        max: 20,
        message: {
            error: "Too many AI requests",
            code: "AI_RATE_LIMIT_EXCEEDED",
            retryAfter: 900,
        },
    },
    payment: {
        windowMs: 60 * 60 * 1000,
        max: 5,
        message: {
            error: "Too many payment attempts",
            code: "PAYMENT_RATE_LIMIT_EXCEEDED",
            retryAfter: 3600,
        },
    },
    auth: {
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: {
            error: "Too many authentication attempts",
            code: "AUTH_RATE_LIMIT_EXCEEDED",
            retryAfter: 900,
        },
    },
    upload: {
        windowMs: 60 * 1000,
        max: 10,
        message: {
            error: "Too many upload requests",
            code: "UPLOAD_RATE_LIMIT_EXCEEDED",
            retryAfter: 60,
        },
    },
};
const keyGenerator = (req) => {
    if (req.user?.id) {
        return `rate_limit:user:${req.user.id}`;
    }
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    return `rate_limit:ip:${ip}`;
};
const createRedisStore = (windowMs) => {
    return {
        incr: async (key) => {
            try {
                const count = await cacheService.incrementRateLimit(key.replace("rate_limit:", ""), "api", windowMs);
                const resetTime = new Date(Date.now() + windowMs);
                return { totalHits: count, resetTime };
            }
            catch (error) {
                logError(error, { operation: "rate_limit_incr", key });
                return { totalHits: 1 };
            }
        },
        decrement: async (key) => {
        },
        resetKey: async (key) => {
            try {
                await cacheService.delete(key.replace("rate_limit:", ""));
            }
            catch (error) {
                logError(error, { operation: "rate_limit_reset", key });
            }
        },
    };
};
const createRateLimiter = (options) => {
    return rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        message: options.message,
        keyGenerator,
        store: createRedisStore(options.windowMs),
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        skipFailedRequests: options.skipFailedRequests || false,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
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
export const generalRateLimit = createRateLimiter(rateLimitConfig.general);
export const aiRateLimit = createRateLimiter(rateLimitConfig.ai);
export const paymentRateLimit = createRateLimiter(rateLimitConfig.payment);
export const authRateLimit = createRateLimiter(rateLimitConfig.auth);
export const uploadRateLimit = createRateLimiter(rateLimitConfig.upload);
export const createUserSpecificRateLimit = (baseConfig, userLimits = {}) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const key = keyGenerator(req);
            const userLimit = userId && userLimits[userId]
                ? userLimits[userId]
                : rateLimitConfig.general.max;
            const currentCount = await cacheService.getRateLimitCount(userId || req.ip || "unknown", req.route?.path || req.originalUrl);
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
            await cacheService.incrementRateLimit(userId || req.ip || "unknown", req.route?.path || req.originalUrl, rateLimitConfig.general.windowMs);
            next();
        }
        catch (error) {
            logError(error, { operation: "user_specific_rate_limit" });
            next();
        }
    };
};
export const creditBasedRateLimit = (creditsPerRequest = 1) => {
    return async (req, res, next) => {
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
            next();
        }
        catch (error) {
            logError(error, { operation: "credit_based_rate_limit" });
            next();
        }
    };
};
export const createBurstRateLimit = (shortWindow, longWindow, message) => {
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
export const createIPRateLimit = (options) => {
    return rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        message: options.message,
        keyGenerator: (req) => {
            const ip = req.ip || req.connection.remoteAddress || "unknown";
            return `ip_rate_limit:${ip}`;
        },
        store: createRedisStore(options.windowMs),
        handler: (req, res) => {
            logger.warn("IP rate limit exceeded", {
                ip: req.ip,
                userAgent: req.get("User-Agent"),
                endpoint: req.originalUrl,
            });
            res.status(429).json(options.message);
        },
    });
};
export const adminBypass = (limiter) => {
    return (req, res, next) => {
        if (req.user?.role === "admin" || req.user?.role === "super_admin") {
            logger.debug("Rate limit bypassed for admin", { userId: req.user.id });
            return next();
        }
        return limiter(req, res, next);
    };
};
export const dynamicRateLimit = (req, res, next) => {
    const endpoint = req.originalUrl;
    if (endpoint.includes("/ai/") ||
        endpoint.includes("/analyze") ||
        endpoint.includes("/generate")) {
        return aiRateLimit(req, res, next);
    }
    if (endpoint.includes("/payment") || endpoint.includes("/stripe")) {
        return paymentRateLimit(req, res, next);
    }
    if (endpoint.includes("/auth") ||
        endpoint.includes("/login") ||
        endpoint.includes("/register")) {
        return authRateLimit(req, res, next);
    }
    if (endpoint.includes("/upload") ||
        (req.method === "POST" && req.is("multipart/form-data"))) {
        return uploadRateLimit(req, res, next);
    }
    return generalRateLimit(req, res, next);
};
export const rateLimitStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        const ip = req.ip || "unknown";
        if (!userId && ip === "unknown") {
            return res.status(400).json({
                error: "Unable to determine rate limit status",
                code: "INVALID_REQUEST",
            });
        }
        const endpoints = ["api", "ai", "payment", "auth", "upload"];
        const status = {};
        for (const endpoint of endpoints) {
            const count = await cacheService.getRateLimitCount(userId || ip, endpoint);
            const config = rateLimitConfig[endpoint] ||
                rateLimitConfig.general;
            status[endpoint] = {
                current: count,
                limit: config.max,
                windowMs: config.windowMs,
                remaining: Math.max(0, config.max - count),
                resetTime: new Date(Date.now() + config.windowMs).toISOString(),
            };
        }
        res.json({
            userId,
            ip: userId ? undefined : ip,
            limits: status,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logError(error, { operation: "rate_limit_status" });
        res.status(500).json({
            error: "Failed to get rate limit status",
            code: "INTERNAL_ERROR",
        });
    }
};
export { createRateLimiter, createRedisStore, keyGenerator };
//# sourceMappingURL=rateLimiter.js.map