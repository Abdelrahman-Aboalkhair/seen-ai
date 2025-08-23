import axios from 'axios';
import { baseConfig } from '@/config/index.js';
import logger, { logError, logExternalAPI } from '@/lib/logger.js';
export class BaseTalentService {
    client;
    serviceConfig;
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
        this.serviceConfig = {
            retries: 3,
            timeout: 30000,
            backoffDelay: 1000,
        };
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
        logger.info('Base Talent service initialized');
    }
    async withRetry(operation, operationName, retries = this.serviceConfig.retries) {
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
                const delay = this.serviceConfig.backoffDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error(`Failed after ${retries} attempts`);
    }
    generateSearchId() {
        return `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
}
//# sourceMappingURL=base-talent.service.js.map