import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { validationResult, body, param, query, ValidationChain } from 'express-validator';
import logger, { logError } from '@/lib/logger.js';
import '@/types/common.types.js'; // Import type declarations

// Zod validation middleware
export const validateSchema = <T>(schema: ZodSchema<T>, source: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
      
      const validatedData = schema.parse(data);
      
      // Replace the original data with validated data
      if (source === 'body') {
        req.body = validatedData;
      } else if (source === 'params') {
        req.params = validatedData as any;
      } else {
        req.query = validatedData as any;
      }
      
      return next();
    } catch (error) {
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
      
      logError(error as Error, { operation: 'schema_validation', source });
      return res.status(500).json({
        error: 'Validation error',
        code: 'INTERNAL_ERROR',
      });
    }
  };
};

// Express-validator middleware wrapper
export const validateFields = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(err => ({
        field: err.type === 'field' ? (err as any).path : 'unknown',
        message: err.msg,
        value: err.type === 'field' ? (err as any).value : undefined,
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
    
    return next();
  };
};

// Common validation schemas
export const schemas = {
  // CV Analysis
  cvAnalysis: z.object({
    cvText: z.string().min(100, 'CV text must be at least 100 characters').max(50000, 'CV text too long'),
    jobRequirements: z.string().min(50, 'Job requirements must be at least 50 characters').max(10000, 'Job requirements too long'),
  }),
  
  // Question Generation
  questionGeneration: z.object({
    jobTitle: z.string().min(2, 'Job title must be at least 2 characters').max(100, 'Job title too long'),
    skills: z.array(z.string().min(1).max(50)).min(1, 'At least one skill required').max(20, 'Too many skills'),
    count: z.number().int().min(1, 'Must generate at least 1 question').max(20, 'Cannot generate more than 20 questions'),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    type: z.enum(['technical', 'behavioral', 'mixed']).optional(),
  }),
  
  // Interview Analysis
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
  
  // Job Requirements
  jobRequirements: z.object({
    jobTitle: z.string().min(2).max(100),
    department: z.string().max(50).optional(),
    experience: z.string().max(50).optional(),
    location: z.string().max(100).optional(),
    companySize: z.string().max(50).optional(),
    industry: z.string().max(50).optional(),
  }),
  
  // Talent Search
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
  }).refine(data => 
    data.jobTitle || data.skills || data.location || data.experience || data.education || data.industry,
    'At least one search criterion must be provided'
  ),
  
  // Payment
  payment: z.object({
    amount: z.number().int().min(100, 'Minimum payment amount is $1.00').max(100000, 'Maximum payment amount is $1,000.00'),
    currency: z.string().length(3, 'Currency must be 3 characters').toUpperCase(),
    credits: z.number().int().min(1, 'Must purchase at least 1 credit').max(1000, 'Cannot purchase more than 1000 credits at once'),
    description: z.string().min(5).max(200),
    paymentMethodId: z.string().optional(),
    metadata: z.record(z.string()).optional(),
  }),
  
  // Refund
  refund: z.object({
    paymentIntentId: z.string().min(1, 'Payment intent ID required'),
    amount: z.number().int().min(1).optional(),
    reason: z.string().max(200).optional(),
  }),
  
  // User Update
  userUpdate: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email('Invalid email format').optional(),
    role: z.enum(['user', 'admin', 'super_admin']).optional(),
  }),
  
  // Pagination
  pagination: z.object({
    page: z.union([
      z.string().regex(/^\d+$/).transform(Number),
      z.number()
    ]).refine(n => n > 0, 'Page must be positive').optional(),
    limit: z.union([
      z.string().regex(/^\d+$/).transform(Number),
      z.number()
    ]).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
    sort: z.string().max(50).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
  
  // File Upload
  fileUpload: z.object({
    filename: z.string().min(1).max(255),
    mimetype: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_.]*$/),
    size: z.number().int().min(1).max(10 * 1024 * 1024), // 10MB max
  }),
};

