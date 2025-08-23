// Job Queue Service - BullMQ-based async talent search processing

import { Queue, Worker, Job, QueueEvents } from "bullmq";
import Redis from "ioredis";
import type {
  TalentSearchJob,
  TalentSearchCriteria,
  TalentSearchResult,
  AdvancedSearchFilters,
} from "@/types/talent-search.types.js";
import { TalentSearchRepository } from "@/repositories/talent-search.repository.js";

export class JobQueueService {
  private redis: Redis;
  private talentSearchQueue: Queue;
  private advancedSearchQueue: Queue;
  private worker!: Worker;
  private queueEvents: QueueEvents;
  private repository: TalentSearchRepository;

  constructor() {
    // Initialize Redis connection with BullMQ-compatible options
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
      maxRetriesPerRequest: null, // Required by BullMQ
    });

    // Initialize queues
    this.talentSearchQueue = new Queue("talent-search", {
      connection: this.redis,
    });
    this.advancedSearchQueue = new Queue("advanced-search", {
      connection: this.redis,
    });

    // Initialize queue events for monitoring
    this.queueEvents = new QueueEvents("talent-search", {
      connection: this.redis,
    });

    // Initialize repository
    this.repository = new TalentSearchRepository();

    // Initialize worker
    this.initializeWorker();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Create a new talent search job
   */
  async createTalentSearchJob(criteria: TalentSearchCriteria): Promise<string> {
    const job = await this.talentSearchQueue.add(
      "search",
      {
        criteria,
        timestamp: new Date().toISOString(),
        type: "talent_search",
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: { count: 100 }, // Keep last 100 completed jobs
        removeOnFail: { count: 50 }, // Keep last 50 failed jobs
        jobId: `talent_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      }
    );

    return job.id as string;
  }

  /**
   * Create a new advanced search job
   */
  async createAdvancedSearchJob(
    criteria: TalentSearchCriteria,
    filters: AdvancedSearchFilters
  ): Promise<string> {
    const job = await this.advancedSearchQueue.add(
      "advanced-search",
      {
        criteria,
        filters,
        timestamp: new Date().toISOString(),
        type: "advanced_search",
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
        jobId: `advanced_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      }
    );

    return job.id as string;
  }

  /**
   * Get job status and result
   */
  async getJobStatus(jobId: string): Promise<TalentSearchJob | null> {
    try {
      // Try to find job in both queues
      let job = await this.talentSearchQueue.getJob(jobId);
      let queueType = "talent-search";

      if (!job) {
        job = await this.advancedSearchQueue.getJob(jobId);
        queueType = "advanced-search";
      }

      if (!job) {
        return null;
      }

      const jobData = job.data;

      const talentSearchJob: TalentSearchJob = {
        jobId: job.id as string,
        status: this.mapBullMQStatus(job.status),
        criteria: jobData.criteria,
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

      return talentSearchJob;
    } catch (error) {
      console.error("Error getting job status:", error);
      return null;
    }
  }

  /**
   * Get all jobs (for monitoring)
   */
  async getAllJobs(): Promise<TalentSearchJob[]> {
    try {
      const [talentJobs, advancedJobs] = await Promise.all([
        this.talentSearchQueue.getJobs([
          "completed",
          "failed",
          "active",
          "waiting",
          "delayed",
        ]),
        this.advancedSearchQueue.getJobs([
          "completed",
          "failed",
          "active",
          "waiting",
          "delayed",
        ]),
      ]);

      const allJobs = [...talentJobs, ...advancedJobs];

      return allJobs.map((job) => ({
        jobId: job.id as string,
        status: this.mapBullMQStatus(job.status),
        criteria: job.data.criteria,
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
      console.error("Error getting all jobs:", error);
      return [];
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const [talentStats, advancedStats] = await Promise.all([
        this.talentSearchQueue.getJobCounts(),
        this.advancedSearchQueue.getJobCounts(),
      ]);

      return {
        talentSearch: talentStats,
        advancedSearch: advancedStats,
        total: {
          waiting: (talentStats.waiting || 0) + (advancedStats.waiting || 0),
          active: (talentStats.active || 0) + (advancedStats.active || 0),
          completed:
            (talentStats.completed || 0) + (advancedStats.completed || 0),
          failed: (talentStats.failed || 0) + (advancedStats.failed || 0),
          delayed: (talentStats.delayed || 0) + (advancedStats.delayed || 0),
        },
      };
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

      // Clean up old completed jobs from both queues
      await Promise.all([
        this.talentSearchQueue.clean(cutoff, 100, "completed"),
        this.advancedSearchQueue.clean(cutoff, 100, "completed"),
        this.talentSearchQueue.clean(cutoff, 100, "failed"),
        this.advancedSearchQueue.clean(cutoff, 100, "failed"),
      ]);

      console.log(`Cleaned up jobs older than ${maxAgeHours} hours`);
    } catch (error) {
      console.error("Error cleaning up old jobs:", error);
    }
  }

  /**
   * Initialize the worker to process jobs
   */
  private initializeWorker(): void {
    this.worker = new Worker(
      "talent-search",
      async (job) => {
        console.log(
          `Worker: Processing job ${job.id} of type ${job.data.type}`
        );

        try {
          if (job.data.type === "talent_search") {
            return await this.repository.searchTalent(job.data.criteria);
          } else if (job.data.type === "advanced_search") {
            return await this.repository.advancedSearch(
              job.data.criteria,
              job.data.filters
            );
          } else {
            throw new Error(`Unknown job type: ${job.data.type}`);
          }
        } catch (error) {
          console.error(`Worker: Job ${job.id} failed:`, error);
          throw error; // Re-throw to trigger retry logic
        }
      },
      {
        connection: this.redis,
        concurrency: 2, // Process 2 jobs simultaneously
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );

    // Handle worker events
    this.worker.on("completed", (job) => {
      console.log(`Worker: Job ${job.id} completed successfully`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`Worker: Job ${job?.id} failed:`, err);
    });

    this.worker.on("progress", (job, progress) => {
      console.log(`Worker: Job ${job.id} progress: ${progress}%`);
    });
  }

  /**
   * Setup queue event listeners
   */
  private setupEventListeners(): void {
    this.queueEvents.on("completed", ({ jobId, returnvalue }) => {
      console.log(`Queue: Job ${jobId} completed with result:`, returnvalue);
    });

    this.queueEvents.on("failed", ({ jobId, failedReason }) => {
      console.error(`Queue: Job ${jobId} failed:`, failedReason);
    });

    this.queueEvents.on("stalled", ({ jobId }) => {
      console.warn(`Queue: Job ${jobId} stalled`);
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
   * Get estimated processing time based on criteria complexity
   */
  getEstimatedProcessingTime(criteria: TalentSearchCriteria): number {
    // Base time: 30 seconds
    let estimatedTime = 30;

    // Add time for complex searches
    if (criteria.skills && criteria.skills.length > 3) estimatedTime += 15;
    if (criteria.numberOfCandidates && criteria.numberOfCandidates > 5)
      estimatedTime += 10;
    if (criteria.location) estimatedTime += 5;

    return estimatedTime;
  }

  /**
   * Get job progress (for long-running jobs)
   */
  async getJobProgress(jobId: string): Promise<number> {
    try {
      let job = await this.talentSearchQueue.getJob(jobId);
      if (!job) {
        job = await this.advancedSearchQueue.getJob(jobId);
      }

      if (!job) return 0;

      // For BullMQ, we'll estimate progress based on job status and timing
      if (job.status === "completed" || job.status === "failed") {
        return 100;
      }

      if (job.status === "active" && job.processedOn) {
        // Estimate progress based on time elapsed vs estimated time
        const elapsed = Date.now() - job.processedOn;
        const estimatedTime =
          this.getEstimatedProcessingTime(job.data.criteria) * 1000;
        return Math.min(Math.round((elapsed / estimatedTime) * 100), 95);
      }

      return job.status === "waiting" ? 0 : 10;
    } catch (error) {
      console.error("Error getting job progress:", error);
      return 0;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.worker.close();
      await this.talentSearchQueue.close();
      await this.advancedSearchQueue.close();
      await this.queueEvents.close();
      await this.redis.quit();
      console.log("JobQueueService: Gracefully shut down");
    } catch (error) {
      console.error("Error shutting down JobQueueService:", error);
    }
  }
}
