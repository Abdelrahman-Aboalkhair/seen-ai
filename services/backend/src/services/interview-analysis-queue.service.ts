// Interview Analysis Job Queue Service - BullMQ-based async processing

import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";
import type {
  InterviewAnalysisRequest,
  InterviewAnalysisResult,
} from "@/types/ai.types.js";
import { InterviewAnalysisService } from "./interview-analysis.service.js";

export interface InterviewAnalysisJob {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  request: InterviewAnalysisRequest;
  result?: InterviewAnalysisResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  processingTime?: number;
}

export interface InterviewAnalysisJobResponse {
  success: boolean;
  jobId: string;
  message: string;
  status: string;
  estimatedTime: number;
  pollUrl: string;
}

export interface InterviewAnalysisJobStatus {
  success: boolean;
  jobId: string;
  status: string;
  progress?: number;
  estimatedTimeRemaining?: number;
  result?: InterviewAnalysisResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export class InterviewAnalysisQueueService {
  private redis: Redis;
  private interviewAnalysisQueue: Queue;
  private worker: Worker;
  private queueEvents: QueueEvents;
  private service: InterviewAnalysisService;

  constructor() {
    // Initialize Redis connection with BullMQ-compatible options
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
      maxRetriesPerRequest: null, // Required by BullMQ
    });

    // Initialize queue
    this.interviewAnalysisQueue = new Queue("interview-analysis", {
      connection: this.redis,
    });

    // Initialize queue events for monitoring
    this.queueEvents = new QueueEvents("interview-analysis", {
      connection: this.redis,
    });

    // Initialize service
    this.service = new InterviewAnalysisService();

