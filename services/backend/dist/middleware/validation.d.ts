import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationChain } from 'express-validator';
export declare const validateSchema: <T>(schema: ZodSchema<T>, source?: "body" | "params" | "query") => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateFields: (validations: ValidationChain[]) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const schemas: {
    cvAnalysis: z.ZodObject<{
        cvText: z.ZodString;
        jobRequirements: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        cvText: string;
        jobRequirements: string;
    }, {
        cvText: string;
        jobRequirements: string;
    }>;
    questionGeneration: z.ZodObject<{
        jobTitle: z.ZodString;
        skills: z.ZodArray<z.ZodString, "many">;
        count: z.ZodNumber;
        difficulty: z.ZodOptional<z.ZodEnum<["easy", "medium", "hard"]>>;
        type: z.ZodOptional<z.ZodEnum<["technical", "behavioral", "mixed"]>>;
    }, "strip", z.ZodTypeAny, {
        count: number;
        jobTitle: string;
        skills: string[];
        type?: "technical" | "behavioral" | "mixed" | undefined;
        difficulty?: "easy" | "medium" | "hard" | undefined;
    }, {
        count: number;
        jobTitle: string;
        skills: string[];
        type?: "technical" | "behavioral" | "mixed" | undefined;
        difficulty?: "easy" | "medium" | "hard" | undefined;
    }>;
    interviewAnalysis: z.ZodObject<{
        sessionId: z.ZodString;
        questions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            question: z.ZodString;
            type: z.ZodEnum<["technical", "behavioral"]>;
            difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
        }, "strip", z.ZodTypeAny, {
            type: "technical" | "behavioral";
            id: string;
            difficulty: "easy" | "medium" | "hard";
            question: string;
        }, {
            type: "technical" | "behavioral";
            id: string;
            difficulty: "easy" | "medium" | "hard";
            question: string;
        }>, "many">;
        answers: z.ZodArray<z.ZodObject<{
            questionId: z.ZodString;
            answer: z.ZodString;
            duration: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            questionId: string;
            answer: string;
            duration: number;
        }, {
            questionId: string;
            answer: string;
            duration: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        questions: {
            type: "technical" | "behavioral";
            id: string;
            difficulty: "easy" | "medium" | "hard";
            question: string;
        }[];
        sessionId: string;
        answers: {
            questionId: string;
            answer: string;
            duration: number;
        }[];
    }, {
        questions: {
            type: "technical" | "behavioral";
            id: string;
            difficulty: "easy" | "medium" | "hard";
            question: string;
        }[];
        sessionId: string;
        answers: {
            questionId: string;
            answer: string;
            duration: number;
        }[];
    }>;
    jobRequirements: z.ZodObject<{
        jobTitle: z.ZodString;
        department: z.ZodOptional<z.ZodString>;
        experience: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        companySize: z.ZodOptional<z.ZodString>;
        industry: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        jobTitle: string;
        department?: string | undefined;
        experience?: string | undefined;
        location?: string | undefined;
        companySize?: string | undefined;
        industry?: string | undefined;
    }, {
        jobTitle: string;
        department?: string | undefined;
        experience?: string | undefined;
        location?: string | undefined;
        companySize?: string | undefined;
        industry?: string | undefined;
    }>;
    talentSearch: z.ZodEffects<z.ZodObject<{
        jobTitle: z.ZodOptional<z.ZodString>;
        skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        location: z.ZodOptional<z.ZodString>;
        experience: z.ZodOptional<z.ZodString>;
        education: z.ZodOptional<z.ZodString>;
        salaryRange: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            max: number;
            min: number;
        }, {
            max: number;
            min: number;
        }>, {
            max: number;
            min: number;
        }, {
            max: number;
            min: number;
        }>>;
        remote: z.ZodOptional<z.ZodBoolean>;
        industry: z.ZodOptional<z.ZodString>;
        companySize: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        jobTitle?: string | undefined;
        skills?: string[] | undefined;
        experience?: string | undefined;
        location?: string | undefined;
        companySize?: string | undefined;
        industry?: string | undefined;
        education?: string | undefined;
        salaryRange?: {
            max: number;
            min: number;
        } | undefined;
        remote?: boolean | undefined;
    }, {
        jobTitle?: string | undefined;
        skills?: string[] | undefined;
        experience?: string | undefined;
        location?: string | undefined;
        companySize?: string | undefined;
        industry?: string | undefined;
        education?: string | undefined;
        salaryRange?: {
            max: number;
            min: number;
        } | undefined;
        remote?: boolean | undefined;
    }>, {
        jobTitle?: string | undefined;
        skills?: string[] | undefined;
        experience?: string | undefined;
        location?: string | undefined;
        companySize?: string | undefined;
        industry?: string | undefined;
        education?: string | undefined;
        salaryRange?: {
            max: number;
            min: number;
        } | undefined;
        remote?: boolean | undefined;
    }, {
        jobTitle?: string | undefined;
        skills?: string[] | undefined;
        experience?: string | undefined;
        location?: string | undefined;
        companySize?: string | undefined;
        industry?: string | undefined;
        education?: string | undefined;
        salaryRange?: {
            max: number;
            min: number;
        } | undefined;
        remote?: boolean | undefined;
    }>;
    payment: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
        credits: z.ZodNumber;
        description: z.ZodString;
        paymentMethodId: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        credits: number;
        amount: number;
        description: string;
        currency: string;
        paymentMethodId?: string | undefined;
        metadata?: Record<string, string> | undefined;
    }, {
        credits: number;
        amount: number;
        description: string;
        currency: string;
        paymentMethodId?: string | undefined;
        metadata?: Record<string, string> | undefined;
    }>;
    refund: z.ZodObject<{
        paymentIntentId: z.ZodString;
        amount: z.ZodOptional<z.ZodNumber>;
        reason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        paymentIntentId: string;
        amount?: number | undefined;
        reason?: string | undefined;
    }, {
        paymentIntentId: string;
        amount?: number | undefined;
        reason?: string | undefined;
    }>;
    userUpdate: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodEnum<["user", "admin", "super_admin"]>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        role?: "user" | "admin" | "super_admin" | undefined;
        email?: string | undefined;
    }, {
        name?: string | undefined;
        role?: "user" | "admin" | "super_admin" | undefined;
        email?: string | undefined;
    }>;
    pagination: z.ZodObject<{
        page: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
        limit: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
        sort: z.ZodOptional<z.ZodString>;
        order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    }, "strip", z.ZodTypeAny, {
        sort?: string | undefined;
        limit?: number | undefined;
        page?: number | undefined;
        order?: "asc" | "desc" | undefined;
    }, {
        sort?: string | undefined;
        limit?: string | undefined;
        page?: string | undefined;
        order?: "asc" | "desc" | undefined;
    }>;
    fileUpload: z.ZodObject<{
        filename: z.ZodString;
        mimetype: z.ZodString;
        size: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        filename: string;
        mimetype: string;
        size: number;
    }, {
        filename: string;
        mimetype: string;
        size: number;
    }>;
};
export declare const fieldValidations: {
    email: () => ValidationChain;
    password: () => ValidationChain;
    uuid: (field: string) => ValidationChain;
    positiveInt: (field: string) => ValidationChain;
    stringLength: (field: string, min?: number, max?: number) => ValidationChain;
    array: (field: string, minLength?: number, maxLength?: number) => ValidationChain;
    numericRange: (field: string, min: number, max: number) => ValidationChain;
    date: (field: string) => ValidationChain;
    url: (field: string) => ValidationChain;
    phone: (field: string) => ValidationChain;
    creditCard: (field: string) => ValidationChain;
};
export declare const customValidations: {
    validateFileUpload: (allowedTypes: string[], maxSize?: number) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateJSON: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateRequestSize: (maxSize?: number) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateContentType: (allowedTypes: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
};
export declare const sanitize: {
    stripHtml: (fields: string[]) => (req: Request, res: Response, next: NextFunction) => void;
    trimFields: (fields: string[]) => (req: Request, res: Response, next: NextFunction) => void;
    lowercase: (fields: string[]) => (req: Request, res: Response, next: NextFunction) => void;
};
export declare const handleValidationError: (error: any, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const commonValidations: {
    cvAnalysis: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined)[];
    questionGeneration: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined)[];
    interviewAnalysis: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined)[];
    payment: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined)[];
    talentSearch: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined)[];
    pagination: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined)[];
    uuidParam: (paramName: string) => ((req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>)[];
};
declare const _default: {
    validateSchema: <T>(schema: ZodSchema<T>, source?: "body" | "params" | "query") => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateFields: (validations: ValidationChain[]) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    schemas: {
        cvAnalysis: z.ZodObject<{
            cvText: z.ZodString;
            jobRequirements: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            cvText: string;
            jobRequirements: string;
        }, {
            cvText: string;
            jobRequirements: string;
        }>;
        questionGeneration: z.ZodObject<{
            jobTitle: z.ZodString;
            skills: z.ZodArray<z.ZodString, "many">;
            count: z.ZodNumber;
            difficulty: z.ZodOptional<z.ZodEnum<["easy", "medium", "hard"]>>;
            type: z.ZodOptional<z.ZodEnum<["technical", "behavioral", "mixed"]>>;
        }, "strip", z.ZodTypeAny, {
            count: number;
            jobTitle: string;
            skills: string[];
            type?: "technical" | "behavioral" | "mixed" | undefined;
            difficulty?: "easy" | "medium" | "hard" | undefined;
        }, {
            count: number;
            jobTitle: string;
            skills: string[];
            type?: "technical" | "behavioral" | "mixed" | undefined;
            difficulty?: "easy" | "medium" | "hard" | undefined;
        }>;
        interviewAnalysis: z.ZodObject<{
            sessionId: z.ZodString;
            questions: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                question: z.ZodString;
                type: z.ZodEnum<["technical", "behavioral"]>;
                difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
            }, "strip", z.ZodTypeAny, {
                type: "technical" | "behavioral";
                id: string;
                difficulty: "easy" | "medium" | "hard";
                question: string;
            }, {
                type: "technical" | "behavioral";
                id: string;
                difficulty: "easy" | "medium" | "hard";
                question: string;
            }>, "many">;
            answers: z.ZodArray<z.ZodObject<{
                questionId: z.ZodString;
                answer: z.ZodString;
                duration: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                questionId: string;
                answer: string;
                duration: number;
            }, {
                questionId: string;
                answer: string;
                duration: number;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            questions: {
                type: "technical" | "behavioral";
                id: string;
                difficulty: "easy" | "medium" | "hard";
                question: string;
            }[];
            sessionId: string;
            answers: {
                questionId: string;
                answer: string;
                duration: number;
            }[];
        }, {
            questions: {
                type: "technical" | "behavioral";
                id: string;
                difficulty: "easy" | "medium" | "hard";
                question: string;
            }[];
            sessionId: string;
            answers: {
                questionId: string;
                answer: string;
                duration: number;
            }[];
        }>;
        jobRequirements: z.ZodObject<{
            jobTitle: z.ZodString;
            department: z.ZodOptional<z.ZodString>;
            experience: z.ZodOptional<z.ZodString>;
            location: z.ZodOptional<z.ZodString>;
            companySize: z.ZodOptional<z.ZodString>;
            industry: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            jobTitle: string;
            department?: string | undefined;
            experience?: string | undefined;
            location?: string | undefined;
            companySize?: string | undefined;
            industry?: string | undefined;
        }, {
            jobTitle: string;
            department?: string | undefined;
            experience?: string | undefined;
            location?: string | undefined;
            companySize?: string | undefined;
            industry?: string | undefined;
        }>;
        talentSearch: z.ZodEffects<z.ZodObject<{
            jobTitle: z.ZodOptional<z.ZodString>;
            skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            location: z.ZodOptional<z.ZodString>;
            experience: z.ZodOptional<z.ZodString>;
            education: z.ZodOptional<z.ZodString>;
            salaryRange: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                min: z.ZodNumber;
                max: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                max: number;
                min: number;
            }, {
                max: number;
                min: number;
            }>, {
                max: number;
                min: number;
            }, {
                max: number;
                min: number;
            }>>;
            remote: z.ZodOptional<z.ZodBoolean>;
            industry: z.ZodOptional<z.ZodString>;
            companySize: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            jobTitle?: string | undefined;
            skills?: string[] | undefined;
            experience?: string | undefined;
            location?: string | undefined;
            companySize?: string | undefined;
            industry?: string | undefined;
            education?: string | undefined;
            salaryRange?: {
                max: number;
                min: number;
            } | undefined;
            remote?: boolean | undefined;
        }, {
            jobTitle?: string | undefined;
            skills?: string[] | undefined;
            experience?: string | undefined;
            location?: string | undefined;
            companySize?: string | undefined;
            industry?: string | undefined;
            education?: string | undefined;
            salaryRange?: {
                max: number;
                min: number;
            } | undefined;
            remote?: boolean | undefined;
        }>, {
            jobTitle?: string | undefined;
            skills?: string[] | undefined;
            experience?: string | undefined;
            location?: string | undefined;
            companySize?: string | undefined;
            industry?: string | undefined;
            education?: string | undefined;
            salaryRange?: {
                max: number;
                min: number;
            } | undefined;
            remote?: boolean | undefined;
        }, {
            jobTitle?: string | undefined;
            skills?: string[] | undefined;
            experience?: string | undefined;
            location?: string | undefined;
            companySize?: string | undefined;
            industry?: string | undefined;
            education?: string | undefined;
            salaryRange?: {
                max: number;
                min: number;
            } | undefined;
            remote?: boolean | undefined;
        }>;
        payment: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
            credits: z.ZodNumber;
            description: z.ZodString;
            paymentMethodId: z.ZodOptional<z.ZodString>;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            credits: number;
            amount: number;
            description: string;
            currency: string;
            paymentMethodId?: string | undefined;
            metadata?: Record<string, string> | undefined;
        }, {
            credits: number;
            amount: number;
            description: string;
            currency: string;
            paymentMethodId?: string | undefined;
            metadata?: Record<string, string> | undefined;
        }>;
        refund: z.ZodObject<{
            paymentIntentId: z.ZodString;
            amount: z.ZodOptional<z.ZodNumber>;
            reason: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            paymentIntentId: string;
            amount?: number | undefined;
            reason?: string | undefined;
        }, {
            paymentIntentId: string;
            amount?: number | undefined;
            reason?: string | undefined;
        }>;
        userUpdate: z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodEnum<["user", "admin", "super_admin"]>>;
        }, "strip", z.ZodTypeAny, {
            name?: string | undefined;
            role?: "user" | "admin" | "super_admin" | undefined;
            email?: string | undefined;
        }, {
            name?: string | undefined;
            role?: "user" | "admin" | "super_admin" | undefined;
            email?: string | undefined;
        }>;
        pagination: z.ZodObject<{
            page: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
            limit: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
            sort: z.ZodOptional<z.ZodString>;
            order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
        }, "strip", z.ZodTypeAny, {
            sort?: string | undefined;
            limit?: number | undefined;
            page?: number | undefined;
            order?: "asc" | "desc" | undefined;
        }, {
            sort?: string | undefined;
            limit?: string | undefined;
            page?: string | undefined;
            order?: "asc" | "desc" | undefined;
        }>;
        fileUpload: z.ZodObject<{
            filename: z.ZodString;
            mimetype: z.ZodString;
            size: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            filename: string;
            mimetype: string;
            size: number;
        }, {
            filename: string;
            mimetype: string;
            size: number;
        }>;
    };
    fieldValidations: {
        email: () => ValidationChain;
        password: () => ValidationChain;
        uuid: (field: string) => ValidationChain;
        positiveInt: (field: string) => ValidationChain;
        stringLength: (field: string, min?: number, max?: number) => ValidationChain;
        array: (field: string, minLength?: number, maxLength?: number) => ValidationChain;
        numericRange: (field: string, min: number, max: number) => ValidationChain;
        date: (field: string) => ValidationChain;
        url: (field: string) => ValidationChain;
        phone: (field: string) => ValidationChain;
        creditCard: (field: string) => ValidationChain;
    };
    customValidations: {
        validateFileUpload: (allowedTypes: string[], maxSize?: number) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
        validateJSON: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
        validateRequestSize: (maxSize?: number) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
        validateContentType: (allowedTypes: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    };
    sanitize: {
        stripHtml: (fields: string[]) => (req: Request, res: Response, next: NextFunction) => void;
        trimFields: (fields: string[]) => (req: Request, res: Response, next: NextFunction) => void;
        lowercase: (fields: string[]) => (req: Request, res: Response, next: NextFunction) => void;
    };
    handleValidationError: (error: any, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    commonValidations: {
        cvAnalysis: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined)[];
        questionGeneration: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined)[];
        interviewAnalysis: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined)[];
        payment: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined)[];
        talentSearch: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined)[];
        pagination: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined)[];
        uuidParam: (paramName: string) => ((req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>)[];
    };
};
export default _default;
//# sourceMappingURL=validation.d.ts.map