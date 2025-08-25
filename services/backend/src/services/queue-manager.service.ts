// Queue Manager Service - Centralized management of all queues

import { BaseQueueService, JobProcessor } from "./base/base-queue.service.js";
import { CVAnalysisService } from "./cv-analysis.service.js";
import { JobRequirementsService } from "./job-requirements.service.js";
import { InterviewAnalysisService } from "./interview-analysis.service.js";
import type {
  CVAnalysisRequest,
  CVAnalysisResult,
  JobRequirementsRequest,
  JobRequirementsResult,
  InterviewAnalysisRequest,
  InterviewAnalysisResult,
} from "@/types/ai.types.js";

// CV Analysis Job Processor
class CVAnalysisJobProcessor
  implements JobProcessor<CVAnalysisRequest, CVAnalysisResult>
{
  private service: CVAnalysisService;

  constructor() {
    this.service = new CVAnalysisService();
  }

  async process(job: any): Promise<CVAnalysisResult> {
    const { request } = job.data;
    return await this.service.analyzeCV(request);
  }

  getEstimatedProcessingTime(data: CVAnalysisRequest): number {
    // Estimate based on CV text length and complexity
    const cvLength = data.cvText.length;
    const requirementsLength = data.jobRequirements.length;
    const complexity = (cvLength + requirementsLength) / 1000; // Base complexity on text length
    return Math.max(5000, Math.min(30000, complexity * 10000)); // 5-30 seconds
  }
}

// Job Requirements Job Processor
class JobRequirementsJobProcessor
  implements JobProcessor<JobRequirementsRequest, JobRequirementsResult>
{
  private service: JobRequirementsService;

  constructor() {
    this.service = new JobRequirementsService();
  }

  async process(job: any): Promise<JobRequirementsResult> {
    const { request } = job.data;
    return await this.service.generateJobRequirements(request);
  }

  getEstimatedProcessingTime(data: JobRequirementsRequest): number {
    // Estimate based on job title and other fields
    const titleLength = data.jobTitle.length;
    const complexity =
      (titleLength +
        (data.industry?.length || 0) +
        (data.seniority?.length || 0)) /
      100;
    return Math.max(3000, Math.min(20000, complexity * 8000)); // 3-20 seconds
  }
}

// Interview Analysis Job Processor
class InterviewAnalysisJobProcessor
  implements JobProcessor<InterviewAnalysisRequest, InterviewAnalysisResult>
{
  private service: InterviewAnalysisService;

  constructor() {
    this.service = new InterviewAnalysisService();
  }

  async process(job: any): Promise<InterviewAnalysisResult> {
    const { request } = job.data;
    return await this.service.analyzeInterview(request);
  }

  getEstimatedProcessingTime(data: InterviewAnalysisRequest): number {
    // Estimate based on questions and answers complexity
    const questionsCount = data.questions.length;
    const answersLength = data.answers.reduce(
      (total, answer) => total + answer.answer.length,
      0
    );
    const complexity = (questionsCount * 100 + answersLength) / 1000;
    return Math.max(4000, Math.min(25000, complexity * 9000)); // 4-25 seconds
  }
}

export class QueueManagerService {
  private static instance: QueueManagerService;
  private queues: Map<string, BaseQueueService<any, any>> = new Map();

  private constructor() {
    this.initializeQueues();
  }

  public static getInstance(): QueueManagerService {
    if (!QueueManagerService.instance) {
      QueueManagerService.instance = new QueueManagerService();
    }
    return QueueManagerService.instance;
  }

  private initializeQueues(): void {
    console.log("🔧 [Queue Manager] Initializing all queues...");

    // Initialize CV Analysis Queue
    const cvAnalysisQueue = new BaseQueueService(
      "cv-analysis",
      new CVAnalysisJobProcessor(),
      { url: process.env.REDIS_URL }
    );
    this.queues.set("cv-analysis", cvAnalysisQueue);

    // Initialize Job Requirements Queue
    const jobRequirementsQueue = new BaseQueueService(
      "job-requirements",
      new JobRequirementsJobProcessor(),
      { url: process.env.REDIS_URL }
    );
    this.queues.set("job-requirements", jobRequirementsQueue);

    // Initialize Interview Analysis Queue
    const interviewAnalysisQueue = new BaseQueueService(
      "interview-analysis",
      new InterviewAnalysisJobProcessor(),
      { url: process.env.REDIS_URL }
    );
    this.queues.set("interview-analysis", interviewAnalysisQueue);

    console.log("✅ [Queue Manager] All queues initialized successfully");
  }

