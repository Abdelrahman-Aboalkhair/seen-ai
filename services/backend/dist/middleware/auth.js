import jwt from 'jsonwebtoken';
import { baseConfig } from '@/config/index.js';
import supabaseService from '@/lib/supabase.js';
import cacheService from '@/services/cache.service.js';
import logger, { logError } from '@/lib/logger.js';
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return null;
    }
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return authHeader;
};
const verifyToken = async (token) => {
    try {
        try {
            return jwt.verify(token, baseConfig.jwt.secret);
        }
        catch (jwtError) {
            const { user, error } = await supabaseService.verifyToken(token);
            if (error || !user) {
                throw new Error('Invalid token');
            }
            return user;
        }
    }
    catch (error) {
        logError(error, { operation: 'verify_token' });
        throw error;
    }
};
const getUserData = async (userId) => {
    try {
        const cachedUser = await cacheService.getUserSession(userId);
        if (cachedUser) {
            return cachedUser;
        }
        const { data: user, error } = await supabaseService.getUser(userId);
        if (error || !user) {
            return null;
        }
        const userData = {
            id: user.id,
            email: user.email,
            role: user.role,
            credits: user.credits,
        };
        await cacheService.setUserSession(userId, userData);
        return userData;
    }
    catch (error) {
        logError(error, { operation: 'get_user_data', userId });
        return null;
    }
};
export const authenticate = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'MISSING_TOKEN',
            });
        }
        const tokenData = await verifyToken(token);
        const userId = tokenData.id || tokenData.sub;
        if (!userId) {
            return res.status(401).json({
                error: 'Invalid token format',
                code: 'INVALID_TOKEN',
            });
        }
        const userData = await getUserData(userId);
        if (!userData) {
            return res.status(401).json({
                error: 'User not found or inactive',
                code: 'USER_NOT_FOUND',
            });
        }
        req.user = userData;
        req.authToken = token;
        next();
    }
    catch (error) {
        logError(error, { operation: 'authenticate_middleware' });
        return res.status(401).json({
            error: 'Authentication failed',
            code: 'AUTH_FAILED',
            message: baseConfig.server.isDevelopment ? error.message : 'Invalid or expired token',
        });
    }
};
export const optionalAuthenticate = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return next();
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
        next();
    }
    catch (error) {
        logger.debug('Optional authentication failed', { error: error.message });
        next();
    }
};
export const authorize = (roles) => {
    return (req, res, next) => {
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
        next();
    };
};
export const requireAdmin = authorize(['admin', 'super_admin']);
export const requireCredits = (minCredits = 1) => {
    return (req, res, next) => {
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
        next();
    };
};
export const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({
            error: 'API key required',
            code: 'MISSING_API_KEY',
        });
    }
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
    next();
};
export const refreshToken = async (req, res, next) => {
    try {
        if (!req.user || !req.authToken) {
            return next();
        }
        const decoded = jwt.decode(req.authToken);
        if (decoded && decoded.exp) {
            const expirationTime = decoded.exp * 1000;
            const currentTime = Date.now();
            const timeUntilExpiration = expirationTime - currentTime;
            const oneHour = 60 * 60 * 1000;
            if (timeUntilExpiration < oneHour && timeUntilExpiration > 0) {
                const userData = await getUserData(req.user.id);
                if (userData) {
                    req.user = userData;
                    await cacheService.setUserSession(req.user.id, userData);
                }
            }
        }
        next();
    }
    catch (error) {
        logError(error, { operation: 'refresh_token_middleware' });
        next();
    }
};
export const validateAccountStatus = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required',
            code: 'MISSING_AUTH',
        });
    }
    if (req.user.role === 'suspended') {
        logger.warn('Suspended user attempted access', { userId: req.user.id });
        return res.status(403).json({
            error: 'Account suspended',
            code: 'ACCOUNT_SUSPENDED',
            message: 'Your account has been suspended. Please contact support.',
        });
    }
    next();
};
export const logUserActivity = (action) => {
    return (req, res, next) => {
        if (req.user) {
            logger.info('User activity', {
                userId: req.user.id,
                action,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString(),
            });
        }
        next();
    };
};
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
export const creditAuth = (minCredits = 1) => [
    authenticate,
    validateAccountStatus,
    requireCredits(minCredits),
    refreshToken,
];
export { extractToken, verifyToken, getUserData };
//# sourceMappingURL=auth.js.map