import { Request, Response, NextFunction } from 'express';
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
declare const extractToken: (req: Request) => string | null;
declare const verifyToken: (token: string) => Promise<any>;
declare const getUserData: (userId: string) => Promise<AuthenticatedUser | null>;
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const optionalAuthenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (roles: string | string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireCredits: (minCredits?: number) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const authenticateApiKey: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const refreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateAccountStatus: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const logUserActivity: (action: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const fullAuth: (((req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>) | ((req: Request, res: Response, next: NextFunction) => Promise<void>) | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
export declare const adminAuth: (((req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>) | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
export declare const creditAuth: (minCredits?: number) => (((req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>) | ((req: Request, res: Response, next: NextFunction) => Promise<void>) | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
export { extractToken, verifyToken, getUserData };
//# sourceMappingURL=auth.d.ts.map