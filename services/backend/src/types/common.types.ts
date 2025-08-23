// Common Types
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

// File upload types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      file?: UploadedFile;
      files?: UploadedFile[] | { [fieldname: string]: UploadedFile[] };
      user?: {
        id: string;
        email: string;
        role: string;
        credits: number;
      };
      authToken?: string;
    }
  }
}
