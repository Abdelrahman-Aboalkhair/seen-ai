export interface CacheOptions {
    ttl?: number;
    prefix?: string;
    useCompression?: boolean;
}
export declare class CacheService {
    private defaultTTL;
    private keyPrefix;
    private generateKey;
    get<T>(key: string, options?: CacheOptions): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
    delete(key: string, options?: CacheOptions): Promise<boolean>;
    getCVAnalysis(cvText: string, jobRequirements: string, userId: string): Promise<unknown>;
    setCVAnalysis(cvText: string, jobRequirements: string, userId: string, result: any): Promise<boolean>;
    getQuestions(jobTitle: string, skills: string[], count: number): Promise<unknown>;
    setQuestions(jobTitle: string, skills: string[], count: number, result: any): Promise<boolean>;
    getInterviewAnalysis(sessionId: string): Promise<unknown>;
    setInterviewAnalysis(sessionId: string, result: any): Promise<boolean>;
    getJobRequirements(jobInfo: any): Promise<unknown>;
    setJobRequirements(jobInfo: any, result: any): Promise<boolean>;
    getUserSession(userId: string): Promise<unknown>;
    setUserSession(userId: string, sessionData: any): Promise<boolean>;
    deleteUserSession(userId: string): Promise<boolean>;
    getRateLimitCount(userId: string, endpoint: string): Promise<number>;
    incrementRateLimit(userId: string, endpoint: string, windowMs?: number): Promise<number>;
    getOrSet<T>(key: string, fetchFunction: () => Promise<T>, options?: CacheOptions): Promise<T>;
    multiGet<T>(keys: string[], options?: CacheOptions): Promise<(T | null)[]>;
    multiSet<T>(keyValuePairs: Record<string, T>, options?: CacheOptions): Promise<boolean>;
    warmCache(): Promise<void>;
    getStats(): Promise<{
        redis_info: string;
        timestamp: string;
    } | null>;
    clearByPattern(pattern: string): Promise<boolean>;
    healthCheck(): Promise<boolean>;
}
declare const cacheService: CacheService;
export default cacheService;
//# sourceMappingURL=cache.service.d.ts.map