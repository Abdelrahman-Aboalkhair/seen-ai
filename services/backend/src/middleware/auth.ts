import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { baseConfig } from '@/config/index.js';
import supabaseService from '@/lib/supabase.js';
import cacheService from '@/services/cache.service.js';
import logger, { logError } from '@/lib/logger.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
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

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  credits: number;
}

// Extract token from Authorization header
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer token" and "token" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader;
};

// Verify JWT token
const verifyToken = async (token: string): Promise<any> => {
  try {
    // First try to verify with our JWT secret (for custom tokens)
    try {
      return jwt.verify(token, baseConfig.jwt.secret);
    } catch (jwtError) {
      // If JWT verification fails, try Supabase token verification
      const { user, error } = await supabaseService.verifyToken(token);
      if (error || !user) {
        throw new Error('Invalid token');
      }
      return user;
    }
  } catch (error) {
    logError(error as Error, { operation: 'verify_token' });
    throw error;
  }
};

// Get user data from cache or database
const getUserData = async (userId: string): Promise<AuthenticatedUser | null> => {
  try {
    // Try cache first
    const cachedUser = await cacheService.getUserSession(userId);
    if (cachedUser && typeof cachedUser === 'object' && cachedUser.id) {
      return cachedUser as AuthenticatedUser;
    }

    // Fetch from database
    const { data: user, error } = await supabaseService.getUser(userId);
    if (error || !user) {
      return null;
    }

    const userData: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      credits: user.credits,
    };

    // Cache user data for future requests
    await cacheService.setUserSession(userId, userData);

    return userData;
  } catch (error) {
    logError(error as Error, { operation: 'get_user_data', userId });
    return null;
  }
};

// Basic authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'MISSING_TOKEN',
      });
    }

    // Verify token
    const tokenData = await verifyToken(token);
    const userId = tokenData.id || tokenData.sub;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid token format',
        code: 'INVALID_TOKEN',
      });
    }

    // Get user data
    const userData = await getUserData(userId);
    if (!userData) {
      return res.status(401).json({
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND',
      });
    }

    // Attach user data to request
    req.user = userData;
    req.authToken = token;

    return next();
  } catch (error) {
    logError(error as Error, { operation: 'authenticate_middleware' });
    
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
      message: baseConfig.server.isDevelopment ? (error as Error).message : 'Invalid or expired token',
    });
  }
};

// Optional authentication middleware (for endpoints that work with or without auth)
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return next(); // Continue without authentication
    }

    const tokenData = await verifyToken(token);
    const userId = tokenData.id || tokenData.sub;

    if (userId) {
      const userData = await getUserData(userId);
      if (userData) {
        req.user = userData;
        req.authToken = token;
      }
    }

    return next();
  } catch (error) {
    // Log error but don't block request for optional auth
    logger.debug('Optional authentication failed', { error: (error as Error).message });
    return next();
  }
};

// Role-based authorization middleware
export const authorize = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'MISSING_AUTH',
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role,
      });
    }

    return next();
  };
};

// Admin authorization middleware
export const requireAdmin = authorize(['admin', 'super_admin']);

// Credit check middleware
export const requireCredits = (minCredits: number = 1) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'MISSING_AUTH',
      });
    }

    if (req.user.credits < minCredits) {
      logger.warn('Insufficient credits', {
        userId: req.user.id,
        currentCredits: req.user.credits,
        requiredCredits: minCredits,
      });
      
      return res.status(402).json({
        error: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS',
        current: req.user.credits,
        required: minCredits,
      });
    }

    return next();
  };
};

// API key authentication middleware (for service-to-service communication)
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      code: 'MISSING_API_KEY',
    });
  }

  // In a real implementation, you'd validate against a database of API keys
  // For now, we'll use a simple environment variable check
  const validApiKey = process.env.INTERNAL_API_KEY;
  
  if (!validApiKey || apiKey !== validApiKey) {
    logger.warn('Invalid API key attempt', { 
      providedKey: apiKey.substring(0, 8) + '...' 
    });
    
    return res.status(401).json({
      error: 'Invalid API key',
      code: 'INVALID_API_KEY',
    });
  }

  return next();
};

// Token refresh middleware
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.authToken) {
      return next();
    }

    // Check if token is close to expiration (within 1 hour)
    const decoded = jwt.decode(req.authToken) as any;
    if (decoded && decoded.exp) {
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      const oneHour = 60 * 60 * 1000;

      if (timeUntilExpiration < oneHour && timeUntilExpiration > 0) {
        // Token is close to expiration, refresh user data from database
        const userData = await getUserData(req.user.id);
        if (userData) {
          req.user = userData;
          // Update cache with fresh data
          await cacheService.setUserSession(req.user.id, userData);
        }
      }
    }

    return next();
  } catch (error) {
    logError(error as Error, { operation: 'refresh_token_middleware' });
    return next(); // Continue even if refresh fails
  }
};

// Middleware to validate user account status
export const validateAccountStatus = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'MISSING_AUTH',
    });
  }

  // Check if user account is suspended or inactive
  if (req.user.role === 'suspended') {
    logger.warn('Suspended user attempted access', { userId: req.user.id });
    
    return res.status(403).json({
      error: 'Account suspended',
      code: 'ACCOUNT_SUSPENDED',
      message: 'Your account has been suspended. Please contact support.',
    });
  }

  return next();
};

// Middleware to log user activity
export const logUserActivity = (action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user) {
      logger.info('User activity', {
        userId: req.user.id,
        action,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });
    }
    return next();
  };
};

// Combine multiple auth middlewares
export const fullAuth = [
  authenticate,
  validateAccountStatus,
  refreshToken,
];

export const adminAuth = [
  authenticate,
  validateAccountStatus,
  requireAdmin,
];

export const creditAuth = (minCredits: number = 1) => [
  authenticate,
  validateAccountStatus,
  requireCredits(minCredits),
  refreshToken,
];

// Export utility functions
export { extractToken, verifyToken, getUserData };
