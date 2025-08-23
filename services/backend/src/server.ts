import { Server } from "http";
import app from "./app.js";
// import { baseConfig } from "@/config/index.js";
// import logger, { logError } from "@/lib/logger.js";
// import redisClient from "@/lib/redis.js";
// import supabaseService from "@/lib/supabase.js";
// import cacheService from "@/services/cache.service.js";

// Simple config for testing
const simpleConfig = {
  server: {
    env: "development",
    port: 3000,
    host: "0.0.0.0",
    isDevelopment: true,
  },
  performance: {
    requestTimeout: 30000,
  },
};

// Health check endpoint is now defined in app.ts

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Simple cleanup for testing
    console.log("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("Graceful shutdown failed:", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection", {
    reason,
    promise,
    operation: "unhandled_rejection",
  });
  gracefulShutdown("unhandledRejection");
});

// Start server
const startServer = async (): Promise<Server> => {
  try {
    // Start HTTP server
    const server = app.listen(
      simpleConfig.server.port,
      simpleConfig.server.host,
      () => {
        console.log(
          `🚀 Server running on ${simpleConfig.server.host}:${simpleConfig.server.port}`,
          {
            environment: simpleConfig.server.env,
            nodeVersion: process.version,
            pid: process.pid,
          }
        );

        console.log(
          `📊 Health check: http://${simpleConfig.server.host}:${simpleConfig.server.port}/health`
        );
        console.log(
          `🏓 Test endpoint: http://${simpleConfig.server.host}:${simpleConfig.server.port}/api/test/health`
        );
      }
    );

    // Set server timeout
    server.timeout = simpleConfig.performance.requestTimeout;

    return server;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server only if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { startServer, gracefulShutdown };
export default startServer;
