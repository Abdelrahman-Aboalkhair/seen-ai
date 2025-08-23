export declare const baseConfig: {
    readonly server: {
        readonly env: "development" | "production" | "test";
        readonly port: number;
        readonly host: string;
        readonly isDevelopment: boolean;
        readonly isProduction: boolean;
        readonly isTest: boolean;
    };
    readonly supabase: {
        readonly url: string;
        readonly serviceRoleKey: string;
        readonly anonKey: string;
    };
    readonly openai: {
        readonly apiKey: string;
        readonly baseUrl: string;
        readonly model: string;
    };
    readonly n8n: {
        readonly webhookUrl: string;
        readonly apiKey: string | undefined;
    };
    readonly stripe: {
        readonly secretKey: string;
        readonly webhookSecret: string;
        readonly baseUrl: string;
    };
    readonly redis: {
        readonly url: string;
        readonly password: string | undefined;
        readonly db: number;
    };
    readonly jwt: {
        readonly secret: string;
        readonly expiresIn: string;
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly maxRequests: number;
    };
    readonly logging: {
        readonly level: "error" | "warn" | "info" | "debug";
        readonly filePath: string;
    };
    readonly cors: {
        readonly origins: string[];
    };
    readonly cache: {
        readonly ttl: {
            readonly cvAnalysis: number;
            readonly questions: number;
            readonly interviewAnalysis: number;
            readonly jobRequirements: number;
        };
    };
    readonly performance: {
        readonly maxConcurrentRequests: number;
        readonly requestTimeout: number;
        readonly batchSizeLimit: number;
    };
};
//# sourceMappingURL=index.d.ts.map