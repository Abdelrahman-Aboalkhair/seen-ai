declare class RedisClient {
    private client;
    private isConnected;
    constructor();
    private setupEventListeners;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isHealthy(): boolean;
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<boolean>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttlSeconds: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    setnx(key: string, value: any, ttlSeconds?: number): Promise<boolean>;
    mget<T = any>(keys: string[]): Promise<(T | null)[]>;
    mset(keyValuePairs: Record<string, any>): Promise<boolean>;
    hget<T = any>(key: string, field: string): Promise<T | null>;
    hset(key: string, field: string, value: any): Promise<boolean>;
    flushdb(): Promise<boolean>;
    info(): Promise<string>;
}
declare const redisClient: RedisClient;
export default redisClient;
//# sourceMappingURL=redis.d.ts.map