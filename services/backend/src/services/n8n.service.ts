import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { baseConfig } from '@/config/index.js';
import logger, { logError, logExternalAPI, logPerformance } from '@/lib/logger.js';

export interface TalentSearchCriteria {
  jobTitle?: string;
  skills?: string[];
  location?: string;
  experience?: string;
  education?: string;
  salaryRange?: {
    min: number;
    max: number;
  };
  remote?: boolean;
  industry?: string;
  companySize?: string;
}

export interface TalentProfile {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  skills: string[];
  experience: number;
  location: string;
  education: string;
  summary: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  availability: 'available' | 'passive' | 'not_available';
  expectedSalary?: number;
  remote: boolean;
  matchScore?: number;
}

export interface TalentSearchResult {
  profiles: TalentProfile[];
  totalCount: number;
  searchId: string;
  timestamp: string;
  criteria: TalentSearchCriteria;
}

export interface WorkflowTriggerRequest {
  workflowId: string;
  data: Record<string, any>;
  webhookUrl?: string;
}

export interface WorkflowTriggerResponse {
  executionId: string;
  status: 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

class N8NService {
  private client: AxiosInstance;
  private maxRetries = 3;
  private retryDelay = 1000;

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

    logger.info('N8N service initialized');
  }

  // Retry logic for API calls
  private async withRetry<T>(
    operation: () => Promise<AxiosResponse<T>>,
    operationName: string,
    retries = this.maxRetries
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
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error(`Failed after ${retries} attempts`);
  }

  // Talent search with retry logic
  async searchTalent(criteria: TalentSearchCriteria): Promise<TalentSearchResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting talent search', { criteria });

      const result = await this.withRetry(
        () => this.client.post<TalentSearchResult>('/talent-search', {
          criteria,
          timestamp: new Date().toISOString(),
          searchId: this.generateSearchId(),
        }),
        'talent_search'
      );

      const duration = Date.now() - startTime;
      logPerformance('talent_search_completed', duration, { 
        profileCount: result.profiles?.length || 0,
        criteria: JSON.stringify(criteria)
      });

