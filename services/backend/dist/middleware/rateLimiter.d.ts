import { Request, Response, NextFunction } from "express";
export declare const rateLimitConfig: {
    general: {
        windowMs: number;
        max: number;
        message: {
            error: string;
            code: string;
            retryAfter: number;
        };
    };
    ai: {
        windowMs: number;
        max: number;
        message: {
            error: string;
            code: string;
            retryAfter: number;
        };
    };
    payment: {
        windowMs: number;
        max: number;
        message: {
            error: string;
            code: string;
            retryAfter: number;
        };
    };
    auth: {
        windowMs: number;
        max: number;
        message: {
            error: string;
            code: string;
            retryAfter: number;
        };
    };
    upload: {
        windowMs: number;
        max: number;
        message: {
            error: string;
            code: string;
            retryAfter: number;
        };
    };
};
declare const keyGenerator: (req: Request) => string;
declare const createRedisStore: (windowMs: number) => {
    incr: (key: string) => Promise<{
        totalHits: number;
        resetTime?: Date;
    }>;
    decrement: (key: string) => Promise<void>;
    resetKey: (key: string) => Promise<void>;
};
declare const createRateLimiter: (options: {
    windowMs: number;
    max: number;
    message: any;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const aiRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const paymentRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const uploadRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const createUserSpecificRateLimit: (baseConfig: {
    windowMs: number;
    max: number;
    message: any;
}, userLimits?: Record<string, number>) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const creditBasedRateLimit: (creditsPerRequest?: number) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createBurstRateLimit: (shortWindow: {
    windowMs: number;
    max: number;
}, longWindow: {
    windowMs: number;
    max: number;
}, message: any) => import("express-rate-limit").RateLimitRequestHandler[];
export declare const createIPRateLimit: (options: {
    windowMs: number;
    max: number;
    message: any;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const adminBypass: (limiter: any) => (req: Request, res: Response, next: NextFunction) => any;
export declare const dynamicRateLimit: (req: Request, res: Response, next: NextFunction) => void;
export declare const rateLimitStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export { createRateLimiter, createRedisStore, keyGenerator };
//# sourceMappingURL=rateLimiter.d.ts.map