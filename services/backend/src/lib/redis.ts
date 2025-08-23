import Redis from "ioredis";
import { baseConfig } from "@/config/index.js";
import logger, { logCache, logError } from "@/lib/logger.js";

class RedisClient {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis(baseConfig.redis.url, {
      password: baseConfig.redis.password,
      db: baseConfig.redis.db,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryDelayOnFailover: 100,
      reconnectOnError: (err) => {
        const targetError = "READONLY";
        return err.message.includes(targetError);
      },
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
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

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logError(error as Error, { operation: "redis_connect" });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      this.isConnected = false;
    } catch (error) {
      logError(error as Error, { operation: "redis_disconnect" });
    }
  }

  isHealthy(): boolean {
    return this.isConnected && this.client.status === "ready";
  }

  // Get value with automatic JSON parsing
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (value === null) {
        logCache("miss", key);
        return null;
      }

      logCache("hit", key);
      return JSON.parse(value) as T;
    } catch (error) {
      logError(error as Error, { operation: "redis_get", key });
      return null;
    }
  }

  // Set value with automatic JSON serialization
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);

      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }

      logCache("set", key, { ttl: ttlSeconds });
      return true;
    } catch (error) {
      logError(error as Error, { operation: "redis_set", key });
      return false;
    }
  }

  // Delete key
  async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      logCache("delete", key, { deleted: result > 0 });
      return result > 0;
    } catch (error) {
      logError(error as Error, { operation: "redis_del", key });
      return false;
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logError(error as Error, { operation: "redis_exists", key });
      return false;
    }
  }

  // Set expiration on existing key
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      logError(error as Error, { operation: "redis_expire", key });
      return false;
    }
  }

  // Get TTL of key
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logError(error as Error, { operation: "redis_ttl", key });
      return -2; // Key doesn't exist
    }
  }

  // Increment counter
  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logError(error as Error, { operation: "redis_incr", key });
      return 0;
    }
  }

  // Set with NX (only if key doesn't exist)
  async setnx(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);

      if (ttlSeconds) {
        const result = await this.client.set(
          key,
          serialized,
          "EX",
          ttlSeconds,
          "NX"
        );
        return result === "OK";
      } else {
        const result = await this.client.setnx(key, serialized);
        return result === 1;
      }
    } catch (error) {
      logError(error as Error, { operation: "redis_setnx", key });
      return false;
    }
  }

  // Multi-get operation
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.client.mget(...keys);
      return values.map((value, index) => {
        if (value === null) {
          logCache("miss", keys[index]!);
          return null;
        }
        logCache("hit", keys[index]!);
        return JSON.parse(value) as T;
      });
    } catch (error) {
      logError(error as Error, { operation: "redis_mget", keys });
      return keys.map(() => null);
    }
  }

  // Multi-set operation
  async mset(keyValuePairs: Record<string, any>): Promise<boolean> {
    try {
      const serializedPairs: string[] = [];
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        serializedPairs.push(key, JSON.stringify(value));
      });

      await this.client.mset(...serializedPairs);
      Object.keys(keyValuePairs).forEach((key) => {
        logCache("set", key);
      });
      return true;
    } catch (error) {
      logError(error as Error, {
        operation: "redis_mset",
        keys: Object.keys(keyValuePairs),
      });
      return false;
    }
  }

  // Hash operations
  async hget<T = any>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.client.hget(key, field);
      if (value === null) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logError(error as Error, { operation: "redis_hget", key, field });
      return null;
    }
  }

  async hset(key: string, field: string, value: any): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const result = await this.client.hset(key, field, serialized);
      return result >= 0;
    } catch (error) {
      logError(error as Error, { operation: "redis_hset", key, field });
      return false;
    }
  }

  // Clear all cache (use with caution)
  async flushdb(): Promise<boolean> {
    try {
      await this.client.flushdb();
      logger.warn("Redis database flushed");
      return true;
    } catch (error) {
      logError(error as Error, { operation: "redis_flushdb" });
      return false;
    }
  }

  // Get Redis info
  async info(): Promise<string> {
    try {
      return await this.client.info();
    } catch (error) {
      logError(error as Error, { operation: "redis_info" });
      return "";
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

export default redisClient;
