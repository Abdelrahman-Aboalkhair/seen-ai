// Question Generation Controller - HTTP Request/Response Layer

import { Request, Response } from "express";
import type { QuestionGenerationRequest } from "@/types/ai.types.js";
import {
  QuestionGenerationQueueService,
  type QuestionGenerationJobResponse,
  type QuestionGenerationJobStatus,
} from "@/services/question-generation-queue.service.js";

export class QuestionGenerationController {
  private jobQueue: QuestionGenerationQueueService;

  constructor() {
    this.jobQueue = new QuestionGenerationQueueService();
  }

  /**
   * Async Question Generation - Returns job ID immediately
   * POST /api/ai/generate-questions/async
   */
  async generateQuestionsAsync(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      console.log("Controller: Async question generation request received:", {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        userId: req.user?.id || "anonymous",
      });

      const request: QuestionGenerationRequest = req.body;
      const userId = req.user?.id || "test-user";

      // Validate request body
      if (!request || Object.keys(request).length === 0) {
        res.status(400).json({
          success: false,
          error: "Missing question generation request",
          code: "MISSING_REQUEST",
          message: "Question generation request is required",
        });
        return;
      }

      // Create async question generation job
      const jobId = await this.jobQueue.createQuestionGenerationJob(request);
      const estimatedTime = this.jobQueue.getEstimatedProcessingTime(request);

      const response: QuestionGenerationJobResponse = {
        success: true,
        jobId,
        message: "Question generation job created successfully",
        status: "pending",
        estimatedTime,
        pollUrl: `/api/ai/generate-questions/jobs/${jobId}/status`,
      };

      console.log("Controller: Async question generation job created:", {
        jobId,
        userId,
        estimatedTime,
        processingTime: Date.now() - startTime,
      });

      res.status(202).json(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Controller: Async question generation failed:", {
        error: errorMessage,
        userId: req.user?.id || "anonymous",
        duration,
      });

      res.status(500).json({
        success: false,
        error: "Failed to create question generation job",
        code: "JOB_CREATION_ERROR",
        message: errorMessage,
        processingTime: duration,
      });
    }
  }

  /**
   * Get Job Status
   * GET /api/ai/generate-questions/jobs/:jobId/status
   */
  async getJobStatus(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      if (!jobId) {
        res.status(400).json({
          success: false,
          error: "Missing job ID",
          code: "MISSING_JOB_ID",
          message: "Job ID is required",
        });
        return;
      }
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Question generation job status request:", {
        jobId,
        userId,
      });

      const job = await this.jobQueue.getJobStatus(jobId);

      if (!job) {
        res.status(404).json({
          success: false,
          error: "Job not found",
          code: "JOB_NOT_FOUND",
          message: `Job with ID ${jobId} does not exist`,
        });
        return;
      }

      const progress = await this.jobQueue.getJobProgress(jobId);
      const estimatedTimeRemaining =
        job.status === "processing"
          ? this.jobQueue.getEstimatedProcessingTime(job.request)
          : undefined;

      const response: QuestionGenerationJobStatus = {
        success: true,
        jobId: job.jobId,
        status: job.status,
        progress,
        estimatedTimeRemaining,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      };

      console.log("Controller: Question generation job status retrieved:", {
        jobId,
        status: job.status,
        progress,
        userId,
      });

      res.status(200).json(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error(
        "Controller: Failed to get question generation job status:",
        {
          error: errorMessage,
          jobId: req.params.jobId,
          userId: req.user?.id || "anonymous",
        }
      );

      res.status(500).json({
        success: false,
        error: "Failed to get job status",
        code: "JOB_STATUS_ERROR",
        message: errorMessage,
      });
    }
  }

  /**
   * Get All Jobs
   * GET /api/ai/generate-questions/jobs
   */
  async getAllJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Get all question generation jobs request:", {
        userId,
      });

      const jobs = await this.jobQueue.getAllJobs();

      res.status(200).json({
        success: true,
        data: {
          jobs,
          totalJobs: jobs.length,
          pendingJobs: jobs.filter((j) => j.status === "pending").length,
          processingJobs: jobs.filter((j) => j.status === "processing").length,
          completedJobs: jobs.filter((j) => j.status === "completed").length,
          failedJobs: jobs.filter((j) => j.status === "failed").length,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Controller: Failed to get all question generation jobs:", {
        error: errorMessage,
        userId: req.user?.id || "anonymous",
      });

      res.status(500).json({
        success: false,
        error: "Failed to get jobs",
        code: "JOBS_RETRIEVAL_ERROR",
        message: errorMessage,
      });
    }
  }

  /**
   * Legacy Synchronous Question Generation
   * POST /api/ai/generate-questions/sync
   */
  async generateQuestionsSync(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(
        "Controller: Legacy sync question generation request received:",
        {
          method: req.method,
          url: req.originalUrl,
          body: req.body,
          userId: req.user?.id || "anonymous",
        }
      );

      const request: QuestionGenerationRequest = req.body;
      const userId = req.user?.id || "test-user";

      // Validate request body
      if (!request || Object.keys(request).length === 0) {
        res.status(400).json({
          success: false,
          error: "Missing question generation request",
          code: "MISSING_REQUEST",
          message: "Question generation request is required",
        });
        return;
      }

      // Perform synchronous question generation (legacy behavior)
      const questions = await this.jobQueue.generateQuestionsSync(request);

      const duration = Date.now() - startTime;

      const response = {
        success: true,
        data: questions,
        creditsRemaining: 100, // Mock for testing
        processingTime: duration,
      };

      console.log(
        "Controller: Legacy sync question generation completed successfully:",
        {
          userId,
          questionCount: questions.length,
          processingTime: duration,
        }
      );

      res.status(200).json(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Controller: Legacy sync question generation failed:", {
        error: errorMessage,
        userId: req.user?.id || "anonymous",
        duration,
      });

      res.status(500).json({
        success: false,
        error: "Question generation failed",
        code: "QUESTION_GENERATION_ERROR",
        message: errorMessage,
        processingTime: duration,
      });
    }
  }

  /**
   * Get Queue Statistics
   * GET /api/ai/generate-questions/stats
   */
  async getQueueStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Get question generation queue stats request:", {
        userId,
      });

      const stats = await this.jobQueue.getQueueStats();

      if (!stats) {
        res.status(500).json({
          success: false,
          error: "Failed to get queue statistics",
          code: "STATS_RETRIEVAL_ERROR",
          message: "Unable to retrieve queue statistics",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error(
        "Controller: Failed to get question generation queue stats:",
        {
          error: errorMessage,
          userId: req.user?.id || "anonymous",
        }
      );

      res.status(500).json({
        success: false,
        error: "Failed to get queue statistics",
        code: "STATS_RETRIEVAL_ERROR",
        message: errorMessage,
      });
    }
  }
}