    // Initialize worker
    this.initializeWorker();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Create a new interview analysis job
   */
  async createInterviewAnalysisJob(
    request: InterviewAnalysisRequest
  ): Promise<string> {
    const job = await this.interviewAnalysisQueue.add(
      "analyze-interview",
      {
        request,
        timestamp: new Date().toISOString(),
        type: "interview_analysis",
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
        jobId: `interview_analysis_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      }
    );

    return job.id as string;
  }

    /**
   * Get job status and result
   */
  async getJobStatus(jobId: string): Promise<InterviewAnalysisJob | null> {
    try {
      const job = await this.interviewAnalysisQueue.getJob(jobId);
      
      if (!job) {
        console.log(`Job ${jobId} not found in queue`);
        return null;
      }

      console.log(`Raw BullMQ job data for ${jobId}:`, {
        id: job.id,
        status: job.status,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        returnvalue: !!job.returnvalue,
        failedReason: job.failedReason,
        timestamp: job.timestamp,
        data: job.data,
      });

      const jobData = job.data;
      const mappedStatus = this.mapBullMQStatus(job.status);
      
      console.log(`Mapped status for job ${jobId}: ${job.status} -> ${mappedStatus}`);
      
      const interviewAnalysisJob: InterviewAnalysisJob = {
        jobId: job.id as string,
        status: mappedStatus,
        request: jobData.request,
        result: job.returnvalue || undefined,
        error: job.failedReason || undefined,
        createdAt: job.timestamp
          ? new Date(job.timestamp).toISOString()
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: job.processedOn
          ? new Date(job.processedOn).toISOString()
          : undefined,
        completedAt: job.finishedOn
          ? new Date(job.finishedOn).toISOString()
          : undefined,
        processingTime:
          job.finishedOn && job.processedOn
            ? job.finishedOn - job.processedOn
            : undefined,
      };

      console.log(`Constructed job status for ${jobId}:`, {
        status: interviewAnalysisJob.status,
        hasResult: !!interviewAnalysisJob.result,
        hasError: !!interviewAnalysisJob.error,
        processingTime: interviewAnalysisJob.processingTime,
      });

      return interviewAnalysisJob;
    } catch (error) {
      console.error("Error getting interview analysis job status:", error);
      return null;
    }
  }

  /**
   * Get all jobs (for monitoring)
   */
  async getAllJobs(): Promise<InterviewAnalysisJob[]> {
    try {
      const jobs = await this.interviewAnalysisQueue.getJobs([
        "completed",
        "failed",
        "active",
        "waiting",
        "delayed",
      ]);

      return jobs.map((job) => ({
        jobId: job.id as string,
        status: this.mapBullMQStatus(job.status),
        request: job.data.request,
        result: job.returnvalue || undefined,
        error: job.failedReason || undefined,
        createdAt: job.timestamp
          ? new Date(job.timestamp).toISOString()
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: job.processedOn
          ? new Date(job.processedOn).toISOString()
          : undefined,
        completedAt: job.finishedOn
          ? new Date(job.finishedOn).toISOString()
          : undefined,
        processingTime:
          job.finishedOn && job.processedOn
            ? job.finishedOn - job.processedOn
            : undefined,
      }));
    } catch (error) {
      console.error("Error getting all interview analysis jobs:", error);
      return [];
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const stats = await this.interviewAnalysisQueue.getJobCounts();
      return stats;
    } catch (error) {
      console.error("Error getting queue stats:", error);
      return null;
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(maxAgeHours: number = 24): Promise<void> {
    try {
      const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;

      await Promise.all([
        this.interviewAnalysisQueue.clean(cutoff, 100, "completed"),
        this.interviewAnalysisQueue.clean(cutoff, 100, "failed"),
      ]);

      console.log(
        `Cleaned up interview analysis jobs older than ${maxAgeHours} hours`
      );
    } catch (error) {
      console.error("Error cleaning up old interview analysis jobs:", error);
    }
  }

  /**
   * Initialize the worker to process jobs
   */
  private initializeWorker(): void {
    this.worker = new Worker(
      "interview-analysis",
      async (job) => {
        console.log(`Interview Analysis Worker: Processing job ${job.id}`);

        try {
          const { request } = job.data;

          // Analyze interview using the service
          const result = await this.service.analyzeInterview(request);

          console.log(
            `Interview Analysis Worker: Job ${job.id} completed successfully`
          );
          return result;
        } catch (error) {
          console.error(
            `Interview Analysis Worker: Job ${job.id} failed:`,
            error
          );
          throw error; // Re-throw to trigger retry logic
        }
      },
      {
        connection: this.redis,
        concurrency: 1, // Process 1 interview analysis job at a time (OpenAI rate limits)
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );

    // Handle worker events
    this.worker.on("completed", (job) => {
      console.log(
        `Interview Analysis Worker: Job ${job.id} completed successfully`
      );
    });

    this.worker.on("failed", (job, err) => {
      console.error(`Interview Analysis Worker: Job ${job.id} failed:`, err);
    });

    this.worker.on("progress", (job, progress) => {
      console.log(
        `Interview Analysis Worker: Job ${job.id} progress: ${progress}%`
      );
    });
  }

  /**
   * Setup queue event listeners
   */
  private setupEventListeners(): void {
    this.queueEvents.on("completed", ({ jobId, returnvalue }) => {
      console.log(
        `Interview Analysis Queue: Job ${jobId} completed with result:`,
        returnvalue
      );
    });

    this.queueEvents.on("failed", ({ jobId, failedReason }) => {
      console.error(
        `Interview Analysis Queue: Job ${jobId} failed:`,
        failedReason
      );
    });

    this.queueEvents.on("stalled", ({ jobId }) => {
      console.warn(`Interview Analysis Queue: Job ${jobId} stalled`);
    });
  }

  /**
   * Map BullMQ job status to our status format
   */
  private mapBullMQStatus(
    bullMQStatus: string
  ): "pending" | "processing" | "completed" | "failed" {
    console.log(`Mapping BullMQ status: ${bullMQStatus}`);
    
    switch (bullMQStatus) {
      case "waiting":
      case "delayed":
        return "pending";
      case "active":
        return "processing";
      case "completed":
        return "completed";
      case "failed":
        return "failed";
      default:
        console.log(`Unknown BullMQ status: ${bullMQStatus}, defaulting to pending`);
        return "pending";
    }
  }

  /**
   * Get estimated processing time based on request complexity
   */
  getEstimatedProcessingTime(request: InterviewAnalysisRequest): number {
    return this.service.getEstimatedProcessingTime(request);
  }

  /**
   * Get job progress (for long-running jobs)
   */
  async getJobProgress(jobId: string): Promise<number> {
    try {
      const job = await this.interviewAnalysisQueue.getJob(jobId);

      if (!job) return 0;

      console.log(`Progress calculation for job ${jobId}:`, {
        status: job.status,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        returnvalue: !!job.returnvalue,
        failedReason: job.failedReason,
      });

      // For BullMQ, we'll estimate progress based on job status and timing
      if (job.status === "completed" || job.status === "failed") {
        console.log(`Job ${jobId} is ${job.status}, returning 100% progress`);
        return 100;
      }

      if (job.status === "active" && job.processedOn) {
        // Estimate progress based on time elapsed vs estimated time
        const elapsed = Date.now() - job.processedOn;
        const estimatedTime =
          this.getEstimatedProcessingTime(job.data.request) * 1000;
        const progress = Math.min(Math.round((elapsed / estimatedTime) * 100), 95);
        console.log(`Job ${jobId} is active, estimated progress: ${progress}%`);
        return progress;
      }

      // If job has a return value but status isn't completed, it's likely done
      if (job.returnvalue && !job.failedReason) {
        console.log(`Job ${jobId} has return value, treating as completed (100% progress)`);
        return 100;
      }

      // Default progress based on status
      let defaultProgress = 0;
      switch (job.status) {
        case "waiting":
          defaultProgress = 0;
          break;
        case "delayed":
          defaultProgress = 5;
          break;
        default:
          defaultProgress = 15; // Small progress for other states
      }

      console.log(`Job ${jobId} status: ${job.status}, default progress: ${defaultProgress}%`);
      return defaultProgress;
    } catch (error) {
      console.error("Error getting interview analysis job progress:", error);
      return 0;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.worker.close();
      await this.interviewAnalysisQueue.close();
      await this.queueEvents.close();
      await this.redis.quit();
      console.log("InterviewAnalysisQueueService: Gracefully shut down");
    } catch (error) {
      console.error(
        "Error shutting down InterviewAnalysisQueueService:",
        error
      );
    }
  }
}
