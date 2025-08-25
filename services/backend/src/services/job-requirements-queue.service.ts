// Job Requirements Queue Service - Refactored to use BaseQueueService

import {
  BaseQueueService,
  BaseJobResponse,
  BaseJobStatus,
} from "./base/base-queue.service.js";
import type {
  JobRequirementsRequest,
  JobRequirementsResult,
} from "@/types/ai.types.js";

export interface JobRequirementsJobData extends JobRequirementsRequest {
  timestamp: string;
  type: string;
}

export interface JobRequirementsJobResponse extends BaseJobResponse {
  // Extends base response, can add job requirements-specific fields if needed
}

export interface JobRequirementsJobStatus extends BaseJobStatus {
  // Extends base status, can add job requirements-specific fields if needed
}

export class JobRequirementsQueueService extends BaseQueueService<
  JobRequirementsJobData,
  JobRequirementsResult
> {
  constructor() {
    // Create a job processor for job requirements generation
    const jobProcessor = {
      process: async (job: any): Promise<JobRequirementsResult> => {
        const { request } = job.data;
        // Import service dynamically to avoid circular dependencies
        const { JobRequirementsService } = await import(
          "./job-requirements.service.js"
        );
        const service = new JobRequirementsService();
        return await service.generateJobRequirements(request);
      },
      getEstimatedProcessingTime: (data: JobRequirementsJobData): number => {
        // Estimate based on job description length
        const descriptionLength = data.jobDescription.length;
        const complexity = descriptionLength / 1000;
        return Math.max(3000, Math.min(20000, complexity * 8000)); // 3-20 seconds
      },
    };

    super("job-requirements", jobProcessor);
  }

  /**
   * Create a new job requirements generation job
   */
  async createJobRequirementsJob(
    request: JobRequirementsRequest
  ): Promise<string> {
    const jobData: JobRequirementsJobData = {
      ...request,
      timestamp: new Date().toISOString(),
      type: "job_requirements_generation",
    };

    return await this.createJob(jobData, "generate-requirements");
  }

  /**
   * Get job requirements job status
   */
  async getJobRequirementsJobStatus(
    jobId: string
  ): Promise<JobRequirementsJobStatus> {
    return (await this.getJobStatus(jobId)) as JobRequirementsJobStatus;
  }

  /**
   * Get job requirements queue statistics
   */
  async getJobRequirementsQueueStats() {
    return await this.getQueueStats();
  }
}
