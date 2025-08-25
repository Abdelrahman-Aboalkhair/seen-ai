// Interview Analysis Queue Service - Refactored to use BaseQueueService

import {
  BaseQueueService,
  BaseJobResponse,
  BaseJobStatus,
} from "./base/base-queue.service.js";
import type {
  InterviewAnalysisRequest,
  InterviewAnalysisResult,
} from "@/types/ai.types.js";

export interface InterviewAnalysisJobData extends InterviewAnalysisRequest {
  timestamp: string;
  type: string;
}

export interface InterviewAnalysisJobResponse extends BaseJobResponse {
  // Extends base response, can add interview analysis-specific fields if needed
}

export interface InterviewAnalysisJobStatus extends BaseJobStatus {
  // Extends base status, can add interview analysis-specific fields if needed
}

export class InterviewAnalysisQueueService extends BaseQueueService<
  InterviewAnalysisJobData,
  InterviewAnalysisResult
> {
  constructor() {
    // Create a job processor for interview analysis
    const jobProcessor = {
      process: async (job: any): Promise<InterviewAnalysisResult> => {
        const { request } = job.data;
        // Import service dynamically to avoid circular dependencies
        const { InterviewAnalysisService } = await import(
          "./interview-analysis.service.js"
        );
        const service = new InterviewAnalysisService();
        return await service.analyzeInterview(request);
      },
      getEstimatedProcessingTime: (data: InterviewAnalysisJobData): number => {
        // Estimate based on questions and answers complexity
        const questionsCount = data.questions.length;
        const answersLength = data.answers.reduce(
          (total, answer) => total + answer.answer.length,
          0
        );
        const complexity = (questionsCount * 100 + answersLength) / 1000;
        return Math.max(4000, Math.min(25000, complexity * 9000)); // 4-25 seconds
      },
    };

    super("interview-analysis", jobProcessor);
  }

  /**
   * Create a new interview analysis job
   */
  async createInterviewAnalysisJob(
    request: InterviewAnalysisRequest
  ): Promise<string> {
    const jobData: InterviewAnalysisJobData = {
      ...request,
      timestamp: new Date().toISOString(),
      type: "interview_analysis",
    };

    return await this.createJob(jobData, "analyze-interview");
  }

  /**
   * Get interview analysis job status
   */
  async getInterviewAnalysisJobStatus(
    jobId: string
  ): Promise<InterviewAnalysisJobStatus> {
    return (await this.getJobStatus(jobId)) as InterviewAnalysisJobStatus;
  }

  /**
   * Get interview analysis queue statistics
   */
  async getInterviewAnalysisQueueStats() {
    return await this.getQueueStats();
  }
}
