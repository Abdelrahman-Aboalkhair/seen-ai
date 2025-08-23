import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { baseConfig } from "@/config/index.js";
const logFormat = winston.format.combine(winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
}), winston.format.errors({ stack: true }), winston.format.json(), winston.format.prettyPrint());
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.simple(), winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length
        ? JSON.stringify(meta, null, 2)
        : "";
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
}));
const transports = [];
if (baseConfig.server.isDevelopment) {
    transports.push(new winston.transports.Console({
        format: consoleFormat,
    }));
}
if (!baseConfig.server.isTest) {
    transports.push(new DailyRotateFile({
        filename: `${baseConfig.logging.filePath}/app-%DATE%.log`,
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "14d",
        format: logFormat,
    }));
    transports.push(new DailyRotateFile({
        filename: `${baseConfig.logging.filePath}/error-%DATE%.log`,
        datePattern: "YYYY-MM-DD",
        level: "error",
        maxSize: "20m",
        maxFiles: "30d",
        format: logFormat,
    }));
}
const logger = winston.createLogger({
    level: baseConfig.logging.level,
    format: logFormat,
    transports,
    exitOnError: false,
});
export const logRequest = (req, res, responseTime) => {
    const logData = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        statusCode: res.statusCode,
        responseTime: responseTime ? `${responseTime}ms` : undefined,
        userId: req.user?.id,
    };
    if (res.statusCode >= 400) {
        logger.warn("HTTP Request", logData);
    }
    else {
        logger.info("HTTP Request", logData);
    }
};
export const logError = (error, context) => {
    logger.error("Application Error", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        context,
    });
};
export const logPerformance = (operation, duration, metadata) => {
    logger.info("Performance Metric", {
        operation,
        duration: `${duration}ms`,
        ...metadata,
    });
};
export const logCache = (operation, key, metadata) => {
    logger.debug("Cache Operation", {
        operation,
        key,
        ...metadata,
    });
};
export const logExternalAPI = (service, operation, duration, success, metadata) => {
    const level = success ? "info" : "warn";
    logger[level]("External API Call", {
        service,
        operation,
        duration: `${duration}ms`,
        success,
        ...metadata,
    });
};
export default logger;
//# sourceMappingURL=logger.js.map