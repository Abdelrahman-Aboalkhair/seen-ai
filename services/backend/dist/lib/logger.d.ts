import winston from "winston";
declare const logger: winston.Logger;
export declare const logRequest: (req: any, res: any, responseTime?: number) => void;
export declare const logError: (error: Error, context?: Record<string, any>) => void;
export declare const logPerformance: (operation: string, duration: number, metadata?: Record<string, any>) => void;
export declare const logCache: (operation: "hit" | "miss" | "set" | "delete", key: string, metadata?: Record<string, any>) => void;
export declare const logExternalAPI: (service: string, operation: string, duration: number, success: boolean, metadata?: Record<string, any>) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map