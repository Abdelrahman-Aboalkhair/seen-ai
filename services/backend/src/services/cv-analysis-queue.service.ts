// CV Analysis Queue Service - Refactored to use BaseQueueService

import {
  BaseQueueService,
  BaseJobResponse,
  BaseJobStatus,
} from "./base/base-queue.service.js";
import type { CVAnalysisRequest, CVAnalysisResult } from "@/types/ai.types.js";

export interface CVAnalysisJobData extends CVAnalysisRequest {
  timestamp: string;
  type: string;
}

export interface CVAnalysisJobResponse extends BaseJobResponse {
  // Extends base response, can add CV-specific fields if needed
}

export interface CVAnalysisJobStatus extends BaseJobStatus {
  // Extends base status, can add CV-specific fields if needed
}

export class CVAnalysisQueueService extends BaseQueueService<
  CVAnalysisJobData,
  CVAnalysisResult
> {
  constructor() {
    // Create a job processor for CV analysis
    const jobProcessor = {
      process: async (job: any): Promise<CVAnalysisResult> => {
        // The job.data contains the full CVAnalysisJobData, not wrapped in a 'request' property
        const jobData = job.data;
        // Import service dynamically to avoid circular dependencies
        const { CVAnalysisService } = await import("./cv-analysis.service.js");
        const service = new CVAnalysisService();
        return await service.analyzeCV(jobData);
      },
      getEstimatedProcessingTime: (data: CVAnalysisJobData): number => {
        // Estimate based on CV text length and complexity
        const cvLength = data.cvText?.length ?? 0;
        const requirementsLength = data.jobRequirements.length;
        const complexity = (cvLength + requirementsLength) / 1000;
        return Math.max(5000, Math.min(30000, complexity * 10000)); // 5-30 seconds
      },
    };

    super("cv-analysis", jobProcessor);
  }

  /**
   * Create a new CV analysis job
   */
  async createCVAnalysisJob(request: CVAnalysisRequest): Promise<string> {
    const jobData: CVAnalysisJobData = {
      ...request,
      timestamp: new Date().toISOString(),
      type: "cv_analysis",
    };

    return await this.createJob(jobData, "analyze-cv");
  }

  /**
   * Get CV analysis job status
   */
  async getCVAnalysisJobStatus(jobId: string): Promise<CVAnalysisJobStatus> {
    return (await this.getJobStatus(jobId)) as CVAnalysisJobStatus;
  }

  /**
   * Get CV analysis queue statistics
   */
  async getCVAnalysisQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return await this.getQueueStats();
  }

  /**
   * Get CV analysis job progress
   */
  async getCVAnalysisJobProgress(jobId: string): Promise<number> {
    return await this.getJobProgress(jobId);
  }

  /**
   * Get all CV analysis jobs
   */
  async getAllCVAnalysisJobs() {
    return await this.getAllJobs();
  }
}
