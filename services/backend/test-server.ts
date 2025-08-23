import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

const app = express();
const PORT = 3000;

// Basic middleware
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

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());

// Request logging
app.use(morgan("combined"));

// Health check endpoint
app.get("/health", (req, res) => {
  const healthCheck = {
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

  console.log("Health check endpoint called", healthCheck);

  res.status(200).json(healthCheck);
});

// Test routes
app.get("/api/test/health", (req, res) => {
  const healthCheck = {
    success: true,
    message: "Hello World! Server is healthy and running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: "development",
    version: "1.0.0",
    status: "OK",
  };

  console.log("Test health endpoint called", healthCheck);

  res.status(200).json(healthCheck);
});

app.get("/api/test/ping", (req, res) => {
  res.json({
    success: true,
    message: "Pong! Backend is working",
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
app.get("/api", (req, res) => {
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
    },
  });
});

// Root endpoint
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

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      api: "/api",
      health: "/health",
      test: "/api/test",
    },
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🏓 Test endpoint: http://localhost:${PORT}/api/test/health`);
  console.log(`🏓 Ping endpoint: http://localhost:${PORT}/api/test/ping`);
});
