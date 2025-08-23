import { z } from "zod";

// Minimal test configuration for development
export const testConfig = {
  server: {
    env: "development" as const,
    port: 3000,
    host: "0.0.0.0",
    isDevelopment: true,
    isProduction: false,
    isTest: false,
  },

  cors: {
    origins: ["http://localhost:5173", "http://localhost:3000"],
  },

  performance: {
    requestTimeout: 30000,
  },

  // Mock service configurations for testing
  supabase: {
    url: "https://test.supabase.co",
    serviceRoleKey: "test_key",
    anonKey: "test_anon_key",
  },

  openai: {
    apiKey: "test_openai_key",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4-turbo-preview",
  },

  n8n: {
    webhookUrl: "https://test.n8n.io/webhook",
    apiKey: "test_n8n_key",
  },

  stripe: {
    secretKey: "test_stripe_key",
    webhookSecret: "test_webhook_secret",
    baseUrl: "https://api.stripe.com/v1",
  },

  redis: {
    url: "redis://localhost:6379",
    password: "",
    db: 0,
  },

  jwt: {
    secret: "test_jwt_secret_key_for_development_only",
    expiresIn: "24h",
  },

  rateLimit: {
    windowMs: 900000,
    maxRequests: 100,
  },

  logging: {
    level: "info" as const,
    filePath: "./logs",
  },

  cache: {
    ttl: {
      cvAnalysis: 3600,
      questions: 7200,
      interviewAnalysis: 1800,
      jobRequirements: 14400,
    },
  },
};
