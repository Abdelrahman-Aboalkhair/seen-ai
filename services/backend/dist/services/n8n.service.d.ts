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
declare class N8NService {
    private client;
    private maxRetries;
    private retryDelay;
    constructor();
    private withRetry;
    searchTalent(criteria: TalentSearchCriteria): Promise<TalentSearchResult>;
    batchTalentSearch(searches: TalentSearchCriteria[]): Promise<TalentSearchResult[]>;
    triggerWorkflow(request: WorkflowTriggerRequest): Promise<WorkflowTriggerResponse>;
    getWorkflowStatus(executionId: string): Promise<WorkflowTriggerResponse>;
    cancelWorkflow(executionId: string): Promise<boolean>;
    advancedTalentSearch(criteria: TalentSearchCriteria, filters?: {
        excludeCompanies?: string[];
        includePassiveCandidates?: boolean;
        minMatchScore?: number;
        sortBy?: 'relevance' | 'experience' | 'salary' | 'location';
        limit?: number;
        offset?: number;
    }): Promise<TalentSearchResult>;
    getTalentProfile(profileId: string): Promise<TalentProfile>;
    sendOutreachMessage(profileId: string, message: {
        subject: string;
        content: string;
        templateId?: string;
        personalizedFields?: Record<string, string>;
    }): Promise<{
        messageId: string;
        status: string;
    }>;
    getSearchAnalytics(dateRange: {
        startDate: string;
        endDate: string;
    }, filters?: {
        userId?: string;
        jobTitle?: string;
        location?: string;
    }): Promise<{
        totalSearches: number;
        totalProfiles: number;
        averageMatchScore: number;
        topSkills: string[];
        searchTrends: Array<{
            date: string;
            searchCount: number;
            profileCount: number;
        }>;
    }>;
    private generateSearchId;
    private validateSearchCriteria;
    healthCheck(): Promise<boolean>;
    getWebhookUrl(workflowId: string): string;
    testWebhook(workflowId: string): Promise<boolean>;
}
declare const n8nService: N8NService;
export default n8nService;
//# sourceMappingURL=n8n.service.d.ts.map