      return result;
    } catch (error) {
      logError(error as Error, { 
        operation: 'search_talent', 
        criteria 
      });
      throw error;
    }
  }

  // Batch talent searches
  async batchTalentSearch(searches: TalentSearchCriteria[]): Promise<TalentSearchResult[]> {
    const startTime = Date.now();
    const batchSize = Math.min(searches.length, baseConfig.performance.batchSizeLimit);
    const results: TalentSearchResult[] = [];

    logger.info('Starting batch talent search', { 
      count: searches.length, 
      batchSize 
    });

    try {
      // Process in batches to avoid overwhelming N8N
      for (let i = 0; i < searches.length; i += batchSize) {
        const batch = searches.slice(i, i + batchSize);
        
        const batchPromises = batch.map(criteria => this.searchTalent(criteria));
        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            logError(result.reason, { 
              operation: 'batch_talent_search_item', 
              index: i + index,
              criteria: batch[index]
            });
          }
        });

        // Add delay between batches
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
    } catch (error) {
      logError(error as Error, { 
        operation: 'batch_talent_search', 
        searchCount: searches.length 
      });
      throw error;
    }
  }

  // Trigger custom workflow
  async triggerWorkflow(request: WorkflowTriggerRequest): Promise<WorkflowTriggerResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Triggering N8N workflow', { 
        workflowId: request.workflowId,
        dataKeys: Object.keys(request.data)
      });

      const result = await this.withRetry(
        () => this.client.post<WorkflowTriggerResponse>('/workflow/trigger', {
          workflowId: request.workflowId,
          data: request.data,
          webhookUrl: request.webhookUrl,
          timestamp: new Date().toISOString(),
        }),
        'trigger_workflow'
      );

      const duration = Date.now() - startTime;
      logPerformance('workflow_triggered', duration, { 
        workflowId: request.workflowId,
        executionId: result.executionId
      });

      return result;
    } catch (error) {
      logError(error as Error, { 
        operation: 'trigger_workflow', 
        workflowId: request.workflowId 
      });
      throw error;
    }
  }

  // Get workflow execution status
  async getWorkflowStatus(executionId: string): Promise<WorkflowTriggerResponse> {
    try {
      const result = await this.withRetry(
        () => this.client.get<WorkflowTriggerResponse>(`/workflow/status/${executionId}`),
        'get_workflow_status'
      );

      return result;
    } catch (error) {
      logError(error as Error, { 
        operation: 'get_workflow_status', 
        executionId 
      });
      throw error;
    }
  }

  // Cancel workflow execution
  async cancelWorkflow(executionId: string): Promise<boolean> {
    try {
      await this.withRetry(
        () => this.client.post(`/workflow/cancel/${executionId}`),
        'cancel_workflow'
      );

      logger.info('Workflow cancelled', { executionId });
      return true;
    } catch (error) {
      logError(error as Error, { 
        operation: 'cancel_workflow', 
        executionId 
      });
      return false;
    }
  }

  // Advanced talent search with filters
  async advancedTalentSearch(
    criteria: TalentSearchCriteria,
    filters: {
      excludeCompanies?: string[];
      includePassiveCandidates?: boolean;
      minMatchScore?: number;
      sortBy?: 'relevance' | 'experience' | 'salary' | 'location';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<TalentSearchResult> {
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

      const result = await this.withRetry(
        () => this.client.post<TalentSearchResult>('/talent-search/advanced', searchPayload),
        'advanced_talent_search'
      );

      const duration = Date.now() - startTime;
      logPerformance('advanced_talent_search_completed', duration, { 
        profileCount: result.profiles?.length || 0,
        criteria: JSON.stringify(criteria),
        filters: JSON.stringify(filters)
      });

      return result;
    } catch (error) {
      logError(error as Error, { 
        operation: 'advanced_talent_search', 
        criteria,
        filters 
      });
      throw error;
    }
  }

  // Get talent profile details
  async getTalentProfile(profileId: string): Promise<TalentProfile> {
    try {
      const result = await this.withRetry(
        () => this.client.get<TalentProfile>(`/talent/profile/${profileId}`),
        'get_talent_profile'
      );

      return result;
    } catch (error) {
      logError(error as Error, { 
        operation: 'get_talent_profile', 
        profileId 
      });
      throw error;
    }
  }

  // Send outreach message to talent
  async sendOutreachMessage(
    profileId: string,
    message: {
      subject: string;
      content: string;
      templateId?: string;
      personalizedFields?: Record<string, string>;
    }
  ): Promise<{ messageId: string; status: string }> {
    try {
      const result = await this.withRetry(
        () => this.client.post(`/talent/outreach/${profileId}`, {
          message,
          timestamp: new Date().toISOString(),
        }),
        'send_outreach_message'
      );

      logger.info('Outreach message sent', { 
        profileId, 
        messageId: result.messageId 
      });

      return result;
    } catch (error) {
      logError(error as Error, { 
        operation: 'send_outreach_message', 
        profileId 
      });
      throw error;
    }
  }

  // Get search analytics
  async getSearchAnalytics(
    dateRange: {
      startDate: string;
      endDate: string;
    },
    filters?: {
      userId?: string;
      jobTitle?: string;
      location?: string;
    }
  ): Promise<{
    totalSearches: number;
    totalProfiles: number;
    averageMatchScore: number;
    topSkills: string[];
    searchTrends: Array<{
      date: string;
      searchCount: number;
      profileCount: number;
    }>;
  }> {
    try {
      const result = await this.withRetry(
        () => this.client.get('/analytics/searches', {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            ...filters,
          },
        }),
        'get_search_analytics'
      );

      return result;
    } catch (error) {
      logError(error as Error, { 
        operation: 'get_search_analytics', 
        dateRange,
        filters 
      });
      throw error;
    }
  }

  // Helper method to generate unique search ID
  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Validate search criteria
  private validateSearchCriteria(criteria: TalentSearchCriteria): boolean {
    // At least one search criterion must be provided
    const hasValidCriteria = !!(
      criteria.jobTitle ||
      criteria.skills?.length ||
      criteria.location ||
      criteria.experience ||
      criteria.education ||
      criteria.industry
    );

    if (!hasValidCriteria) {
      throw new Error('At least one search criterion must be provided');
    }

    // Validate salary range if provided
    if (criteria.salaryRange) {
      if (criteria.salaryRange.min < 0 || criteria.salaryRange.max < criteria.salaryRange.min) {
        throw new Error('Invalid salary range');
      }
    }

    return true;
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

  // Get webhook URL for specific workflow
  getWebhookUrl(workflowId: string): string {
    return `${baseConfig.n8n.webhookUrl}/webhook/${workflowId}`;
  }

  // Test webhook connectivity
  async testWebhook(workflowId: string): Promise<boolean> {
    try {
      const webhookUrl = this.getWebhookUrl(workflowId);
      const response = await axios.post(webhookUrl, {
        test: true,
        timestamp: new Date().toISOString(),
      }, { timeout: 10000 });

      return response.status === 200;
    } catch (error) {
      logError(error as Error, { 
        operation: 'test_webhook', 
        workflowId 
      });
      return false;
    }
  }
}

// Create singleton instance
const n8nService = new N8NService();

export default n8nService;