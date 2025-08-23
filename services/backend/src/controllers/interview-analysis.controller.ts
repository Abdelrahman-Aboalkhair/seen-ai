// Interview Analysis Controller - HTTP Layer

import { Request, Response } from "express";
import type { InterviewAnalysisRequest } from "@/types/ai.types.js";
import { InterviewAnalysisService } from "@/services/interview-analysis.service.js";
import { InterviewAnalysisQueueService } from "@/services/interview-analysis-queue.service.js";
import type {
  InterviewAnalysisJobResponse,
  InterviewAnalysisJobStatus,
} from "@/services/interview-analysis-queue.service.js";

export class InterviewAnalysisController {
  private service: InterviewAnalysisService;
  private jobQueue: InterviewAnalysisQueueService;

  constructor() {
    this.service = new InterviewAnalysisService();
    this.jobQueue = new InterviewAnalysisQueueService();
  }

  /**
   * Create async interview analysis job
   * POST /api/ai/interview-analysis/async
   */
  async analyzeInterviewAsync(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { sessionId, questions, answers } = req.body;
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Async interview analysis request received:", {
        method: req.method,
        url: req.url,
        body: {
          sessionId,
          questionsCount: questions?.length || 0,
          answersCount: answers?.length || 0,
        },
        userId,
      });

      // Validate request
      if (!sessionId || !questions || !answers) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: sessionId, questions, and answers",
          code: "MISSING_FIELDS",
        });
        return;
      }

      // Create interview analysis request
      const interviewAnalysisRequest: InterviewAnalysisRequest = {
        sessionId,
        questions,
        answers,
        userId,
      };

      // Create async job
      const jobId = await this.jobQueue.createInterviewAnalysisJob(
        interviewAnalysisRequest
      );
      const estimatedTime = this.jobQueue.getEstimatedProcessingTime(
        interviewAnalysisRequest
      );
      const processingTime = Date.now() - startTime;

      console.log("Controller: Async interview analysis job created:", {
        jobId,
        userId,
        sessionId,
        estimatedTime,
        processingTime,
      });

      // Return immediate response with job details
      const response: InterviewAnalysisJobResponse = {
        success: true,
        jobId,
        message: "Interview analysis job created successfully",
        status: "pending",
        estimatedTime,
        pollUrl: `/api/ai/interview-analysis/jobs/${jobId}/status`,
      };

      res.status(202).json(response);
    } catch (error) {
      console.error(
        "Controller: Interview analysis job creation failed:",
        error
      );

      res.status(500).json({
        success: false,
        error: "Failed to create interview analysis job",
        code: "JOB_CREATION_FAILED",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Get interview analysis job status
   * GET /api/ai/interview-analysis/jobs/:jobId/status
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

      console.log("Controller: Interview analysis job status request:", {
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
          message: `Interview analysis job with ID ${jobId} does not exist`,
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

      const response: InterviewAnalysisJobStatus = {
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

      console.log("Controller: Interview analysis job status retrieved:", {
        jobId,
        status: job.status,
        progress,
        userId,
      });

      res.json(response);
    } catch (error) {
      console.error(
        "Controller: Failed to get interview analysis job status:",
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
   * Get all interview analysis jobs
   * GET /api/ai/interview-analysis/jobs
   */
  async getAllJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Interview analysis all jobs request:", {
        userId,
      });

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
        "Controller: Failed to get all interview analysis jobs:",
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
   * Synchronous interview analysis (for backward compatibility)
   * POST /api/ai/interview-analysis/sync
   */
  async analyzeInterviewSync(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { sessionId, questions, answers } = req.body;
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Sync interview analysis request received:", {
        method: req.method,
        url: req.url,
        body: {
          sessionId,
          questionsCount: questions?.length || 0,
          answersCount: answers?.length || 0,
        },
        userId,
      });

      // Validate request
      if (!sessionId || !questions || !answers) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: sessionId, questions, and answers",
          code: "MISSING_FIELDS",
        });
        return;
      }

      // Create interview analysis request
      const interviewAnalysisRequest: InterviewAnalysisRequest = {
        sessionId,
        questions,
        answers,
        userId,
      };

      // Analyze interview synchronously
      const result = await this.service.analyzeInterview(
        interviewAnalysisRequest
      );
      const processingTime = Date.now() - startTime;

      console.log("Controller: Sync interview analysis completed:", {
        userId,
        sessionId,
        overallScore: result.overallScore,
        processingTime,
      });

      res.json({
        success: true,
        data: result,
        processingTime,
        message: "Interview analysis completed successfully",
      });
    } catch (error) {
      console.error("Controller: Sync interview analysis failed:", error);

      res.status(500).json({
        success: false,
        error: "Interview analysis failed",
        code: "INTERVIEW_ANALYSIS_FAILED",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Get interview analysis queue statistics
   * GET /api/ai/interview-analysis/stats
   */
  async getQueueStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Interview analysis queue stats request:", {
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
        "Controller: Failed to get interview analysis queue stats:",
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

  /**
   * Get interview insights and statistics
   * POST /api/ai/interview-analysis/insights
   */
  async getInterviewInsights(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, questions, answers } = req.body;
      const userId = req.user?.id || "anonymous";

      console.log("Controller: Interview insights request:", {
        userId,
        sessionId,
        questionsCount: questions?.length || 0,
      });

      // Validate request
      if (!questions || !answers) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: questions and answers",
          code: "MISSING_FIELDS",
        });
        return;
      }

      // Create interview analysis request for insights
      const interviewAnalysisRequest: InterviewAnalysisRequest = {
        sessionId: sessionId || `insights_${Date.now()}`,
        questions,
        answers,
        userId,
      };

      // Get insights from service
      const insights = this.service.extractInterviewInsights(
        interviewAnalysisRequest
      );
      const stats = this.service.generateInterviewStats(
        interviewAnalysisRequest
      );

      res.json({
        success: true,
        data: {
          insights,
          stats,
        },
        message: "Interview insights generated successfully",
      });
    } catch (error) {
      console.error("Controller: Failed to get interview insights:", error);

      res.status(500).json({
        success: false,
        error: "Failed to generate interview insights",
        code: "INSIGHTS_GENERATION_FAILED",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
}