// Express-validator field validations
export const fieldValidations = {
  // Email validation
  email: () => body('email').isEmail().normalizeEmail(),
  
  // Password validation
  password: () => body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase, one uppercase, and one number'),
  
  // UUID validation
  uuid: (field: string) => param(field).isUUID().withMessage(`${field} must be a valid UUID`),
  
  // Positive integer validation
  positiveInt: (field: string) => body(field)
    .isInt({ min: 1 })
    .withMessage(`${field} must be a positive integer`),
  
  // String length validation
  stringLength: (field: string, min: number = 1, max: number = 255) => 
    body(field)
      .isLength({ min, max })
      .withMessage(`${field} must be between ${min} and ${max} characters`)
      .trim(),
  
  // Array validation
  array: (field: string, minLength: number = 1, maxLength: number = 100) =>
    body(field)
      .isArray({ min: minLength, max: maxLength })
      .withMessage(`${field} must be an array with ${minLength}-${maxLength} items`),
  
  // Numeric range validation
  numericRange: (field: string, min: number, max: number) =>
    body(field)
      .isFloat({ min, max })
      .withMessage(`${field} must be between ${min} and ${max}`),
  
  // Date validation
  date: (field: string) => body(field)
    .isISO8601()
    .withMessage(`${field} must be a valid ISO 8601 date`),
  
  // URL validation
  url: (field: string) => body(field)
    .isURL()
    .withMessage(`${field} must be a valid URL`),
  
  // Phone number validation
  phone: (field: string) => body(field)
    .isMobilePhone('any')
    .withMessage(`${field} must be a valid phone number`),
  
  // Credit card validation
  creditCard: (field: string) => body(field)
    .isCreditCard()
    .withMessage(`${field} must be a valid credit card number`),
};

// Custom validation functions
export const customValidations = {
  // Validate file upload
  validateFileUpload: (allowedTypes: string[], maxSize: number = 10 * 1024 * 1024) => {
    return (req: Request, res: Response, next: NextFunction): void => {
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
      
      // Check file type
      const fileType = Array.isArray(file) ? file[0]?.mimetype : file.mimetype;
      if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({
          error: 'Invalid file type',
          code: 'INVALID_FILE_TYPE',
          allowed: allowedTypes,
          received: fileType,
        });
      }
      
      // Check file size
      const fileSize = Array.isArray(file) ? file[0]?.size : file.size;
      if (fileSize > maxSize) {
        return res.status(400).json({
          error: 'File too large',
          code: 'FILE_TOO_LARGE',
          maxSize,
          received: fileSize,
        });
      }
      
      return next();
    };
  },
  
  // Validate JSON structure
  validateJSON: (req: Request, res: Response, next: NextFunction): void => {
    if (req.is('application/json')) {
      try {
        if (typeof req.body === 'string') {
          req.body = JSON.parse(req.body);
        }
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid JSON',
          code: 'INVALID_JSON',
        });
      }
    }
    return next();
  },
  
  // Validate request size
  validateRequestSize: (maxSize: number = 1024 * 1024) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const contentLength = parseInt(req.get('content-length') || '0');
      
      if (contentLength > maxSize) {
        return res.status(413).json({
          error: 'Request too large',
          code: 'REQUEST_TOO_LARGE',
          maxSize,
          received: contentLength,
        });
      }
      
      return next();
    };
  },
  
  // Validate content type
  validateContentType: (allowedTypes: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const contentType = req.get('content-type') || '';
      
      if (!allowedTypes.some(type => contentType.includes(type))) {
        return res.status(415).json({
          error: 'Unsupported content type',
          code: 'UNSUPPORTED_CONTENT_TYPE',
          allowed: allowedTypes,
          received: contentType,
        });
      }
      
      return next();
    };
  },
};

// Sanitization middleware
export const sanitize = {
  // Remove HTML tags
  stripHtml: (fields: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = req.body[field].replace(/<[^>]*>/g, '');
        }
      });
      next();
    };
  },
  
  // Trim whitespace
  trimFields: (fields: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = req.body[field].trim();
        }
      });
      next();
    };
  },
  
  // Convert to lowercase
  lowercase: (fields: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = req.body[field].toLowerCase();
        }
      });
      next();
    };
  },
};

// Validation error handler
export const handleValidationError = (error: any, req: Request, res: Response, next: NextFunction): void => {
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
  
  return next(error);
};

// Export commonly used validation combinations
export const commonValidations = {
  // CV Analysis validation
  cvAnalysis: [validateSchema(schemas.cvAnalysis)],
  
  // Question generation validation
  questionGeneration: [validateSchema(schemas.questionGeneration)],
  
  // Interview analysis validation
  interviewAnalysis: [validateSchema(schemas.interviewAnalysis)],
  
  // Payment validation
  payment: [validateSchema(schemas.payment)],
  
  // Talent search validation
  talentSearch: [validateSchema(schemas.talentSearch)],
  
  // Pagination validation
  pagination: [validateSchema(schemas.pagination, 'query')],
  
  // UUID parameter validation
  uuidParam: (paramName: string) => [validateFields([fieldValidations.uuid(paramName)])],
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
