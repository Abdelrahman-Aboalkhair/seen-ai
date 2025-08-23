import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { baseConfig } from '@/config/index.js';
import logger, { logError, logExternalAPI } from '@/lib/logger.js';
import type { ServiceConfig } from '@/types/common.types.js';

export abstract class BaseTalentService {
  protected client: AxiosInstance;
  protected serviceConfig: ServiceConfig;

  constructor() {
    this.client = axios.create({
      baseURL: baseConfig.n8n.webhookUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SmartRecruiter-Backend/1.0',
      },
    });

    // Add API key if provided
    if (baseConfig.n8n.apiKey) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${baseConfig.n8n.apiKey}`;
    }

    this.serviceConfig = {
      retries: 3,
      timeout: 30000,
      backoffDelay: 1000,
    };

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('N8N Request', {
          method: config.method,
          url: config.url,
          headers: config.headers,
        });
        return config;
      },
      (error) => {
        logError(error, { service: 'n8n', type: 'request_interceptor' });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('N8N Response', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logError(error, { 
          service: 'n8n', 
          type: 'response_interceptor',
          status: error.response?.status,
          statusText: error.response?.statusText,
        });
        return Promise.reject(error);
      }
    );

    logger.info('Base Talent service initialized');
  }

  // Retry logic for API calls
  protected async withRetry<T>(
    operation: () => Promise<AxiosResponse<T>>,
    operationName: string,
    retries = this.serviceConfig.retries
  ): Promise<T> {
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
      } catch (error: any) {
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
        
        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }
        
        // Exponential backoff
        const delay = this.serviceConfig.backoffDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error(`Failed after ${retries} attempts`);
  }

  // Generate unique search ID
  protected generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      logError(error as Error, { operation: 'n8n_health_check' });
      return false;
    }
  }
}
