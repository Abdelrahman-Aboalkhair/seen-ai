// Talent Search Controller - HTTP Request/Response Layer

import { Request, Response } from "express";
import type {
  TalentSearchCriteria,
  TalentSearchResult,
  AdvancedSearchFilters,
  TalentSearchResponse,
  AsyncTalentSearchResponse,
  JobStatusResponse,
} from "@/types/talent-search.types.js";
import { TalentSearchService } from "@/services/talent-search.service.js";
import { JobQueueService } from "@/services/job-queue.service.js";

export class TalentSearchController {
  private service: TalentSearchService;
  private jobQueue: JobQueueService;

  constructor() {
    this.service = new TalentSearchService();
    this.jobQueue = new JobQueueService();
  }

  /**
   * Async Talent Search - Returns job ID immediately
   * POST /api/talent/search
   */
  async searchTalent(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      console.log("Controller: Async talent search request received:", {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        userId: req.user?.id || "anonymous",
      });

      const criteria: TalentSearchCriteria = req.body;
      const userId = req.user?.id || "test-user";

      // Validate request body
      if (!criteria || Object.keys(criteria).length === 0) {
        res.status(400).json({
          success: false,
          error: "Missing search criteria",
          code: "MISSING_CRITERIA",
          message: "Search criteria is required",
        });
        return;
      }

      // Create async job
      const jobId = await this.jobQueue.createTalentSearchJob(criteria);
      const estimatedTime = this.jobQueue.getEstimatedProcessingTime(criteria);

      const response: AsyncTalentSearchResponse = {
        success: true,
        jobId,
        message: "Talent search job created successfully",
        status: "pending",
        estimatedTime,
        pollUrl: `/api/talent/jobs/${jobId}/status`,
      };

      console.log("Controller: Async talent search job created:", {
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

      console.error("Controller: Async talent search failed:", {
        error: errorMessage,
        userId: req.user?.id || "anonymous",
        duration,
      });

      res.status(500).json({
        success: false,
        error: "Failed to create talent search job",
        code: "JOB_CREATION_ERROR",
        message: errorMessage,
        processingTime: duration,
      });
    }
  }

  /**
   * Async Advanced Talent Search - Returns job ID immediately
   * POST /api/talent/search/advanced
   */
  async advancedSearch(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(
        "Controller: Async advanced talent search request received:",
        {
          method: req.method,
          url: req.originalUrl,
          body: req.body,
          userId: req.user?.id || "anonymous",
        }
      );

      const { criteria, filters } = req.body;
      const userId = req.user?.id || "test-user";

      // Validate request body
      if (!criteria || Object.keys(criteria).length === 0) {
        res.status(400).json({
          success: false,
          error: "Missing search criteria",
          code: "MISSING_CRITERIA",
          message: "Search criteria is required for advanced search",
        });
        return;
      }

      // Create async advanced search job
      const jobId = await this.jobQueue.createAdvancedSearchJob(
        criteria,
        filters || {}
      );
      const estimatedTime = this.jobQueue.getEstimatedProcessingTime(criteria);

      const response: AsyncTalentSearchResponse = {
        success: true,
        jobId,
        message: "Advanced talent search job created successfully",
        status: "pending",
        estimatedTime,
        pollUrl: `/api/talent/jobs/${jobId}/status`,
      };

      console.log("Controller: Async advanced talent search job created:", {
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

      console.error("Controller: Async advanced talent search failed:", {
        error: errorMessage,
        userId: req.user?.id || "anonymous",
        duration,
      });

      res.status(500).json({
        success: false,
        error: "Failed to create advanced talent search job",
        code: "JOB_CREATION_ERROR",
        message: errorMessage,
        processingTime: duration,
      });
    }
  }

  /**
   * Get Job Status
   * GET /api/talent/jobs/:jobId/status
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

      console.log("Controller: Job status request:", { jobId, userId });

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
          ? this.jobQueue.getEstimatedProcessingTime(job.criteria)
          : undefined;

      const response: JobStatusResponse = {
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

      console.log("Controller: Job status retrieved:", {
        jobId,
        status: job.status,
        progress,
        userId,
      });

      res.status(200).json(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Controller: Failed to get job status:", {
        error: errorMessage,
        jobId: req.params.jobId,
        userId: req.user?.id || "anonymous",
      });

      res.status(500).json({
        success: false,
        error: "Failed to get job status",
        code: "JOB_STATUS_ERROR",
        message: errorMessage,
      });
    }
  }

  /**
   * Get All Jobs (for monitoring)
   * GET /api/talent/jobs
   */
  async getAllJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Get all jobs request:", { userId });

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

      console.error("Controller: Failed to get all jobs:", {
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
   * Legacy Synchronous Search (for backward compatibility)
   * POST /api/talent/search/sync
   */
  async searchTalentSync(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      console.log("Controller: Legacy sync talent search request received:", {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        userId: req.user?.id || "anonymous",
      });

      const criteria: TalentSearchCriteria = req.body;
      const userId = req.user?.id || "test-user";

      // Validate request body
      if (!criteria || Object.keys(criteria).length === 0) {
        res.status(400).json({
          success: false,
          error: "Missing search criteria",
          code: "MISSING_CRITERIA",
          message: "Search criteria is required",
        });
        return;
      }

      // Perform synchronous search (legacy behavior)
      const searchResult = await this.service.searchTalent(criteria);

      const duration = Date.now() - startTime;

      const response: TalentSearchResponse = {
        success: true,
        data: searchResult,
        creditsRemaining: 100, // Mock for testing
        processingTime: duration,
      };

      console.log(
        "Controller: Legacy sync talent search completed successfully:",
        {
          userId,
          profileCount: searchResult.profiles.length,
          totalCount: searchResult.totalCount,
          processingTime: duration,
        }
      );

      res.status(200).json(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Controller: Legacy sync talent search failed:", {
        error: errorMessage,
        userId: req.user?.id || "anonymous",
        duration,
      });

      res.status(500).json({
        success: false,
        error: "Talent search failed",
        code: "TALENT_SEARCH_ERROR",
        message: errorMessage,
        processingTime: duration,
      });
    }
  }

  /**
   * Get Talent Profile by ID
   * GET /api/talent/profile/:profileId
   */
  async getProfileById(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      if (!profileId) {
        res.status(400).json({
          success: false,
          error: "Missing profile ID",
          code: "MISSING_PROFILE_ID",
          message: "Profile ID is required",
        });
        return;
      }
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Get profile by ID request:", {
        profileId,
        userId,
      });

      const profile = await this.service.getProfileById(profileId);

      if (!profile) {
        res.status(404).json({
          success: false,
          error: "Profile not found",
          code: "PROFILE_NOT_FOUND",
          message: `Profile with ID ${profileId} does not exist`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Controller: Failed to get profile:", {
        error: errorMessage,
        profileId: req.params.profileId,
        userId: req.user?.id || "anonymous",
      });

      res.status(500).json({
        success: false,
        error: "Failed to get profile",
        code: "PROFILE_RETRIEVAL_ERROR",
        message: errorMessage,
      });
    }
  }

  /**
   * Get Multiple Profiles by IDs
   * POST /api/talent/profiles
   */
  async getProfilesByIds(req: Request, res: Response): Promise<void> {
    try {
      const { profileIds } = req.body;
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Get profiles by IDs request:", {
        profileIds,
        userId,
      });

      if (!Array.isArray(profileIds) || profileIds.length === 0) {
        res.status(400).json({
          success: false,
          error: "Invalid profile IDs",
          code: "INVALID_PROFILE_IDS",
          message: "profileIds must be a non-empty array",
        });
        return;
      }

      const profiles = await this.service.getProfilesByIds(profileIds);

      res.status(200).json({
        success: true,
        data: {
          profiles,
          requestedCount: profileIds.length,
          foundCount: profiles.length,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Controller: Failed to get profiles:", {
        error: errorMessage,
        profileIds: req.body.profileIds,
        userId: req.user?.id || "anonymous",
      });

      res.status(500).json({
        success: false,
        error: "Failed to get profiles",
        code: "PROFILES_RETRIEVAL_ERROR",
        message: errorMessage,
      });
    }
  }
}
