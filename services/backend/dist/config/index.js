import { config } from "dotenv";
config();
import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z.string().transform(Number).default("3000"),
    HOST: z.string().default("0.0.0.0"),
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    SUPABASE_ANON_KEY: z.string(),
    OPENAI_API_KEY: z.string(),
    OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
    OPENAI_MODEL: z.string().default("gpt-4-turbo-preview"),
    N8N_WEBHOOK_URL: z.string().url(),
    N8N_API_KEY: z.string().optional(),
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    STRIPE_BASE_URL: z.string().url().default("https://api.stripe.com/v1"),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.string().transform(Number).default("0"),
    JWT_SECRET: z.string(),
    JWT_EXPIRES_IN: z.string().default("24h"),
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("900000"),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default("100"),
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
    LOG_FILE_PATH: z.string().default("./logs"),
    ALLOWED_ORIGINS: z
        .string()
        .default("http://localhost:5173,http://localhost:3000"),
    CACHE_TTL_CV_ANALYSIS: z.string().transform(Number).default("3600"),
    CACHE_TTL_QUESTIONS: z.string().transform(Number).default("7200"),
    CACHE_TTL_INTERVIEW_ANALYSIS: z.string().transform(Number).default("1800"),
    CACHE_TTL_JOB_REQUIREMENTS: z.string().transform(Number).default("14400"),
    MAX_CONCURRENT_REQUESTS: z.string().transform(Number).default("10"),
    REQUEST_TIMEOUT: z.string().transform(Number).default("30000"),
    BATCH_SIZE_LIMIT: z.string().transform(Number).default("5"),
});
const env = envSchema.parse(process.env);
export const baseConfig = {
    server: {
        env: env.NODE_ENV,
        port: env.PORT,
        host: env.HOST,
        isDevelopment: env.NODE_ENV === "development",
        isProduction: env.NODE_ENV === "production",
        isTest: env.NODE_ENV === "test",
    },
    supabase: {
        url: env.SUPABASE_URL,
        serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
        anonKey: env.SUPABASE_ANON_KEY,
    },
    openai: {
        apiKey: env.OPENAI_API_KEY,
        baseUrl: env.OPENAI_BASE_URL,
        model: env.OPENAI_MODEL,
    },
    n8n: {
        webhookUrl: env.N8N_WEBHOOK_URL,
        apiKey: env.N8N_API_KEY,
    },
    stripe: {
        secretKey: env.STRIPE_SECRET_KEY,
        webhookSecret: env.STRIPE_WEBHOOK_SECRET,
        baseUrl: env.STRIPE_BASE_URL,
    },
    redis: {
        url: env.REDIS_URL,
        password: env.REDIS_PASSWORD,
        db: env.REDIS_DB,
    },
    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
    },
    rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
    logging: {
        level: env.LOG_LEVEL,
        filePath: env.LOG_FILE_PATH,
    },
    cors: {
        origins: env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
    },
    cache: {
        ttl: {
            cvAnalysis: env.CACHE_TTL_CV_ANALYSIS,
            questions: env.CACHE_TTL_QUESTIONS,
            interviewAnalysis: env.CACHE_TTL_INTERVIEW_ANALYSIS,
            jobRequirements: env.CACHE_TTL_JOB_REQUIREMENTS,
        },
    },
    performance: {
        maxConcurrentRequests: env.MAX_CONCURRENT_REQUESTS,
        requestTimeout: env.REQUEST_TIMEOUT,
        batchSizeLimit: env.BATCH_SIZE_LIMIT,
    },
};
//# sourceMappingURL=index.js.map