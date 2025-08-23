import { BaseAIService } from './base-ai.service.js';
import type { JobRequirementsRequest, JobRequirementsResult } from '@/types/ai.types.js';
export declare class JobRequirementsService extends BaseAIService {
    generateJobRequirements(request: JobRequirementsRequest): Promise<JobRequirementsResult>;
    private generateJobDescription;
    generateMultipleJobRequirements(requests: JobRequirementsRequest[]): Promise<JobRequirementsResult[]>;
    generateFocusedJobRequirements(request: JobRequirementsRequest, focus: 'technical' | 'leadership' | 'creative' | 'sales'): Promise<JobRequirementsResult>;
    updateJobRequirements(existingRequirements: JobRequirementsResult, updates: Partial<JobRequirementsRequest>): Promise<JobRequirementsResult>;
}
//# sourceMappingURL=job-requirements.service.d.ts.map