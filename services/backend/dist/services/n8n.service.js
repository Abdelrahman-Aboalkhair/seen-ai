import axios from 'axios';
import { baseConfig } from '@/config/index.js';
import logger, { logError, logExternalAPI, logPerformance } from '@/lib/logger.js';
class N8NService {
    client;
    maxRetries = 3;
    retryDelay = 1000;
    constructor() {
        this.client = axios.create({
            baseURL: baseConfig.n8n.webhookUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'SmartRecruiter-Backend/1.0',
            },
        });
        if (baseConfig.n8n.apiKey) {
            this.client.defaults.headers.common['Authorization'] = `Bearer ${baseConfig.n8n.apiKey}`;
        }
        this.client.interceptors.request.use((config) => {
            logger.debug('N8N Request', {
                method: config.method,
                url: config.url,
                headers: config.headers,
            });
            return config;
        }, (error) => {
            logError(error, { service: 'n8n', type: 'request_interceptor' });
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => {
            logger.debug('N8N Response', {
                status: response.status,
                statusText: response.statusText,
                url: response.config.url,
            });
            return response;
        }, (error) => {
            logError(error, {
                service: 'n8n',
                type: 'response_interceptor',
                status: error.response?.status,
                statusText: error.response?.statusText,
            });
            return Promise.reject(error);
        });
        logger.info('N8N service initialized');
    }
    async withRetry(operation, operationName, retries = this.maxRetries) {
        const startTime = Date.now();
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await operation();
                const duration = Date.now() - startTime;
                logExternalAPI('n8n', operationName, duration, true, {
                    attempt,
                    status: response.status
                });
                return response.data;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logExternalAPI('n8n', operationName, duration, false, {
                    attempt,
                    error: error.message,
                    status: error.response?.status
                });
                if (attempt === retries) {
                    logError(error, { operation: operationName, attempts: retries });
                    throw error;
                }
                if (error.response?.status >= 400 && error.response?.status < 500) {
                    throw error;
                }
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error(`Failed after ${retries} attempts`);
    }
    async searchTalent(criteria) {
        const startTime = Date.now();
        try {
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
    async batchTalentSearch(searches) {
        const startTime = Date.now();
        const batchSize = Math.min(searches.length, baseConfig.performance.batchSizeLimit);
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
    async triggerWorkflow(request) {
        const startTime = Date.now();
        try {
            logger.info('Triggering N8N workflow', {
                workflowId: request.workflowId,
                dataKeys: Object.keys(request.data)
            });
            const result = await this.withRetry(() => this.client.post('/workflow/trigger', {
                workflowId: request.workflowId,
                data: request.data,
                webhookUrl: request.webhookUrl,
                timestamp: new Date().toISOString(),
            }), 'trigger_workflow');
            const duration = Date.now() - startTime;
            logPerformance('workflow_triggered', duration, {
                workflowId: request.workflowId,
                executionId: result.executionId
            });
            return result;
        }
        catch (error) {
            logError(error, {
                operation: 'trigger_workflow',
                workflowId: request.workflowId
            });
            throw error;
        }
    }
    async getWorkflowStatus(executionId) {
        try {
            const result = await this.withRetry(() => this.client.get(`/workflow/status/${executionId}`), 'get_workflow_status');
            return result;
        }
        catch (error) {
            logError(error, {
                operation: 'get_workflow_status',
                executionId
            });
            throw error;
        }
    }
    async cancelWorkflow(executionId) {
        try {
            await this.withRetry(() => this.client.post(`/workflow/cancel/${executionId}`), 'cancel_workflow');
            logger.info('Workflow cancelled', { executionId });
            return true;
        }
        catch (error) {
            logError(error, {
                operation: 'cancel_workflow',
                executionId
            });
            return false;
        }
    }
    async advancedTalentSearch(criteria, filters = {}) {
        const startTime = Date.now();
        try {
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
    async getTalentProfile(profileId) {
        try {
            const result = await this.withRetry(() => this.client.get(`/talent/profile/${profileId}`), 'get_talent_profile');
            return result;
        }
        catch (error) {
            logError(error, {
                operation: 'get_talent_profile',
                profileId
            });
            throw error;
        }
    }
    async sendOutreachMessage(profileId, message) {
        try {
            const result = await this.withRetry(() => this.client.post(`/talent/outreach/${profileId}`, {
                message,
                timestamp: new Date().toISOString(),
            }), 'send_outreach_message');
            logger.info('Outreach message sent', {
                profileId,
                messageId: result.messageId
            });
            return result;
        }
        catch (error) {
            logError(error, {
                operation: 'send_outreach_message',
                profileId
            });
            throw error;
        }
    }
    async getSearchAnalytics(dateRange, filters) {
        try {
            const result = await this.withRetry(() => this.client.get('/analytics/searches', {
                params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    ...filters,
                },
            }), 'get_search_analytics');
            return result;
        }
        catch (error) {
            logError(error, {
                operation: 'get_search_analytics',
                dateRange,
                filters
            });
            throw error;
        }
    }
    generateSearchId() {
        return `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
    async healthCheck() {
        try {
            const response = await this.client.get('/health', { timeout: 5000 });
            return response.status === 200;
        }
        catch (error) {
            logError(error, { operation: 'n8n_health_check' });
            return false;
        }
    }
    getWebhookUrl(workflowId) {
        return `${baseConfig.n8n.webhookUrl}/webhook/${workflowId}`;
    }
    async testWebhook(workflowId) {
        try {
            const webhookUrl = this.getWebhookUrl(workflowId);
            const response = await axios.post(webhookUrl, {
                test: true,
                timestamp: new Date().toISOString(),
            }, { timeout: 10000 });
            return response.status === 200;
        }
        catch (error) {
            logError(error, {
                operation: 'test_webhook',
                workflowId
            });
            return false;
        }
    }
}
const n8nService = new N8NService();
export default n8nService;
//# sourceMappingURL=n8n.service.js.map