  /**
   * Get a specific queue by name
   */
  getQueue<T = any, R = any>(
    queueName: string
  ): BaseQueueService<T, R> | undefined {
    return this.queues.get(queueName) as BaseQueueService<T, R>;
  }

  /**
   * Get CV Analysis Queue
   */
  getCVAnalysisQueue(): BaseQueueService<CVAnalysisRequest, CVAnalysisResult> {
    return this.queues.get("cv-analysis") as BaseQueueService<
      CVAnalysisRequest,
      CVAnalysisResult
    >;
  }

  /**
   * Get Job Requirements Queue
   */
  getJobRequirementsQueue(): BaseQueueService<
    JobRequirementsRequest,
    JobRequirementsResult
  > {
    return this.queues.get("job-requirements") as BaseQueueService<
      JobRequirementsRequest,
      JobRequirementsResult
    >;
  }

  /**
   * Get Interview Analysis Queue
   */
  getInterviewAnalysisQueue(): BaseQueueService<
    InterviewAnalysisRequest,
    InterviewAnalysisResult
  > {
    return this.queues.get("interview-analysis") as BaseQueueService<
      InterviewAnalysisRequest,
      InterviewAnalysisResult
    >;
  }

  /**
   * Get Question Generation Queue
   */
  getQuestionGenerationQueue(): BaseQueueService<
    QuestionGenerationRequest,
    Question[]
  > {
    return this.queues.get("question-generation") as BaseQueueService<
      QuestionGenerationRequest,
      Question[]
    >;
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const [queueName, queue] of this.queues) {
      try {
        stats[queueName] = await queue.getQueueStats();
      } catch (error) {
        console.error(
          `❌ [Queue Manager] Error getting stats for ${queueName}:`,
          error
        );
        stats[queueName] = { error: "Failed to get stats" };
      }
    }

    return stats;
  }

  /**
   * Clean up old jobs for all queues
   */
  async cleanupAllQueues(maxAgeHours: number = 24): Promise<void> {
    console.log(
      `🧹 [Queue Manager] Cleaning up old jobs for all queues (older than ${maxAgeHours}h)...`
    );

    const cleanupPromises = Array.from(this.queues.values()).map((queue) =>
      queue.cleanupOldJobs(maxAgeHours)
    );

    await Promise.allSettled(cleanupPromises);
    console.log("✅ [Queue Manager] Cleanup completed for all queues");
  }

  /**
   * Shutdown all queues gracefully
   */
  async shutdownAllQueues(): Promise<void> {
    console.log("🔄 [Queue Manager] Shutting down all queues...");

    const shutdownPromises = Array.from(this.queues.values()).map((queue) =>
      queue.shutdown()
    );

    await Promise.allSettled(shutdownPromises);
    console.log("✅ [Queue Manager] All queues shut down successfully");
  }

  /**
   * Get queue health status
   */
  async getHealthStatus(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    queues: Record<string, { status: string; message: string }>;
    timestamp: string;
  }> {
    const queueStatuses: Record<string, { status: string; message: string }> =
      {};
    let healthyQueues = 0;
    let totalQueues = this.queues.size;

    for (const [queueName, queue] of this.queues) {
      try {
        const stats = await queue.getQueueStats();
        const isHealthy = stats.active >= 0 && stats.failed < 10; // Basic health check

        if (isHealthy) {
          healthyQueues++;
          queueStatuses[queueName] = {
            status: "healthy",
            message: "Queue operating normally",
          };
        } else {
          queueStatuses[queueName] = {
            status: "degraded",
            message: "Queue has issues",
          };
        }
      } catch (error) {
        queueStatuses[queueName] = {
          status: "unhealthy",
          message: `Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
      }
    }

    const healthPercentage = (healthyQueues / totalQueues) * 100;
    let overallStatus: "healthy" | "degraded" | "unhealthy";

    if (healthPercentage >= 90) {
      overallStatus = "healthy";
    } else if (healthPercentage >= 50) {
      overallStatus = "degraded";
    } else {
      overallStatus = "unhealthy";
    }

    return {
      status: overallStatus,
      queues: queueStatuses,
      timestamp: new Date().toISOString(),
    };
  }
}
