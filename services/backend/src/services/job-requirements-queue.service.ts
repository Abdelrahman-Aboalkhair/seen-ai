// Job Requirements Generation Job Queue Service - BullMQ-based async processing

import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";
import type { JobRequirementsRequest, JobRequirementsResult } from "@/types/ai.types.js";
import { JobRequirementsService } from "./job-requirements.service.js";

export interface JobRequirementsJob {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  request: JobRequirementsRequest;
  result?: JobRequirementsResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  processingTime?: number;
}

export interface JobRequirementsJobResponse {
  success: boolean;
  jobId: string;
  message: string;
  status: string;
  estimatedTime: number;
  pollUrl: string;
}

export interface JobRequirementsJobStatus {
  success: boolean;
  jobId: string;
  status: string;
  progress?: number;
  estimatedTimeRemaining?: number;
  result?: JobRequirementsResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export class JobRequirementsQueueService {
  private redis: Redis;
  private jobRequirementsQueue: Queue;
  private worker: Worker;
  private queueEvents: QueueEvents;
  private service: JobRequirementsService;

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
    this.jobRequirementsQueue = new Queue("job-requirements", { connection: this.redis });
    
    // Initialize queue events for monitoring
    this.queueEvents = new QueueEvents("job-requirements", { connection: this.redis });
    
    // Initialize service
    this.service = new JobRequirementsService();
    
    // Initialize worker
    this.initializeWorker();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Create a new job requirements generation job
   */
  async createJobRequirementsJob(request: JobRequirementsRequest): Promise<string> {
    const job = await this.jobRequirementsQueue.add(
      "generate-job-requirements",
      {
        request,
        timestamp: new Date().toISOString(),
        type: "job_requirements",
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
        jobId: `job_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }
    );

    return job.id as string;
  }

  /**
   * Get job status and result
   */
  async getJobStatus(jobId: string): Promise<JobRequirementsJob | null> {
    try {
      const job = await this.jobRequirementsQueue.getJob(jobId);
      
      if (!job) {
        return null;
      }

      const jobData = job.data;
      
      const jobRequirementsJob: JobRequirementsJob = {
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

      return jobRequirementsJob;
    } catch (error) {
      console.error("Error getting job requirements job status:", error);
      return null;
    }
  }

  /**
   * Get all jobs (for monitoring)
   */
  async getAllJobs(): Promise<JobRequirementsJob[]> {
    try {
      const jobs = await this.jobRequirementsQueue.getJobs([
        "completed", "failed", "active", "waiting", "delayed"
      ]);
      
      return jobs.map(job => ({
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
      console.error("Error getting all job requirements jobs:", error);
      return [];
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const stats = await this.jobRequirementsQueue.getJobCounts();
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
        this.jobRequirementsQueue.clean(cutoff, 100, "completed"),
        this.jobRequirementsQueue.clean(cutoff, 100, "failed")
      ]);
      
      console.log(`Cleaned up job requirements jobs older than ${maxAgeHours} hours`);
    } catch (error) {
      console.error("Error cleaning up old job requirements jobs:", error);
    }
  }

  /**
   * Initialize the worker to process jobs
   */
  private initializeWorker(): void {
    this.worker = new Worker(
      "job-requirements",
      async (job) => {
        console.log(`Job Requirements Worker: Processing job ${job.id}`);
        
        try {
          const { request } = job.data;
          
          // Generate job requirements using the service
          const result = await this.service.generateJobRequirements(request);
          
          console.log(`Job Requirements Worker: Job ${job.id} completed successfully`);
          return result;
        } catch (error) {
          console.error(`Job Requirements Worker: Job ${job.id} failed:`, error);
          throw error; // Re-throw to trigger retry logic
        }
      },
      {
        connection: this.redis,
        concurrency: 1, // Process 1 job requirements job at a time (OpenAI rate limits)
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );

    // Handle worker events
    this.worker.on("completed", (job) => {
      console.log(`Job Requirements Worker: Job ${job.id} completed successfully`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`Job Requirements Worker: Job ${job?.id} failed:`, err);
    });

    this.worker.on("progress", (job, progress) => {
      console.log(`Job Requirements Worker: Job ${job.id} progress: ${progress}%`);
    });
  }

  /**
   * Setup queue event listeners
   */
  private setupEventListeners(): void {
    this.queueEvents.on("completed", ({ jobId, returnvalue }) => {
      console.log(
        `Job Requirements Queue: Job ${jobId} completed with result:`,
        returnvalue
      );
    });

    this.queueEvents.on("failed", ({ jobId, failedReason }) => {
      console.error(`Job Requirements Queue: Job ${jobId} failed:`, failedReason);
    });

    this.queueEvents.on("stalled", ({ jobId }) => {
      console.warn(`Job Requirements Queue: Job ${jobId} stalled`);
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
  getEstimatedProcessingTime(request: JobRequirementsRequest): number {
    return this.service.getEstimatedProcessingTime(request);
  }

  /**
   * Get job progress (for long-running jobs)
   */
  async getJobProgress(jobId: string): Promise<number> {
    try {
      const job = await this.jobRequirementsQueue.getJob(jobId);
      
      if (!job) return 0;
      
      // For BullMQ, we'll estimate progress based on job status and timing
      if (job.status === "completed" || job.status === "failed") {
        return 100;
      }
      
      if (job.status === "active" && job.processedOn) {
        // Estimate progress based on time elapsed vs estimated time
        const elapsed = Date.now() - job.processedOn;
        const estimatedTime = this.getEstimatedProcessingTime(job.data.request) * 1000;
        return Math.min(Math.round((elapsed / estimatedTime) * 100), 95);
      }
      
      return job.status === "waiting" ? 0 : 10;
    } catch (error) {
      console.error("Error getting job requirements job progress:", error);
      return 0;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.worker.close();
      await this.jobRequirementsQueue.close();
      await this.queueEvents.close();
      await this.redis.quit();
      console.log("JobRequirementsQueueService: Gracefully shut down");
    } catch (error) {
      console.error("Error shutting down JobRequirementsQueueService:", error);
    }
  }
}
