// Question Generation Job Queue Service - BullMQ-based async processing

import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import type { QuestionGenerationRequest, Question } from '@/types/ai.types.js';
import { QuestionGenerationService } from './ai/question-generation.service.js';

export interface QuestionGenerationJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  request: QuestionGenerationRequest;
  result?: Question[];
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  processingTime?: number;
}

export interface QuestionGenerationJobResponse {
  success: boolean;
  jobId: string;
  message: string;
  status: string;
  estimatedTime: number;
  pollUrl: string;
}

export interface QuestionGenerationJobStatus {
  success: boolean;
  jobId: string;
  status: string;
  progress?: number;
  estimatedTimeRemaining?: number;
  result?: Question[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export class QuestionGenerationQueueService {
  private redis: Redis;
  private questionQueue: Queue;
  private worker!: Worker;
  private queueEvents: QueueEvents;
  private service: QuestionGenerationService;

  constructor() {
    // Initialize Redis connection with BullMQ-compatible options
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
      maxRetriesPerRequest: null, // Required by BullMQ
    });

    // Initialize queue
    this.questionQueue = new Queue('question-generation', { connection: this.redis });
    
    // Initialize queue events for monitoring
    this.queueEvents = new QueueEvents('question-generation', { connection: this.redis });
    
    // Initialize service
    this.service = new QuestionGenerationService();
    
    // Initialize worker
    this.initializeWorker();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Create a new question generation job
   */
  async createQuestionGenerationJob(request: QuestionGenerationRequest): Promise<string> {
    const job = await this.questionQueue.add(
      'generate-questions',
      {
        request,
        timestamp: new Date().toISOString(),
        type: 'question_generation'
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
        jobId: `questions_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    );

    return job.id as string;
  }

  /**
   * Get job status and result
   */
  async getJobStatus(jobId: string): Promise<QuestionGenerationJob | null> {
    try {
      const job = await this.questionQueue.getJob(jobId);
      
      if (!job) {
        return null;
      }

      const jobData = job.data;
      
      const questionGenerationJob: QuestionGenerationJob = {
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

      return questionGenerationJob;
    } catch (error) {
      console.error('Error getting question generation job status:', error);
      return null;
    }
  }

  /**
   * Get all jobs (for monitoring)
   */
  async getAllJobs(): Promise<QuestionGenerationJob[]> {
    try {
      const jobs = await this.questionQueue.getJobs([
        'completed', 'failed', 'active', 'waiting', 'delayed'
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
      console.error('Error getting all question generation jobs:', error);
      return [];
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const stats = await this.questionQueue.getJobCounts();
      return stats;
    } catch (error) {
      console.error('Error getting queue stats:', error);
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
        this.questionQueue.clean(cutoff, 100, 'completed'),
        this.questionQueue.clean(cutoff, 100, 'failed')
      ]);
      
      console.log(`Cleaned up question generation jobs older than ${maxAgeHours} hours`);
    } catch (error) {
      console.error('Error cleaning up old question generation jobs:', error);
    }
  }

  /**
   * Initialize the worker to process jobs
   */
  private initializeWorker(): void {
    this.worker = new Worker(
      'question-generation',
      async (job) => {
        console.log(`Question Generation Worker: Processing job ${job.id}`);
        
        try {
          const { request } = job.data;
          
          // Generate questions using the service
          const questions = await this.service.generateQuestions(request);
          
          console.log(`Question Generation Worker: Job ${job.id} completed successfully`);
          return questions;
        } catch (error) {
          console.error(`Question Generation Worker: Job ${job.id} failed:`, error);
          throw error; // Re-throw to trigger retry logic
        }
      },
      {
        connection: this.redis,
        concurrency: 1, // Process 1 question generation job at a time (OpenAI rate limits)
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );

    // Handle worker events
    this.worker.on('completed', (job) => {
      console.log(`Question Generation Worker: Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Question Generation Worker: Job ${job?.id} failed:`, err);
    });

    this.worker.on('progress', (job, progress) => {
      console.log(`Question Generation Worker: Job ${job.id} progress: ${progress}%`);
    });
  }

  /**
   * Setup queue event listeners
   */
  private setupEventListeners(): void {
    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(`Question Generation Queue: Job ${jobId} completed with result:`, returnvalue);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`Question Generation Queue: Job ${jobId} failed:`, failedReason);
    });

    this.queueEvents.on('stalled', ({ jobId }) => {
      console.warn(`Question Generation Queue: Job ${jobId} stalled`);
    });
  }

  /**
   * Map BullMQ job status to our status format
   */
  private mapBullMQStatus(bullMQStatus: string): 'pending' | 'processing' | 'completed' | 'failed' {
    switch (bullMQStatus) {
      case 'waiting':
      case 'delayed':
        return 'pending';
      case 'active':
        return 'processing';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  }

  /**
   * Get estimated processing time based on request complexity
   */
  getEstimatedProcessingTime(request: QuestionGenerationRequest): number {
    // Base time: 15 seconds
    let estimatedTime = 15;
    
    // Add time for complex requests
    if (request.count > 10) estimatedTime += 10;
    if (request.count > 20) estimatedTime += 15;
    if (request.skills.length > 5) estimatedTime += 5;
    if (request.difficulty === 'hard') estimatedTime += 5;
    
    return estimatedTime;
  }

  /**
   * Get job progress (for long-running jobs)
   */
  async getJobProgress(jobId: string): Promise<number> {
    try {
      const job = await this.questionQueue.getJob(jobId);
      
      if (!job) return 0;
      
      // For BullMQ, we'll estimate progress based on job status and timing
      if (job.status === 'completed' || job.status === 'failed') {
        return 100;
      }
      
      if (job.status === 'active' && job.processedOn) {
        // Estimate progress based on time elapsed vs estimated time
        const elapsed = Date.now() - job.processedOn;
        const estimatedTime = this.getEstimatedProcessingTime(job.data.request) * 1000;
        return Math.min(Math.round((elapsed / estimatedTime) * 100), 95);
      }
      
      return job.status === 'waiting' ? 0 : 10;
    } catch (error) {
      console.error('Error getting question generation job progress:', error);
      return 0;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.worker.close();
      await this.questionQueue.close();
      await this.queueEvents.close();
      await this.redis.quit();
      console.log('QuestionGenerationQueueService: Gracefully shut down');
    } catch (error) {
      console.error('Error shutting down QuestionGenerationQueueService:', error);
    }
  }
}
