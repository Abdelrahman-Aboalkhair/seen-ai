import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
// import { baseConfig } from "@/config/index.js";
// import logger, { logRequest, logError } from "@/lib/logger.js";

// Import routes
// import aiRoutes from "@/routes/ai.routes.js";
// import paymentRoutes from "@/routes/payment.routes.js";
// import talentRoutes from "@/routes/talent.routes.js";
import talentSearchRoutes from "@/routes/talent-search.routes.js";
import testRoutes from "@/routes/test.routes.js";

// Import middleware
// import { dynamicRateLimit, rateLimitStatus } from "@/middleware/rateLimiter.js";
// import { handleValidationError } from "@/middleware/validation.js";

const app: Express = express();

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-API-Key",
    ],
  })
);

// Body parsing middleware
app.use(
  express.json({
    limit: "10mb",
    verify: (req: Request, res: Response, buf: Buffer) => {
      // Store raw body for Stripe webhooks
      if (req.originalUrl === "/api/payment/webhook") {
        (req as any).rawBody = buf;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Request logging middleware
app.use(morgan("combined"));

// Custom request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const responseTime = Date.now() - startTime;
    console.log(
      `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`
    );
  });

  next();
});

// Apply dynamic rate limiting
// app.use(dynamicRateLimit);

// Rate limit status endpoint
// app.get("/api/rate-limit-status", rateLimitStatus);

// Health check endpoint (before authentication)
app.get("/health", async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Simple health check for testing (no external services)
    const status = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: "development",
      services: {
        redis: "healthy",
        supabase: "healthy",
        cache: "healthy",
      },
      responseTime: "0ms",
    };

    const responseTime = Date.now() - startTime;
    status.responseTime = `${responseTime}ms`;

    console.log("Health check endpoint called", status);

    res.status(200).json(status);
  } catch (error) {
    console.error("Health check failed:", error);

    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    });
  }
});

// API routes
// app.use("/api/ai", aiRoutes);
// app.use("/api/payment", paymentRoutes);
// app.use("/api/talent", talentRoutes);
app.use("/api/talent", talentSearchRoutes);
app.use("/api/test", testRoutes);

// API info endpoint
app.get("/api", (req: Request, res: Response) => {
  res.json({
    name: "Smart Recruiter Backend API",
    version: "1.0.0",
    description: "Custom Node.js backend for AI-heavy operations",
    environment: "development",
    timestamp: new Date().toISOString(),
    endpoints: {
      ai: "/api/ai",
      payment: "/api/payment",
      talent: "/api/talent",
      test: "/api/test",
      health: "/health",
      rateLimitStatus: "/api/rate-limit-status",
    },
    documentation: "https://docs.smartrecruiter.com/api",
  });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Smart Recruiter Backend API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    api: "/api",
    health: "/health",
  });
});

// Validation error handler
// app.use(handleValidationError);

// Global error handler
app.use(
  (error: Error, req: Request, res: Response, next: NextFunction): any => {
    console.error("Global error:", error, {
      operation: "global_error_handler",
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
    });

    // Handle specific error types
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        message: error.message,
      });
    }

    if (error.name === "UnauthorizedError") {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (error.message === "Not allowed by CORS") {
      return res.status(403).json({
        success: false,
        error: "CORS error",
        code: "CORS_ERROR",
        message: "Origin not allowed",
      });
    }

    // Default error response
    const statusCode = (error as any).statusCode || 500;

    res.status(statusCode).json({
      success: false,
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      message:
        "development" === "development"
          ? error.message
          : "Something went wrong",
      ...("development" === "development" && { stack: error.stack }),
    });
  }
);

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Not found",
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      api: "/api",
      ai: "/api/ai",
      payment: "/api/payment",
      talent: "/api/talent",
      health: "/health",
    },
  });
});

export default app;
