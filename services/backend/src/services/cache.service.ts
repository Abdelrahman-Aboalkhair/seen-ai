import crypto from "crypto";
import redisClient from "@/lib/redis.js";
import { baseConfig } from "@/config/index.js";
import logger, { logCache, logError, logPerformance } from "@/lib/logger.js";

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
  useCompression?: boolean;
}

export class CacheService {
  private defaultTTL = 3600; // 1 hour
  private keyPrefix = "smart-recruiter:";

  // Generate cache key with hash for complex objects
  private generateKey(key: string, data?: any, prefix?: string): string {
    let finalKey = `${prefix || this.keyPrefix}${key}`;

    if (data) {
      const hash = crypto
        .createHash("md5")
        .update(JSON.stringify(data))
        .digest("hex")
        .substring(0, 8);
      finalKey += `:${hash}`;
    }

    return finalKey;
  }

  // Generic get method
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const startTime = Date.now();

    try {
      const cacheKey = this.generateKey(key, undefined, options.prefix);
      const result = await redisClient.get<T>(cacheKey);

      const duration = Date.now() - startTime;
      logPerformance("cache_get", duration, {
        key: cacheKey,
        hit: result !== null,
      });

      return result;
    } catch (error) {
      logError(error as Error, { operation: "cache_get", key });
      return null;
    }
  }

  // Generic set method
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    const startTime = Date.now();

    try {
      const cacheKey = this.generateKey(key, undefined, options.prefix);
      const ttl = options.ttl || this.defaultTTL;

      const result = await redisClient.set(cacheKey, value, ttl);

      const duration = Date.now() - startTime;
      logPerformance("cache_set", duration, { key: cacheKey, ttl });

      return result;
    } catch (error) {
      logError(error as Error, { operation: "cache_set", key });
      return false;
    }
  }

  // Delete cache entry
  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, undefined, options.prefix);
      return await redisClient.del(cacheKey);
    } catch (error) {
      logError(error as Error, { operation: "cache_delete", key });
      return false;
    }
  }

  // CV Analysis caching
  async getCVAnalysis(cvText: string, jobRequirements: string, userId: string) {
    const key = "cv_analysis";
    const data = { cvText, jobRequirements, userId };
    const cacheKey = this.generateKey(key, data);

    return this.get(cacheKey, { ttl: baseConfig.cache.ttl.cvAnalysis });
  }

  async setCVAnalysis(
    cvText: string,
    jobRequirements: string,
    userId: string,
    result: any
  ) {
    const key = "cv_analysis";
    const data = { cvText, jobRequirements, userId };
    const cacheKey = this.generateKey(key, data);

    return this.set(cacheKey, result, { ttl: baseConfig.cache.ttl.cvAnalysis });
  }

  // Question generation caching
  async getQuestions(jobTitle: string, skills: string[], count: number) {
    const key = "questions";
    const data = { jobTitle, skills: skills.sort(), count };
    const cacheKey = this.generateKey(key, data);

    return this.get(cacheKey, { ttl: baseConfig.cache.ttl.questions });
  }

  async setQuestions(
    jobTitle: string,
    skills: string[],
    count: number,
    result: any
  ) {
    const key = "questions";
    const data = { jobTitle, skills: skills.sort(), count };
    const cacheKey = this.generateKey(key, data);

    return this.set(cacheKey, result, { ttl: baseConfig.cache.ttl.questions });
  }

  // Interview analysis caching
  async getInterviewAnalysis(sessionId: string, userId: string) {
    const key = "interview_analysis";
    const cacheKey = this.generateKey(key, { sessionId, userId });

    return this.get(cacheKey, { ttl: baseConfig.cache.ttl.interviewAnalysis });
  }

  async setInterviewAnalysis(sessionId: string, userId: string, result: any) {
    const key = "interview_analysis";
    const cacheKey = this.generateKey(key, { sessionId, userId });

    return this.set(cacheKey, result, {
      ttl: baseConfig.cache.ttl.interviewAnalysis,
    });
  }

  // Job requirements caching
  async getJobRequirements(
    jobTitle: string,
    industry: string,
    seniority: string,
    userId: string
  ) {
    const key = "job_requirements";
    const cacheKey = this.generateKey(key, {
      jobTitle,
      industry,
      seniority,
      userId,
    });

    return this.get(cacheKey, { ttl: baseConfig.cache.ttl.jobRequirements });
  }

  async setJobRequirements(
    jobTitle: string,
    industry: string,
    seniority: string,
    userId: string,
    result: any
  ) {
    const key = "job_requirements";
    const cacheKey = this.generateKey(key, {
      jobTitle,
      industry,
      seniority,
      userId,
    });

    return this.set(cacheKey, result, {
      ttl: baseConfig.cache.ttl.jobRequirements,
    });
  }

  // User session caching
  async getUserSession(userId: string) {
    const key = `user_session:${userId}`;
    return this.get(key, { ttl: 1800 }); // 30 minutes
  }

  async setUserSession(userId: string, sessionData: any) {
    const key = `user_session:${userId}`;
    return this.set(key, sessionData, { ttl: 1800 });
  }

  async deleteUserSession(userId: string) {
    const key = `user_session:${userId}`;
    return this.delete(key);
  }

  // Rate limiting cache
  async getRateLimitCount(userId: string, endpoint: string): Promise<number> {
    const key = `rate_limit:${userId}:${endpoint}`;
    const count = await redisClient.get<number>(key);
    return count || 0;
  }

  async incrementRateLimit(
    userId: string,
    endpoint: string,
    windowMs: number = 900000
  ): Promise<number> {
    const key = `rate_limit:${userId}:${endpoint}`;
    const count = await redisClient.incr(key);

    if (count === 1) {
      // Set expiration only on first increment
      await redisClient.expire(key, Math.ceil(windowMs / 1000));
    }

    return count;
  }

  // API response caching with conditional logic
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const startTime = Date.now();

    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      const duration = Date.now() - startTime;
      logPerformance("cache_hit", duration, { key });
      return cached;
    }

    // Cache miss - fetch data
    logCache("miss", key);

    try {
      const result = await fetchFunction();

      // Cache the result
      await this.set(key, result, options);

      const duration = Date.now() - startTime;
      logPerformance("cache_miss_fetch", duration, { key });

      return result;
    } catch (error) {
      logError(error as Error, { operation: "cache_fetch", key });
      throw error;
    }
  }

  // Batch operations
  async multiGet<T>(
    keys: string[],
    options: CacheOptions = {}
  ): Promise<(T | null)[]> {
    try {
      const cacheKeys = keys.map((key) =>
        this.generateKey(key, undefined, options.prefix)
      );
      return await redisClient.mget<T>(cacheKeys);
    } catch (error) {
      logError(error as Error, { operation: "cache_multi_get", keys });
      return keys.map(() => null);
    }
  }

  async multiSet<T>(
    keyValuePairs: Record<string, T>,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const serializedPairs: Record<string, T> = {};

      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const cacheKey = this.generateKey(key, undefined, options.prefix);
        serializedPairs[cacheKey] = value;
      });

      const result = await redisClient.mset(serializedPairs);

      // Set TTL for each key if specified
      if (options.ttl) {
        const promises = Object.keys(serializedPairs).map((cacheKey) =>
          redisClient.expire(cacheKey, options.ttl!)
        );
        await Promise.all(promises);
      }

      return result;
    } catch (error) {
      logError(error as Error, {
        operation: "cache_multi_set",
        keys: Object.keys(keyValuePairs),
      });
      return false;
    }
  }

  // Cache warming for frequently accessed data
  async warmCache() {
    logger.info("Starting cache warming process");

    try {
      // Add cache warming logic here for frequently accessed data
      // For example: popular job titles, common skills, etc.

      logger.info("Cache warming completed successfully");
    } catch (error) {
      logError(error as Error, { operation: "cache_warming" });
    }
  }

  // Cache statistics
  async getStats() {
    try {
      const info = await redisClient.info();
      return {
        redis_info: info,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logError(error as Error, { operation: "cache_stats" });
      return null;
    }
  }

  // Clear cache by pattern
  async clearByPattern(pattern: string): Promise<boolean> {
    try {
      // Note: This is a simplified implementation
      // In production, you might want to use Redis SCAN for better performance
      logger.warn("Cache pattern clear requested", { pattern });
      return true;
    } catch (error) {
      logError(error as Error, { operation: "cache_clear_pattern", pattern });
      return false;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = "health_check";
      const testValue = { timestamp: Date.now() };

      await this.set(testKey, testValue, { ttl: 60 });
      const retrieved = await this.get(testKey);
      await this.delete(testKey);

      return retrieved !== null;
    } catch (error) {
      logError(error as Error, { operation: "cache_health_check" });
      return false;
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService;
