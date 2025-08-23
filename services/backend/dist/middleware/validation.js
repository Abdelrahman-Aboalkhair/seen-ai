import { z, ZodError } from 'zod';
import { validationResult, body, param } from 'express-validator';
import logger, { logError } from '@/lib/logger.js';
export const validateSchema = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
            const validatedData = schema.parse(data);
            if (source === 'body') {
                req.body = validatedData;
            }
            else if (source === 'params') {
                req.params = validatedData;
            }
            else {
                req.query = validatedData;
            }
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));
                logger.warn('Validation failed', {
                    source,
                    errors: formattedErrors,
                    userId: req.user?.id,
                    endpoint: req.originalUrl,
                });
                return res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: formattedErrors,
                });
            }
            logError(error, { operation: 'schema_validation', source });
            return res.status(500).json({
                error: 'Validation error',
                code: 'INTERNAL_ERROR',
            });
        }
    };
};
export const validateFields = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const formattedErrors = errors.array().map(err => ({
                field: err.type === 'field' ? err.path : 'unknown',
                message: err.msg,
                value: err.type === 'field' ? err.value : undefined,
            }));
            logger.warn('Field validation failed', {
                errors: formattedErrors,
                userId: req.user?.id,
                endpoint: req.originalUrl,
            });
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: formattedErrors,
            });
        }
        next();
    };
};
export const schemas = {
    cvAnalysis: z.object({
        cvText: z.string().min(100, 'CV text must be at least 100 characters').max(50000, 'CV text too long'),
        jobRequirements: z.string().min(50, 'Job requirements must be at least 50 characters').max(10000, 'Job requirements too long'),
    }),
    questionGeneration: z.object({
        jobTitle: z.string().min(2, 'Job title must be at least 2 characters').max(100, 'Job title too long'),
        skills: z.array(z.string().min(1).max(50)).min(1, 'At least one skill required').max(20, 'Too many skills'),
        count: z.number().int().min(1, 'Must generate at least 1 question').max(20, 'Cannot generate more than 20 questions'),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
        type: z.enum(['technical', 'behavioral', 'mixed']).optional(),
    }),
    interviewAnalysis: z.object({
        sessionId: z.string().uuid('Invalid session ID format'),
        questions: z.array(z.object({
            id: z.string(),
            question: z.string().min(10),
            type: z.enum(['technical', 'behavioral']),
            difficulty: z.enum(['easy', 'medium', 'hard']),
        })).min(1),
        answers: z.array(z.object({
            questionId: z.string(),
            answer: z.string().min(1, 'Answer cannot be empty').max(5000, 'Answer too long'),
            duration: z.number().int().min(0),
        })).min(1),
    }),
    jobRequirements: z.object({
        jobTitle: z.string().min(2).max(100),
        department: z.string().max(50).optional(),
        experience: z.string().max(50).optional(),
        location: z.string().max(100).optional(),
        companySize: z.string().max(50).optional(),
        industry: z.string().max(50).optional(),
    }),
    talentSearch: z.object({
        jobTitle: z.string().min(2).max(100).optional(),
        skills: z.array(z.string().min(1).max(50)).max(20).optional(),
        location: z.string().max(100).optional(),
        experience: z.string().max(50).optional(),
        education: z.string().max(100).optional(),
        salaryRange: z.object({
            min: z.number().int().min(0),
            max: z.number().int().min(0),
        }).refine(data => data.max >= data.min, 'Max salary must be greater than or equal to min salary').optional(),
        remote: z.boolean().optional(),
        industry: z.string().max(50).optional(),
        companySize: z.string().max(50).optional(),
    }).refine(data => data.jobTitle || data.skills || data.location || data.experience || data.education || data.industry, 'At least one search criterion must be provided'),
    payment: z.object({
        amount: z.number().int().min(100, 'Minimum payment amount is $1.00').max(100000, 'Maximum payment amount is $1,000.00'),
        currency: z.string().length(3, 'Currency must be 3 characters').toUpperCase(),
        credits: z.number().int().min(1, 'Must purchase at least 1 credit').max(1000, 'Cannot purchase more than 1000 credits at once'),
        description: z.string().min(5).max(200),
        paymentMethodId: z.string().optional(),
        metadata: z.record(z.string()).optional(),
    }),
    refund: z.object({
        paymentIntentId: z.string().min(1, 'Payment intent ID required'),
        amount: z.number().int().min(1).optional(),
        reason: z.string().max(200).optional(),
    }),
    userUpdate: z.object({
        name: z.string().min(1).max(100).optional(),
        email: z.string().email('Invalid email format').optional(),
        role: z.enum(['user', 'admin', 'super_admin']).optional(),
    }),
    pagination: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0, 'Page must be positive').optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
        sort: z.string().max(50).optional(),
        order: z.enum(['asc', 'desc']).optional(),
    }),
    fileUpload: z.object({
        filename: z.string().min(1).max(255),
        mimetype: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_.]*$/),
        size: z.number().int().min(1).max(10 * 1024 * 1024),
    }),
};
export const fieldValidations = {
    email: () => body('email').isEmail().normalizeEmail(),
    password: () => body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase, one uppercase, and one number'),
    uuid: (field) => param(field).isUUID().withMessage(`${field} must be a valid UUID`),
    positiveInt: (field) => body(field)
        .isInt({ min: 1 })
        .withMessage(`${field} must be a positive integer`),
    stringLength: (field, min = 1, max = 255) => body(field)
        .isLength({ min, max })
        .withMessage(`${field} must be between ${min} and ${max} characters`)
        .trim(),
    array: (field, minLength = 1, maxLength = 100) => body(field)
        .isArray({ min: minLength, max: maxLength })
        .withMessage(`${field} must be an array with ${minLength}-${maxLength} items`),
    numericRange: (field, min, max) => body(field)
        .isFloat({ min, max })
        .withMessage(`${field} must be between ${min} and ${max}`),
    date: (field) => body(field)
        .isISO8601()
        .withMessage(`${field} must be a valid ISO 8601 date`),
    url: (field) => body(field)
        .isURL()
        .withMessage(`${field} must be a valid URL`),
    phone: (field) => body(field)
        .isMobilePhone('any')
        .withMessage(`${field} must be a valid phone number`),
    creditCard: (field) => body(field)
        .isCreditCard()
        .withMessage(`${field} must be a valid credit card number`),
};
export const customValidations = {
    validateFileUpload: (allowedTypes, maxSize = 10 * 1024 * 1024) => {
        return (req, res, next) => {
            if (!req.file && !req.files) {
                return res.status(400).json({
                    error: 'No file uploaded',
                    code: 'MISSING_FILE',
                });
            }
            const file = req.file || (Array.isArray(req.files) ? req.files[0] : Object.values(req.files || {})[0]);
            if (!file) {
                return res.status(400).json({
                    error: 'Invalid file',
                    code: 'INVALID_FILE',
                });
            }
            const fileType = Array.isArray(file) ? file[0]?.mimetype : file.mimetype;
            if (!allowedTypes.includes(fileType)) {
                return res.status(400).json({
                    error: 'Invalid file type',
                    code: 'INVALID_FILE_TYPE',
                    allowed: allowedTypes,
                    received: fileType,
                });
            }
            const fileSize = Array.isArray(file) ? file[0]?.size : file.size;
            if (fileSize > maxSize) {
                return res.status(400).json({
                    error: 'File too large',
                    code: 'FILE_TOO_LARGE',
                    maxSize,
                    received: fileSize,
                });
            }
            next();
        };
    },
    validateJSON: (req, res, next) => {
        if (req.is('application/json')) {
            try {
                if (typeof req.body === 'string') {
                    req.body = JSON.parse(req.body);
                }
            }
            catch (error) {
                return res.status(400).json({
                    error: 'Invalid JSON',
                    code: 'INVALID_JSON',
                });
            }
        }
        next();
    },
    validateRequestSize: (maxSize = 1024 * 1024) => {
        return (req, res, next) => {
            const contentLength = parseInt(req.get('content-length') || '0');
            if (contentLength > maxSize) {
                return res.status(413).json({
                    error: 'Request too large',
                    code: 'REQUEST_TOO_LARGE',
                    maxSize,
                    received: contentLength,
                });
            }
            next();
        };
    },
    validateContentType: (allowedTypes) => {
        return (req, res, next) => {
            const contentType = req.get('content-type') || '';
            if (!allowedTypes.some(type => contentType.includes(type))) {
                return res.status(415).json({
                    error: 'Unsupported content type',
                    code: 'UNSUPPORTED_CONTENT_TYPE',
                    allowed: allowedTypes,
                    received: contentType,
                });
            }
            next();
        };
    },
};
export const sanitize = {
    stripHtml: (fields) => {
        return (req, res, next) => {
            fields.forEach(field => {
                if (req.body[field] && typeof req.body[field] === 'string') {
                    req.body[field] = req.body[field].replace(/<[^>]*>/g, '');
                }
            });
            next();
        };
    },
    trimFields: (fields) => {
        return (req, res, next) => {
            fields.forEach(field => {
                if (req.body[field] && typeof req.body[field] === 'string') {
                    req.body[field] = req.body[field].trim();
                }
            });
            next();
        };
    },
    lowercase: (fields) => {
        return (req, res, next) => {
            fields.forEach(field => {
                if (req.body[field] && typeof req.body[field] === 'string') {
                    req.body[field] = req.body[field].toLowerCase();
                }
            });
            next();
        };
    },
};
export const handleValidationError = (error, req, res, next) => {
    if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
        }));
        return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: formattedErrors,
        });
    }
    next(error);
};
export const commonValidations = {
    cvAnalysis: [validateSchema(schemas.cvAnalysis)],
    questionGeneration: [validateSchema(schemas.questionGeneration)],
    interviewAnalysis: [validateSchema(schemas.interviewAnalysis)],
    payment: [validateSchema(schemas.payment)],
    talentSearch: [validateSchema(schemas.talentSearch)],
    pagination: [validateSchema(schemas.pagination, 'query')],
    uuidParam: (paramName) => [validateFields([fieldValidations.uuid(paramName)])],
};
export default {
    validateSchema,
    validateFields,
    schemas,
    fieldValidations,
    customValidations,
    sanitize,
    handleValidationError,
    commonValidations,
};
//# sourceMappingURL=validation.js.map