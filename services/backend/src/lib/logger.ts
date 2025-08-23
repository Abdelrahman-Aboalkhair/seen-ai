import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { baseConfig } from "@/config/index.js";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? JSON.stringify(meta, null, 2)
      : "";
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport for development
if (baseConfig.server.isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// File transports for production and development
if (!baseConfig.server.isTest) {
  // Daily rotate file for all logs
  transports.push(
    new DailyRotateFile({
      filename: `${baseConfig.logging.filePath}/app-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: logFormat,
    })
  );

  // Separate file for errors
  transports.push(
    new DailyRotateFile({
      filename: `${baseConfig.logging.filePath}/error-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "30d",
      format: logFormat,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: baseConfig.logging.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Add request logging helper
export const logRequest = (req: any, res: any, responseTime?: number) => {
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
  } else {
    logger.info("HTTP Request", logData);
  }
};

// Add error logging helper
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error("Application Error", {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
  });
};

// Add performance logging helper
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) => {
  logger.info("Performance Metric", {
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

// Add cache logging helper
export const logCache = (
  operation: "hit" | "miss" | "set" | "delete",
  key: string,
  metadata?: Record<string, any>
) => {
  logger.debug("Cache Operation", {
    operation,
    key,
    ...metadata,
  });
};

// Add external API logging helper
export const logExternalAPI = (
  service: string,
  operation: string,
  duration: number,
  success: boolean,
  metadata?: Record<string, any>
) => {
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
