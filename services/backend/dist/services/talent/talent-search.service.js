import { BaseTalentService } from './base-talent.service.js';
import logger, { logError, logPerformance } from '@/lib/logger.js';
export class TalentSearchService extends BaseTalentService {
    async searchTalent(criteria) {
        const startTime = Date.now();
        try {
            this.validateSearchCriteria(criteria);
            logger.info('Starting talent search', { criteria });
            const result = await this.withRetry(() => this.client.post('/talent-search', {
                criteria,
                timestamp: new Date().toISOString(),
                searchId: this.generateSearchId(),
            }), 'talent_search');
            const duration = Date.now() - startTime;
            logPerformance('talent_search_completed', duration, {
                profileCount: result.profiles?.length || 0,
                criteria: JSON.stringify(criteria)
            });
            return result;
        }
        catch (error) {
            logError(error, {
                operation: 'search_talent',
                criteria
            });
            throw error;
        }
    }
    async advancedTalentSearch(criteria, filters = {}) {
        const startTime = Date.now();
        try {
            this.validateSearchCriteria(criteria);
            logger.info('Starting advanced talent search', { criteria, filters });
            const searchPayload = {
                criteria,
                filters,
                timestamp: new Date().toISOString(),
                searchId: this.generateSearchId(),
                advanced: true,
            };
            const result = await this.withRetry(() => this.client.post('/talent-search/advanced', searchPayload), 'advanced_talent_search');
            const duration = Date.now() - startTime;
            logPerformance('advanced_talent_search_completed', duration, {
                profileCount: result.profiles?.length || 0,
                criteria: JSON.stringify(criteria),
                filters: JSON.stringify(filters)
            });
            return result;
        }
        catch (error) {
            logError(error, {
                operation: 'advanced_talent_search',
                criteria,
                filters
            });
            throw error;
        }
    }
    async batchTalentSearch(searches) {
        const startTime = Date.now();
        const batchSize = Math.min(searches.length, 5);
        const results = [];
        logger.info('Starting batch talent search', {
            count: searches.length,
            batchSize
        });
        try {
            for (let i = 0; i < searches.length; i += batchSize) {
                const batch = searches.slice(i, i + batchSize);
                const batchPromises = batch.map(criteria => this.searchTalent(criteria));
                const batchResults = await Promise.allSettled(batchPromises);
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    }
                    else {
                        logError(result.reason, {
                            operation: 'batch_talent_search_item',
                            index: i + index,
                            criteria: batch[index]
                        });
                    }
                });
                if (i + batchSize < searches.length) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            const duration = Date.now() - startTime;
            logPerformance('batch_talent_search', duration, {
                searchCount: searches.length,
                successCount: results.length
            });
            return results;
        }
        catch (error) {
            logError(error, {
                operation: 'batch_talent_search',
                searchCount: searches.length
            });
            throw error;
        }
    }
    async searchBySkills(skills, options = {}) {
        return this.searchTalent({
            skills,
            location: options.location,
            experience: options.experience,
            remote: options.remote,
        });
    }
    async searchByJobAndLocation(jobTitle, location, additionalCriteria = {}) {
        return this.searchTalent({
            jobTitle,
            location,
            ...additionalCriteria,
        });
    }
    async searchRemoteTalent(criteria) {
        return this.searchTalent({
            ...criteria,
            remote: true,
        });
    }
    async searchBySalaryRange(minSalary, maxSalary, additionalCriteria = {}) {
        return this.searchTalent({
            ...additionalCriteria,
            salaryRange: {
                min: minSalary,
                max: maxSalary,
            },
        });
    }
    validateSearchCriteria(criteria) {
        const hasValidCriteria = !!(criteria.jobTitle ||
            criteria.skills?.length ||
            criteria.location ||
            criteria.experience ||
            criteria.education ||
            criteria.industry);
        if (!hasValidCriteria) {
            throw new Error('At least one search criterion must be provided');
        }
        if (criteria.salaryRange) {
            if (criteria.salaryRange.min < 0 || criteria.salaryRange.max < criteria.salaryRange.min) {
                throw new Error('Invalid salary range');
            }
        }
        return true;
    }
    async getSearchSuggestions(partialCriteria) {
        try {
            const result = await this.withRetry(() => this.client.post('/talent-search/suggestions', {
                criteria: partialCriteria,
            }), 'get_search_suggestions');
            return result;
        }
        catch (error) {
            logError(error, {
                operation: 'get_search_suggestions',
                partialCriteria
            });
            throw error;
        }
    }
    async saveSearch(userId, searchName, criteria) {
        try {
            const result = await this.withRetry(() => this.client.post('/talent-search/save', {
                userId,
                searchName,
                criteria,
                timestamp: new Date().toISOString(),
            }), 'save_search');
            logger.info('Search saved', { userId, searchName });
            return result;
        }
        catch (error) {
            logError(error, {
                operation: 'save_search',
                userId,
                searchName
            });
            throw error;
        }
    }
    async getSavedSearches(userId) {
        try {
            const result = await this.withRetry(() => this.client.get(`/talent-search/saved/${userId}`), 'get_saved_searches');
            return result;
        }
        catch (error) {
            logError(error, {
                operation: 'get_saved_searches',
                userId
            });
            throw error;
        }
    }
}
//# sourceMappingURL=talent-search.service.js.map