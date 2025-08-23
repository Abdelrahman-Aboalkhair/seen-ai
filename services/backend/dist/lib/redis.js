import Redis from "ioredis";
import { baseConfig } from "@/config/index.js";
import logger, { logCache, logError } from "@/lib/logger.js";
class RedisClient {
    client;
    isConnected = false;
    constructor() {
        this.client = new Redis(baseConfig.redis.url, {
            password: baseConfig.redis.password,
            db: baseConfig.redis.db,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            reconnectOnError: (err) => {
                const targetError = "READONLY";
                return err.message.includes(targetError);
            },
        });
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.client.on("connect", () => {
            this.isConnected = true;
            logger.info("Redis client connected");
        });
        this.client.on("ready", () => {
            logger.info("Redis client ready");
        });
        this.client.on("error", (error) => {
            this.isConnected = false;
            logError(error, { service: "redis" });
        });
        this.client.on("close", () => {
            this.isConnected = false;
            logger.warn("Redis connection closed");
        });
        this.client.on("reconnecting", () => {
            logger.info("Redis client reconnecting");
        });
    }
    async connect() {
        try {
            await this.client.connect();
        }
        catch (error) {
            logError(error, { operation: "redis_connect" });
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.client.disconnect();
            this.isConnected = false;
        }
        catch (error) {
            logError(error, { operation: "redis_disconnect" });
        }
    }
    isHealthy() {
        return this.isConnected && this.client.status === "ready";
    }
    async get(key) {
        try {
            const value = await this.client.get(key);
            if (value === null) {
                logCache("miss", key);
                return null;
            }
            logCache("hit", key);
            return JSON.parse(value);
        }
        catch (error) {
            logError(error, { operation: "redis_get", key });
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, serialized);
            }
            else {
                await this.client.set(key, serialized);
            }
            logCache("set", key, { ttl: ttlSeconds });
            return true;
        }
        catch (error) {
            logError(error, { operation: "redis_set", key });
            return false;
        }
    }
    async del(key) {
        try {
            const result = await this.client.del(key);
            logCache("delete", key, { deleted: result > 0 });
            return result > 0;
        }
        catch (error) {
            logError(error, { operation: "redis_del", key });
            return false;
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logError(error, { operation: "redis_exists", key });
            return false;
        }
    }
    async expire(key, ttlSeconds) {
        try {
            const result = await this.client.expire(key, ttlSeconds);
            return result === 1;
        }
        catch (error) {
            logError(error, { operation: "redis_expire", key });
            return false;
        }
    }
    async ttl(key) {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            logError(error, { operation: "redis_ttl", key });
            return -2;
        }
    }
    async incr(key) {
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            logError(error, { operation: "redis_incr", key });
            return 0;
        }
    }
    async setnx(key, value, ttlSeconds) {
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                const result = await this.client.set(key, serialized, "EX", ttlSeconds, "NX");
                return result === "OK";
            }
            else {
                const result = await this.client.setnx(key, serialized);
                return result === 1;
            }
        }
        catch (error) {
            logError(error, { operation: "redis_setnx", key });
            return false;
        }
    }
    async mget(keys) {
        try {
            const values = await this.client.mget(...keys);
            return values.map((value, index) => {
                if (value === null) {
                    logCache("miss", keys[index]);
                    return null;
                }
                logCache("hit", keys[index]);
                return JSON.parse(value);
            });
        }
        catch (error) {
            logError(error, { operation: "redis_mget", keys });
            return keys.map(() => null);
        }
    }
    async mset(keyValuePairs) {
        try {
            const serializedPairs = [];
            Object.entries(keyValuePairs).forEach(([key, value]) => {
                serializedPairs.push(key, JSON.stringify(value));
            });
            await this.client.mset(...serializedPairs);
            Object.keys(keyValuePairs).forEach((key) => {
                logCache("set", key);
            });
            return true;
        }
        catch (error) {
            logError(error, {
                operation: "redis_mset",
                keys: Object.keys(keyValuePairs),
            });
            return false;
        }
    }
    async hget(key, field) {
        try {
            const value = await this.client.hget(key, field);
            if (value === null) {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            logError(error, { operation: "redis_hget", key, field });
            return null;
        }
    }
    async hset(key, field, value) {
        try {
            const serialized = JSON.stringify(value);
            const result = await this.client.hset(key, field, serialized);
            return result >= 0;
        }
        catch (error) {
            logError(error, { operation: "redis_hset", key, field });
            return false;
        }
    }
    async flushdb() {
        try {
            await this.client.flushdb();
            logger.warn("Redis database flushed");
            return true;
        }
        catch (error) {
            logError(error, { operation: "redis_flushdb" });
            return false;
        }
    }
    async info() {
        try {
            return await this.client.info();
        }
        catch (error) {
            logError(error, { operation: "redis_info" });
            return "";
        }
    }
}
const redisClient = new RedisClient();
export default redisClient;
//# sourceMappingURL=redis.js.map