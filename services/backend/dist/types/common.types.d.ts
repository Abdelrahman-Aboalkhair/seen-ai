export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
    message?: string;
    creditsRemaining?: number;
    processingTime?: number;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
    sort?: string;
    order?: "asc" | "desc";
}
export interface PaginationResult<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface HealthCheckResult {
    service: string;
    status: "healthy" | "unhealthy" | "error";
    timestamp: string;
    responseTime?: number;
    error?: string;
}
export interface ServiceConfig {
    retries: number;
    timeout: number;
    backoffDelay: number;
}
export interface CacheOptions {
    ttl?: number;
    prefix?: string;
    useCompression?: boolean;
}
export interface LogContext {
    operation?: string;
    userId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
}
export interface RateLimitInfo {
    current: number;
    limit: number;
    remaining: number;
    resetTime: Date;
    windowMs: number;
}
//# sourceMappingURL=common.types.d.ts.map