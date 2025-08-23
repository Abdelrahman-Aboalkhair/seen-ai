// Job Requirements Generation Controller - HTTP Layer

import { Request, Response } from "express";
import type { JobRequirementsRequest } from "@/types/ai.types.js";
import { JobRequirementsService } from "@/services/job-requirements.service.js";
import { JobRequirementsQueueService } from "@/services/job-requirements-queue.service.js";
import type {
  JobRequirementsJobResponse,
  JobRequirementsJobStatus,
} from "@/services/job-requirements-queue.service.js";

export class JobRequirementsController {
  private service: JobRequirementsService;
  private jobQueue: JobRequirementsQueueService;

  constructor() {
    this.service = new JobRequirementsService();
    this.jobQueue = new JobRequirementsQueueService();
  }

  /**
   * Create async job requirements generation job
   * POST /api/ai/job-requirements/async
   */
  async generateJobRequirementsAsync(
    req: Request,
    res: Response
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const { jobTitle, industry, seniority, companySize, location } = req.body;
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Async job requirements request received:", {
        method: req.method,
        url: req.url,
        body: {
          jobTitle: jobTitle?.substring(0, 100) + "...",
          industry: industry || "Technology",
          seniority: seniority || "Mid-level",
        },
        userId,
      });

      // Validate request
      if (!jobTitle) {
        res.status(400).json({
          success: false,
          error: "Missing required field: jobTitle",
          code: "MISSING_FIELDS",
        });
        return;
      }

      // Create job requirements request
      const jobRequirementsRequest: JobRequirementsRequest = {
        jobTitle,
        industry,
        seniority,
        companySize,
        location,
        userId,
      };

      // Create async job
      const jobId = await this.jobQueue.createJobRequirementsJob(
        jobRequirementsRequest
      );
      const estimatedTime = this.jobQueue.getEstimatedProcessingTime(
        jobRequirementsRequest
      );
      const processingTime = Date.now() - startTime;

      console.log("Controller: Async job requirements job created:", {
        jobId,
        userId,
        estimatedTime,
        processingTime,
      });

      // Return immediate response with job details
      const response: JobRequirementsJobResponse = {
        success: true,
        jobId,
        message: "Job requirements generation job created successfully",
        status: "pending",
        estimatedTime,
        pollUrl: `/api/ai/job-requirements/jobs/${jobId}/status`,
      };

      res.status(202).json(response);
    } catch (error) {
      console.error("Controller: Job requirements job creation failed:", error);

      res.status(500).json({
        success: false,
        error: "Failed to create job requirements generation job",
        code: "JOB_CREATION_FAILED",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Get job requirements generation job status
   * GET /api/ai/job-requirements/jobs/:jobId/status
   */
  async getJobStatus(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const userId = req.user?.id || "anonymous";

      if (!jobId) {
        res.status(400).json({
          success: false,
          error: "Job ID is required",
          code: "MISSING_JOB_ID",
        });
        return;
      }

      console.log("Controller: Job requirements job status request:", {
        jobId,
        userId,
      });

      // Get job status from queue
      const job = await this.jobQueue.getJobStatus(jobId);

      if (!job) {
        res.status(404).json({
          success: false,
          error: "Job not found",
          code: "JOB_NOT_FOUND",
          message: `Job requirements generation job with ID ${jobId} does not exist`,
        });
        return;
      }

      // Get job progress
      const progress = await this.jobQueue.getJobProgress(jobId);

      // Calculate estimated time remaining
      let estimatedTimeRemaining: number | undefined;
      if (job.status === "processing" && job.startedAt) {
        const elapsed = Date.now() - new Date(job.startedAt).getTime();
        const estimatedTotal =
          this.jobQueue.getEstimatedProcessingTime(job.request) * 1000;
        estimatedTimeRemaining = Math.max(
          0,
          Math.round((estimatedTotal - elapsed) / 1000)
        );
      }

      const response: JobRequirementsJobStatus = {
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

      console.log("Controller: Job requirements job status retrieved:", {
        jobId,
        status: job.status,
        progress,
        userId,
      });

      res.json(response);
    } catch (error) {
      console.error(
        "Controller: Failed to get job requirements job status:",
        error
      );

      res.status(500).json({
        success: false,
        error: "Failed to get job status",
        code: "STATUS_RETRIEVAL_FAILED",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Get all job requirements generation jobs
   * GET /api/ai/job-requirements/jobs
   */
  async getAllJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Job requirements all jobs request:", { userId });

      // Get all jobs from queue
      const jobs = await this.jobQueue.getAllJobs();

      // Filter jobs by user if needed (for multi-tenant scenarios)
      const userJobs = jobs.filter((job) => job.request.userId === userId);

      res.json({
        success: true,
        data: userJobs,
        count: userJobs.length,
        totalCount: jobs.length,
      });
    } catch (error) {
      console.error(
        "Controller: Failed to get all job requirements jobs:",
        error
      );

      res.status(500).json({
        success: false,
        error: "Failed to get jobs",
        code: "JOBS_RETRIEVAL_FAILED",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Synchronous job requirements generation (for backward compatibility)
   * POST /api/ai/job-requirements/sync
   */
  async generateJobRequirementsSync(
    req: Request,
    res: Response
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const { jobTitle, industry, seniority, companySize, location } = req.body;
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Sync job requirements request received:", {
        method: req.method,
        url: req.url,
        body: {
          jobTitle: jobTitle?.substring(0, 100) + "...",
          industry: industry || "Technology",
          seniority: seniority || "Mid-level",
        },
        userId,
      });

      // Validate request
      if (!jobTitle) {
        res.status(400).json({
          success: false,
          error: "Missing required field: jobTitle",
          code: "MISSING_FIELDS",
        });
        return;
      }

      // Create job requirements request
      const jobRequirementsRequest: JobRequirementsRequest = {
        jobTitle,
        industry,
        seniority,
        companySize,
        location,
        userId,
      };

      // Generate job requirements synchronously
      const result = await this.service.generateJobRequirements(
        jobRequirementsRequest
      );
      const processingTime = Date.now() - startTime;

      console.log("Controller: Sync job requirements completed:", {
        userId,
        jobTitle: result.jobTitle,
        processingTime,
      });

      res.json({
        success: true,
        data: result,
        processingTime,
        message: "Job requirements generated successfully",
      });
    } catch (error) {
      console.error("Controller: Sync job requirements failed:", error);

      res.status(500).json({
        success: false,
        error: "Job requirements generation failed",
        code: "JOB_REQUIREMENTS_FAILED",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Get job requirements generation queue statistics
   * GET /api/ai/job-requirements/stats
   */
  async getQueueStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Job requirements queue stats request:", {
        userId,
      });

      // Get queue statistics
      const stats = await this.jobQueue.getQueueStats();

      if (!stats) {
        res.status(500).json({
          success: false,
          error: "Failed to get queue statistics",
          code: "STATS_RETRIEVAL_FAILED",
        });
        return;
      }

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "Controller: Failed to get job requirements queue stats:",
        error
      );

      res.status(500).json({
        success: false,
        error: "Failed to get queue statistics",
        code: "STATS_RETRIEVAL_FAILED",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
}
