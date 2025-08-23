// CV Analysis Job Queue Service - BullMQ-based async processing

import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";
import type { CVAnalysisRequest, CVAnalysisResult } from "@/types/ai.types.js";
import { CVAnalysisService } from "./cv-analysis.service.js";

export interface CVAnalysisJob {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  request: CVAnalysisRequest;
  result?: CVAnalysisResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  processingTime?: number;
}

export interface CVAnalysisJobResponse {
  success: boolean;
  jobId: string;
  message: string;
  status: string;
  estimatedTime: number;
  pollUrl: string;
}

export interface CVAnalysisJobStatus {
  success: boolean;
  jobId: string;
  status: string;
  progress?: number;
  estimatedTimeRemaining?: number;
  result?: CVAnalysisResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export class CVAnalysisQueueService {
  private redis: Redis;
  private cvAnalysisQueue: Queue;
  private worker: Worker;
  private queueEvents: QueueEvents;
  private service: CVAnalysisService;

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
    this.cvAnalysisQueue = new Queue("cv-analysis", { connection: this.redis });

    // Initialize queue events for monitoring
    this.queueEvents = new QueueEvents("cv-analysis", {
      connection: this.redis,
    });

    // Initialize service
    this.service = new CVAnalysisService();

    // Initialize worker
    this.initializeWorker();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Create a new CV analysis job
   */
  async createCVAnalysisJob(request: CVAnalysisRequest): Promise<string> {
    const job = await this.cvAnalysisQueue.add(
      "analyze-cv",
      {
        request,
        timestamp: new Date().toISOString(),
        type: "cv_analysis",
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
        jobId: `cv_analysis_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      }
    );

    return job.id as string;
  }

  /**
   * Get job status and result
   */
  async getJobStatus(jobId: string): Promise<CVAnalysisJob | null> {
    try {
      const job = await this.cvAnalysisQueue.getJob(jobId);

      if (!job) {
        return null;
      }

      const jobData = job.data;

      const cvAnalysisJob: CVAnalysisJob = {
        jobId: job.id as string,
        status: this.mapBullMQStatus(job.status),
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

      return cvAnalysisJob;
    } catch (error) {
      console.error("Error getting CV analysis job status:", error);
      return null;
    }
  }

  /**
   * Get all jobs (for monitoring)
   */
  async getAllJobs(): Promise<CVAnalysisJob[]> {
    try {
      const jobs = await this.cvAnalysisQueue.getJobs([
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
      console.error("Error getting all CV analysis jobs:", error);
      return [];
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const stats = await this.cvAnalysisQueue.getJobCounts();
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
        this.cvAnalysisQueue.clean(cutoff, 100, "completed"),
        this.cvAnalysisQueue.clean(cutoff, 100, "failed"),
      ]);

      console.log(
        `Cleaned up CV analysis jobs older than ${maxAgeHours} hours`
      );
    } catch (error) {
      console.error("Error cleaning up old CV analysis jobs:", error);
    }
  }

  /**
   * Initialize the worker to process jobs
   */
  private initializeWorker(): void {
    this.worker = new Worker(
      "cv-analysis",
      async (job) => {
        console.log(`CV Analysis Worker: Processing job ${job.id}`);

        try {
          const { request } = job.data;

          // Analyze CV using the service
          const result = await this.service.analyzeCV(request);

          console.log(
            `CV Analysis Worker: Job ${job.id} completed successfully`
          );
          return result;
        } catch (error) {
          console.error(`CV Analysis Worker: Job ${job.id} failed:`, error);
          throw error; // Re-throw to trigger retry logic
        }
      },
      {
        connection: this.redis,
        concurrency: 1, // Process 1 CV analysis job at a time (OpenAI rate limits)
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );

    // Handle worker events
    this.worker.on("completed", (job) => {
      console.log(`CV Analysis Worker: Job ${job.id} completed successfully`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`CV Analysis Worker: Job ${job?.id} failed:`, err);
    });

    this.worker.on("progress", (job, progress) => {
      console.log(`CV Analysis Worker: Job ${job.id} progress: ${progress}%`);
    });
  }

  /**
   * Setup queue event listeners
   */
  private setupEventListeners(): void {
    this.queueEvents.on("completed", ({ jobId, returnvalue }) => {
      console.log(
        `CV Analysis Queue: Job ${jobId} completed with result:`,
        returnvalue
      );
    });

    this.queueEvents.on("failed", ({ jobId, failedReason }) => {
      console.error(`CV Analysis Queue: Job ${jobId} failed:`, failedReason);
    });

    this.queueEvents.on("stalled", ({ jobId }) => {
      console.warn(`CV Analysis Queue: Job ${jobId} stalled`);
    });
  }

  /**
   * Map BullMQ job status to our status format
   */
  private mapBullMQStatus(
    bullMQStatus: string
  ): "pending" | "processing" | "completed" | "failed" {
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
        return "pending";
    }
  }

  /**
   * Get estimated processing time based on request complexity
   */
  getEstimatedProcessingTime(request: CVAnalysisRequest): number {
    return this.service.getEstimatedProcessingTime(request);
  }

  /**
   * Get job progress (for long-running jobs)
   */
  async getJobProgress(jobId: string): Promise<number> {
    try {
      const job = await this.cvAnalysisQueue.getJob(jobId);

      if (!job) return 0;

      // For BullMQ, we'll estimate progress based on job status and timing
      if (job.status === "completed" || job.status === "failed") {
        return 100;
      }

      if (job.status === "active" && job.processedOn) {
        // Estimate progress based on time elapsed vs estimated time
        const elapsed = Date.now() - job.processedOn;
        const estimatedTime =
          this.getEstimatedProcessingTime(job.data.request) * 1000;
        return Math.min(Math.round((elapsed / estimatedTime) * 100), 95);
      }

      return job.status === "waiting" ? 0 : 10;
    } catch (error) {
      console.error("Error getting CV analysis job progress:", error);
      return 0;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.worker.close();
      await this.cvAnalysisQueue.close();
      await this.queueEvents.close();
      await this.redis.quit();
      console.log("CVAnalysisQueueService: Gracefully shut down");
    } catch (error) {
      console.error("Error shutting down CVAnalysisQueueService:", error);
    }
  }
}
