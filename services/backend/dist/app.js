import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { baseConfig } from "@/config/index.js";
import logger, { logRequest, logError } from "@/lib/logger.js";
import redisClient from "@/lib/redis.js";
import supabaseService from "@/lib/supabase.js";
import cacheService from "@/services/cache.service.js";
import aiRoutes from "@/routes/ai.routes.js";
import paymentRoutes from "@/routes/payment.routes.js";
import talentRoutes from "@/routes/talent.routes.js";
import { dynamicRateLimit, rateLimitStatus } from "@/middleware/rateLimiter.js";
import { handleValidationError } from "@/middleware/validation.js";
const app = express();
app.set("trust proxy", 1);
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use(cors({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (baseConfig.cors.origins.includes(origin)) {
            return callback(null, true);
        }
        if (baseConfig.server.isDevelopment && origin.includes("localhost")) {
            return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-API-Key",
    ],
}));
app.use(express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
        if (req.originalUrl === "/api/payment/webhook") {
            req.rawBody = buf;
        }
    },
}));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());
app.use(morgan("combined", {
    stream: {
        write: (message) => logger.info(message.trim()),
    },
}));
app.use((req, res, next) => {
    const startTime = Date.now();
    res.on("finish", () => {
        const responseTime = Date.now() - startTime;
        logRequest(req, res, responseTime);
    });
    next();
});
app.use(dynamicRateLimit);
app.get("/health", async (req, res) => {
    try {
        const startTime = Date.now();
        const [redisHealth, supabaseHealth, cacheHealth] = await Promise.all([
            redisClient.isHealthy(),
            supabaseService.healthCheck(),
            cacheService.healthCheck(),
        ]);
        const responseTime = Date.now() - startTime;
        const status = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            environment: baseConfig.server.env,
            services: {
                redis: redisHealth ? "healthy" : "unhealthy",
                supabase: supabaseHealth ? "healthy" : "unhealthy",
                cache: cacheHealth ? "healthy" : "unhealthy",
            },
            responseTime: `${responseTime}ms`,
        };
        const allHealthy = Object.values(status.services).every((s) => s === "healthy");
        res.status(allHealthy ? 200 : 503).json(status);
    }
    catch (error) {
        logError(error, { operation: "health_check" });
        res.status(503).json({
            status: "error",
            timestamp: new Date().toISOString(),
            error: "Health check failed",
        });
    }
});
app.get("/api/rate-limit-status", rateLimitStatus);
app.use("/api/ai", aiRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/talent", talentRoutes);
app.get("/api", (req, res) => {
    res.json({
        name: "Smart Recruiter Backend API",
        version: "1.0.0",
        description: "Custom Node.js backend for AI-heavy operations",
        environment: baseConfig.server.env,
        timestamp: new Date().toISOString(),
        endpoints: {
            ai: "/api/ai",
            payment: "/api/payment",
            talent: "/api/talent",
            health: "/health",
            rateLimitStatus: "/api/rate-limit-status",
        },
        documentation: "https://docs.smartrecruiter.com/api",
    });
});
app.get("/", (req, res) => {
    res.json({
        message: "Smart Recruiter Backend API",
        version: "1.0.0",
        status: "running",
        timestamp: new Date().toISOString(),
        api: "/api",
        health: "/health",
    });
});
app.use(handleValidationError);
app.use((error, req, res, next) => {
    logError(error, {
        operation: "global_error_handler",
        url: req.originalUrl,
        method: req.method,
        userId: req.user?.id,
    });
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
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        message: baseConfig.server.isDevelopment
            ? error.message
            : "Something went wrong",
        ...(baseConfig.server.isDevelopment && { stack: error.stack }),
    });
});
app.use("*", (req, res) => {
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
const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    try {
        await redisClient.disconnect();
        logger.info("Redis connection closed");
        logger.info("Graceful shutdown completed");
        process.exit(0);
    }
    catch (error) {
        logError(error, { operation: "graceful_shutdown" });
        process.exit(1);
    }
};
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("uncaughtException", (error) => {
    logError(error, { operation: "uncaught_exception" });
    gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection", {
        reason,
        promise,
        operation: "unhandled_rejection",
    });
    gracefulShutdown("unhandledRejection");
});
const startServer = async () => {
    try {
        await redisClient.connect();
        logger.info("Redis connected successfully");
        await cacheService.warmCache();
        const server = app.listen(baseConfig.server.port, baseConfig.server.host, () => {
            logger.info(`Server running on ${baseConfig.server.host}:${baseConfig.server.port}`, {
                environment: baseConfig.server.env,
                nodeVersion: process.version,
                pid: process.pid,
            });
        });
        server.timeout = baseConfig.performance.requestTimeout;
        return server;
    }
    catch (error) {
        logError(error, { operation: "start_server" });
        process.exit(1);
    }
};
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer();
}
export default app;
//# sourceMappingURL=app.js.map