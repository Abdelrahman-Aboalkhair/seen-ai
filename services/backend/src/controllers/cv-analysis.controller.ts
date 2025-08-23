// CV Analysis Controller - HTTP Layer

import { Request, Response } from "express";
import type { CVAnalysisRequest } from "@/types/ai.types.js";
import { CVAnalysisService } from "@/services/cv-analysis.service.js";
import { CVAnalysisQueueService } from "@/services/cv-analysis-queue.service.js";
import type {
  CVAnalysisJobResponse,
  CVAnalysisJobStatus,
} from "@/services/cv-analysis-queue.service.js";

export class CVAnalysisController {
  private service: CVAnalysisService;
  private jobQueue: CVAnalysisQueueService;

  constructor() {
    this.service = new CVAnalysisService();
    this.jobQueue = new CVAnalysisQueueService();
  }

  /**
   * Create async CV analysis job
   * POST /api/ai/cv-analysis/async
   */
  async analyzeCVAsync(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { cvText, jobRequirements } = req.body;
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Async CV analysis request received:", {
        method: req.method,
        url: req.url,
        body: {
          cvText: cvText?.substring(0, 100) + "...",
          jobRequirements: jobRequirements?.substring(0, 100) + "...",
        },
        userId,
      });

      // Validate request
      if (!cvText || !jobRequirements) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: cvText and jobRequirements",
          code: "MISSING_FIELDS",
        });
        return;
      }

      // Create CV analysis request
      const cvAnalysisRequest: CVAnalysisRequest = {
        cvText,
        jobRequirements,
        userId,
      };

      // Create async job
      const jobId = await this.jobQueue.createCVAnalysisJob(cvAnalysisRequest);
      const estimatedTime =
        this.jobQueue.getEstimatedProcessingTime(cvAnalysisRequest);
      const processingTime = Date.now() - startTime;

      console.log("Controller: Async CV analysis job created:", {
        jobId,
        userId,
        estimatedTime,
        processingTime,
      });

      // Return immediate response with job details
      const response: CVAnalysisJobResponse = {
        success: true,
        jobId,
        message: "CV analysis job created successfully",
        status: "pending",
        estimatedTime,
        pollUrl: `/api/ai/cv-analysis/jobs/${jobId}/status`,
      };

      res.status(202).json(response);
    } catch (error) {
      console.error("Controller: CV analysis job creation failed:", error);

      res.status(500).json({
        success: false,
        error: "Failed to create CV analysis job",
        code: "JOB_CREATION_FAILED",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Get CV analysis job status
   * GET /api/ai/cv-analysis/jobs/:jobId/status
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

      console.log("Controller: CV analysis job status request:", {
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
          message: `CV analysis job with ID ${jobId} does not exist`,
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

      const response: CVAnalysisJobStatus = {
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

      console.log("Controller: CV analysis job status retrieved:", {
        jobId,
        status: job.status,
        progress,
        userId,
      });

      res.json(response);
    } catch (error) {
      console.error("Controller: Failed to get CV analysis job status:", error);

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
   * Get all CV analysis jobs
   * GET /api/ai/cv-analysis/jobs
   */
  async getAllJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || "anonymous";

      console.log("Controller: CV analysis all jobs request:", { userId });

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
      console.error("Controller: Failed to get all CV analysis jobs:", error);

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
   * Synchronous CV analysis (for backward compatibility)
   * POST /api/ai/cv-analysis/sync
   */
  async analyzeCVSync(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { cvText, jobRequirements } = req.body;
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Sync CV analysis request received:", {
        method: req.method,
        url: req.url,
        body: {
          cvText: cvText?.substring(0, 100) + "...",
          jobRequirements: jobRequirements?.substring(0, 100) + "...",
        },
        userId,
      });

      // Validate request
      if (!cvText || !jobRequirements) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: cvText and jobRequirements",
          code: "MISSING_FIELDS",
        });
        return;
      }

      // Create CV analysis request
      const cvAnalysisRequest: CVAnalysisRequest = {
        cvText,
        jobRequirements,
        userId,
      };

      // Analyze CV synchronously
      const result = await this.service.analyzeCV(cvAnalysisRequest);
      const processingTime = Date.now() - startTime;

      console.log("Controller: Sync CV analysis completed:", {
        userId,
        score: result.score,
        matchPercentage: result.matchPercentage,
        processingTime,
      });

      res.json({
        success: true,
        data: result,
        processingTime,
        message: "CV analysis completed successfully",
      });
    } catch (error) {
      console.error("Controller: Sync CV analysis failed:", error);

      res.status(500).json({
        success: false,
        error: "CV analysis failed",
        code: "CV_ANALYSIS_FAILED",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Get CV analysis queue statistics
   * GET /api/ai/cv-analysis/stats
   */
  async getQueueStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || "anonymous";

      console.log("Controller: CV analysis queue stats request:", { userId });

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
        "Controller: Failed to get CV analysis queue stats:",
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
