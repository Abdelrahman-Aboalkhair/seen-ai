// Base Queue Service - Abstract class with common BullMQ functionality

import { Queue, Worker, QueueEvents, Job } from "bullmq";
import Redis from "ioredis";

export interface BaseJobData {
  timestamp: string;
  type: string;
  [key: string]: any;
}

export interface BaseJobResponse {
  success: boolean;
  jobId: string;
  message: string;
  status: string;
  estimatedTime: number;
  pollUrl: string;
}

export interface BaseJobStatus {
  success: boolean;
  jobId: string;
  status: string;
  progress?: number;
  estimatedTimeRemaining?: number;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobProcessor<T = any, R = any> {
  process(job: Job<T>): Promise<R>;
  getEstimatedProcessingTime(data: T): number;
}

export abstract class BaseQueueService<T extends BaseJobData, R = any> {
  protected redis: Redis;
  protected queue: Queue;
  protected worker!: Worker;
  protected queueEvents: QueueEvents;
  protected queueName: string;
  protected jobProcessor: JobProcessor<T, R>;

  constructor(
    queueName: string,
    jobProcessor: JobProcessor<T, R>,
    redisConfig?: {
      host?: string;
      port?: number;
      password?: string;
      url?: string;
    }
  ) {
    this.queueName = queueName;
    this.jobProcessor = jobProcessor;

    if (redisConfig?.url || process.env.REDIS_URL) {
      this.redis = new Redis(redisConfig?.url || process.env.REDIS_URL!, {
        lazyConnect: true,
        maxRetriesPerRequest: null,
      });
    } else {
      // Fallback to individual connection parameters
      this.redis = new Redis({
        host: redisConfig?.host || process.env.REDIS_HOST || "localhost",
        port: redisConfig?.port || parseInt(process.env.REDIS_PORT || "6379"),
        password: redisConfig?.password || process.env.REDIS_PASSWORD,
        lazyConnect: true,
        maxRetriesPerRequest: null,
      });
    }

    // Initialize queue
    this.queue = new Queue(queueName, { connection: this.redis });

    // Initialize queue events for monitoring
    this.queueEvents = new QueueEvents(queueName, { connection: this.redis });

    // Initialize worker
    this.initializeWorker();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Create a new job
   */
  async createJob(data: T, jobType: string = "default"): Promise<string> {
    const job = await this.queue.add(
      jobType,
      {
        ...data,
        timestamp: new Date().toISOString(),
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );

    console.log(`✅ [${this.queueName}] Job created:`, {
      jobId: job.id,
      type: data.type,
      timestamp: data.timestamp,
    });

    return job.id as string;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<BaseJobStatus> {
    try {
      const job = await this.queue.getJob(jobId);

      if (!job) {
        return {
          success: false,
          jobId,
          status: "not_found",
          error: "Job not found",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      const state = await job.getState();
      const progress = job.progress;
      const result = job.returnvalue;
      const error = job.failedReason;

      // Calculate estimated time remaining
      const estimatedTimeRemaining = this.calculateEstimatedTimeRemaining(job);

      const jobResult = {
        success: state === "completed",
        jobId,
        status: state,
        progress: progress || 0,
        estimatedTimeRemaining,
        result: state === "completed" ? result : undefined,
        error: state === "failed" ? error : undefined,
        createdAt: job.timestamp
          ? new Date(job.timestamp).toISOString()
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log(`🔍 [${this.queueName}] Job status result:`, {
        jobId,
        status: state,
        hasResult: !!result,
        resultType: result ? typeof result : 'undefined',
        resultKeys: result && typeof result === 'object' ? Object.keys(result) : [],
        resultPreview: result ? JSON.stringify(result).substring(0, 200) : 'undefined',
      });

      return jobResult;
    } catch (error) {
      console.error(`❌ [${this.queueName}] Error getting job status:`, error);
      return {
        success: false,
        jobId,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.queue.getWaiting(),
        this.queue.getActive(),
        this.queue.getCompleted(),
        this.queue.getFailed(),
        this.queue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      };
    } catch (error) {
      console.error(`❌ [${this.queueName}] Error getting queue stats:`, error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      };
    }
  }

  /**
   * Clean up old jobs
   */
  async cleanupOldJobs(maxAgeHours: number = 24): Promise<void> {
    try {
      const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;

      // Clean up completed jobs
      const completedJobs = await this.queue.getCompleted();
      for (const job of completedJobs) {
        if (job.timestamp && job.timestamp < cutoffTime) {
          await job.remove();
        }
      }

      // Clean up failed jobs
      const failedJobs = await this.queue.getFailed();
      for (const job of failedJobs) {
        if (job.timestamp && job.timestamp < cutoffTime) {
          await job.remove();
        }
      }

      console.log(
        `🧹 [${this.queueName}] Cleaned up old jobs (older than ${maxAgeHours}h)`
      );
    } catch (error) {
      console.error(
        `❌ [${this.queueName}] Error cleaning up old jobs:`,
        error
      );
    }
  }

  /**
   * Get estimated processing time
   */
  getEstimatedProcessingTime(data: T): number {
    return this.jobProcessor.getEstimatedProcessingTime(data);
  }

  /**
   * Get job progress (for long-running jobs)
   */
  async getJobProgress(jobId: string): Promise<number> {
    try {
      const job = await this.queue.getJob(jobId);

      if (!job) return 0;

      // For BullMQ, we'll estimate progress based on job status and timing
      if (job.status === "completed" || job.status === "failed") {
        return 100;
      }

      if (job.status === "active" && job.processedOn) {
        // Estimate progress based on time elapsed vs estimated time
        const elapsed = Date.now() - job.processedOn;
        const estimatedTime = this.getEstimatedProcessingTime(job.data) * 1000;
        return Math.min(Math.round((elapsed / estimatedTime) * 100), 95);
      }

      return job.status === "waiting" ? 0 : 10;
    } catch (error) {
      console.error(
        `❌ [${this.queueName}] Error getting job progress:`,
        error
      );
      return 0;
    }
  }

  /**
   * Get all jobs (for monitoring)
   */
  async getAllJobs(): Promise<any[]> {
    try {
      const jobs = await this.queue.getJobs([
        "completed",
        "failed",
        "active",
        "waiting",
        "delayed",
      ]);

      return jobs.map((job) => ({
        jobId: job.id as string,
        status: job.status,
        request: job.data,
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
      console.error(`❌ [${this.queueName}] Error getting all jobs:`, error);
      return [];
    }
  }

  /**
   * Initialize the worker to process jobs
   */
  private initializeWorker(): void {
    console.log(`🔧 [${this.queueName}] Initializing worker...`);

    this.worker = new Worker(
      this.queueName,
      async (job) => {
        console.log(`🚀 [${this.queueName} Worker] Starting job ${job.id}`);
        console.log(`📝 [${this.queueName} Worker] Job data:`, {
          type: job.data.type,
          timestamp: job.data.timestamp,
        });

        try {
          const result = await this.jobProcessor.process(job);
          console.log(
            `✅ [${this.queueName} Worker] Job ${job.id} completed successfully`
          );
          return result;
        } catch (error) {
          console.error(
            `❌ [${this.queueName} Worker] Job ${job.id} failed:`,
            error
          );
          throw error; // Re-throw to trigger retry logic
        }
      },
      {
        connection: this.redis,
        concurrency: 1, // Process 1 job at a time (OpenAI rate limits)
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );

    // Handle worker events
    this.worker.on("completed", (job) => {
      console.log(
        `${this.queueName} Worker: Job ${job.id} completed successfully`
      );
    });

    this.worker.on("failed", (job, err) => {
      console.error(`${this.queueName} Worker: Job ${job?.id} failed:`, err);
    });

    this.worker.on("progress", (job, progress) => {
      console.log(
        `${this.queueName} Worker: Job ${job.id} progress: ${progress}%`
      );
    });
  }

  /**
   * Setup queue event listeners
   */
  private setupEventListeners(): void {
    this.queueEvents.on("completed", ({ jobId, returnvalue }) => {
      console.log(
        `✅ [${this.queueName}] Job ${jobId} completed with result:`,
        returnvalue
      );
    });

    this.queueEvents.on("failed", ({ jobId, failedReason }) => {
      console.error(
        `❌ [${this.queueName}] Job ${jobId} failed:`,
        failedReason
      );
    });

    this.queueEvents.on("stalled", ({ jobId }) => {
      console.warn(`⚠️ [${this.queueName}] Job ${jobId} stalled`);
    });

    this.queueEvents.on("waiting", ({ jobId }) => {
      console.log(
        `⏳ [${this.queueName}] Job ${jobId} waiting to be processed`
      );
    });

    this.queueEvents.on("active", ({ jobId }) => {
      console.log(`🔄 [${this.queueName}] Job ${jobId} started processing`);
    });
  }

  /**
   * Calculate estimated time remaining for a job
   */
  private calculateEstimatedTimeRemaining(job: Job): number | undefined {
    if (job.progress === 0 || !job.processedOn) {
      return undefined;
    }

    const elapsed = Date.now() - job.processedOn;
    const progress = Number(job.progress) || 0;

    if (progress === 0) {
      return undefined;
    }

    const estimatedTotal = (elapsed / progress) * 100;
    return Math.max(0, estimatedTotal - elapsed);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.worker.close();
      await this.queue.close();
      await this.queueEvents.close();
      await this.redis.quit();
      console.log(`🔄 [${this.queueName}] Service shutdown completed`);
    } catch (error) {
      console.error(`❌ [${this.queueName}] Error during shutdown:`, error);
    }
  }
}
