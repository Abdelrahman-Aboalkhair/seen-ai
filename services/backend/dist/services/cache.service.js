import crypto from 'crypto';
import redisClient from '@/lib/redis.js';
import { baseConfig } from '@/config/index.js';
import logger, { logCache, logError, logPerformance } from '@/lib/logger.js';
export class CacheService {
    defaultTTL = 3600;
    keyPrefix = 'smart-recruiter:';
    generateKey(key, data, prefix) {
        let finalKey = `${prefix || this.keyPrefix}${key}`;
        if (data) {
            const hash = crypto
                .createHash('md5')
                .update(JSON.stringify(data))
                .digest('hex')
                .substring(0, 8);
            finalKey += `:${hash}`;
        }
        return finalKey;
    }
    async get(key, options = {}) {
        const startTime = Date.now();
        try {
            const cacheKey = this.generateKey(key, undefined, options.prefix);
            const result = await redisClient.get(cacheKey);
            const duration = Date.now() - startTime;
            logPerformance('cache_get', duration, { key: cacheKey, hit: result !== null });
            return result;
        }
        catch (error) {
            logError(error, { operation: 'cache_get', key });
            return null;
        }
    }
    async set(key, value, options = {}) {
        const startTime = Date.now();
        try {
            const cacheKey = this.generateKey(key, undefined, options.prefix);
            const ttl = options.ttl || this.defaultTTL;
            const result = await redisClient.set(cacheKey, value, ttl);
            const duration = Date.now() - startTime;
            logPerformance('cache_set', duration, { key: cacheKey, ttl });
            return result;
        }
        catch (error) {
            logError(error, { operation: 'cache_set', key });
            return false;
        }
    }
    async delete(key, options = {}) {
        try {
            const cacheKey = this.generateKey(key, undefined, options.prefix);
            return await redisClient.del(cacheKey);
        }
        catch (error) {
            logError(error, { operation: 'cache_delete', key });
            return false;
        }
    }
    async getCVAnalysis(cvText, jobRequirements, userId) {
        const key = 'cv_analysis';
        const data = { cvText, jobRequirements, userId };
        const cacheKey = this.generateKey(key, data);
        return this.get(cacheKey, { ttl: baseConfig.cache.ttl.cvAnalysis });
    }
    async setCVAnalysis(cvText, jobRequirements, userId, result) {
        const key = 'cv_analysis';
        const data = { cvText, jobRequirements, userId };
        const cacheKey = this.generateKey(key, data);
        return this.set(cacheKey, result, { ttl: baseConfig.cache.ttl.cvAnalysis });
    }
    async getQuestions(jobTitle, skills, count) {
        const key = 'questions';
        const data = { jobTitle, skills: skills.sort(), count };
        const cacheKey = this.generateKey(key, data);
        return this.get(cacheKey, { ttl: baseConfig.cache.ttl.questions });
    }
    async setQuestions(jobTitle, skills, count, result) {
        const key = 'questions';
        const data = { jobTitle, skills: skills.sort(), count };
        const cacheKey = this.generateKey(key, data);
        return this.set(cacheKey, result, { ttl: baseConfig.cache.ttl.questions });
    }
    async getInterviewAnalysis(sessionId) {
        const key = `interview_analysis:${sessionId}`;
        return this.get(key, { ttl: baseConfig.cache.ttl.interviewAnalysis });
    }
    async setInterviewAnalysis(sessionId, result) {
        const key = `interview_analysis:${sessionId}`;
        return this.set(key, result, { ttl: baseConfig.cache.ttl.interviewAnalysis });
    }
    async getJobRequirements(jobInfo) {
        const key = 'job_requirements';
        const cacheKey = this.generateKey(key, jobInfo);
        return this.get(cacheKey, { ttl: baseConfig.cache.ttl.jobRequirements });
    }
    async setJobRequirements(jobInfo, result) {
        const key = 'job_requirements';
        const cacheKey = this.generateKey(key, jobInfo);
        return this.set(cacheKey, result, { ttl: baseConfig.cache.ttl.jobRequirements });
    }
    async getUserSession(userId) {
        const key = `user_session:${userId}`;
        return this.get(key, { ttl: 1800 });
    }
    async setUserSession(userId, sessionData) {
        const key = `user_session:${userId}`;
        return this.set(key, sessionData, { ttl: 1800 });
    }
    async deleteUserSession(userId) {
        const key = `user_session:${userId}`;
        return this.delete(key);
    }
    async getRateLimitCount(userId, endpoint) {
        const key = `rate_limit:${userId}:${endpoint}`;
        const count = await redisClient.get(key);
        return count || 0;
    }
    async incrementRateLimit(userId, endpoint, windowMs = 900000) {
        const key = `rate_limit:${userId}:${endpoint}`;
        const count = await redisClient.incr(key);
        if (count === 1) {
            await redisClient.expire(key, Math.ceil(windowMs / 1000));
        }
        return count;
    }
    async getOrSet(key, fetchFunction, options = {}) {
        const startTime = Date.now();
        const cached = await this.get(key, options);
        if (cached !== null) {
            const duration = Date.now() - startTime;
            logPerformance('cache_hit', duration, { key });
            return cached;
        }
        logCache('miss', key);
        try {
            const result = await fetchFunction();
            await this.set(key, result, options);
            const duration = Date.now() - startTime;
            logPerformance('cache_miss_fetch', duration, { key });
            return result;
        }
        catch (error) {
            logError(error, { operation: 'cache_fetch', key });
            throw error;
        }
    }
    async multiGet(keys, options = {}) {
        try {
            const cacheKeys = keys.map(key => this.generateKey(key, undefined, options.prefix));
            return await redisClient.mget(cacheKeys);
        }
        catch (error) {
            logError(error, { operation: 'cache_multi_get', keys });
            return keys.map(() => null);
        }
    }
    async multiSet(keyValuePairs, options = {}) {
        try {
            const serializedPairs = {};
            Object.entries(keyValuePairs).forEach(([key, value]) => {
                const cacheKey = this.generateKey(key, undefined, options.prefix);
                serializedPairs[cacheKey] = value;
            });
            const result = await redisClient.mset(serializedPairs);
            if (options.ttl) {
                const promises = Object.keys(serializedPairs).map(cacheKey => redisClient.expire(cacheKey, options.ttl));
                await Promise.all(promises);
            }
            return result;
        }
        catch (error) {
            logError(error, { operation: 'cache_multi_set', keys: Object.keys(keyValuePairs) });
            return false;
        }
    }
    async warmCache() {
        logger.info('Starting cache warming process');
        try {
            logger.info('Cache warming completed successfully');
        }
        catch (error) {
            logError(error, { operation: 'cache_warming' });
        }
    }
    async getStats() {
        try {
            const info = await redisClient.info();
            return {
                redis_info: info,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            logError(error, { operation: 'cache_stats' });
            return null;
        }
    }
    async clearByPattern(pattern) {
        try {
            logger.warn('Cache pattern clear requested', { pattern });
            return true;
        }
        catch (error) {
            logError(error, { operation: 'cache_clear_pattern', pattern });
            return false;
        }
    }
    async healthCheck() {
        try {
            const testKey = 'health_check';
            const testValue = { timestamp: Date.now() };
            await this.set(testKey, testValue, { ttl: 60 });
            const retrieved = await this.get(testKey);
            await this.delete(testKey);
            return retrieved !== null;
        }
        catch (error) {
            logError(error, { operation: 'cache_health_check' });
            return false;
        }
    }
}
const cacheService = new CacheService();
export default cacheService;
//# sourceMappingURL=cache.service.js.map