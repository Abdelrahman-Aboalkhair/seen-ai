// Question Generation Queue Service - Refactored to use BaseQueueService

import {
  BaseQueueService,
  BaseJobResponse,
  BaseJobStatus,
} from "./base/base-queue.service.js";
import type { QuestionGenerationRequest, Question } from "@/types/ai.types.js";

export interface QuestionGenerationJobData extends QuestionGenerationRequest {
  timestamp: string;
  type: string;
}

export interface QuestionGenerationJobResponse extends BaseJobResponse {
  // Extends base response, can add question generation-specific fields if needed
}

export interface QuestionGenerationJobStatus extends BaseJobStatus {
  // Extends base status, can add question generation-specific fields if needed
}

export class QuestionGenerationQueueService extends BaseQueueService<
  QuestionGenerationJobData,
  Question[]
> {
  constructor() {
    // Create a job processor for question generation
    const jobProcessor = {
      process: async (job: any): Promise<Question[]> => {
        const { request } = job.data;
        // Import service dynamically to avoid circular dependencies
        const { QuestionGenerationService } = await import(
          "./question-generation.service.js"
        );
        const service = new QuestionGenerationService();
        return await service.generateQuestions(request);
      },
      getEstimatedProcessingTime: (data: QuestionGenerationJobData): number => {
        // Estimate based on job description length and number of questions
        const descriptionLength = data.jobDescription.length;
        const questionCount = data.questionCount || 5;
        const complexity = (descriptionLength / 1000) * (questionCount / 5);
        return Math.max(2000, Math.min(15000, complexity * 6000)); // 2-15 seconds
      },
    };

    super("question-generation", jobProcessor);
  }

  /**
   * Create a new question generation job
   */
  async createQuestionGenerationJob(
    request: QuestionGenerationRequest
  ): Promise<string> {
    const jobData: QuestionGenerationJobData = {
      ...request,
      timestamp: new Date().toISOString(),
      type: "question_generation",
    };

    return await this.createJob(jobData, "generate-questions");
  }

  /**
   * Get question generation job status
   */
  async getQuestionGenerationJobStatus(
    jobId: string
  ): Promise<QuestionGenerationJobStatus> {
    return (await this.getJobStatus(jobId)) as QuestionGenerationJobStatus;
  }

  /**
   * Get question generation queue statistics
   */
  async getQuestionGenerationQueueStats() {
    return await this.getQueueStats();
  }
}
