// Interview Analysis Routes

import { Router } from "express";
import { InterviewAnalysisController } from "@/controllers/interview-analysis.controller.js";

const router = Router();
const interviewAnalysisController = new InterviewAnalysisController();

/**
 * Interview Analysis Routes
 */

// Async interview analysis - creates a job and returns immediately
router.post(
  "/async",
  interviewAnalysisController.analyzeInterviewAsync.bind(
    interviewAnalysisController
  )
);

// Synchronous interview analysis - for backward compatibility
router.post(
  "/sync",
  interviewAnalysisController.analyzeInterviewSync.bind(
    interviewAnalysisController
  )
);

// Get interview insights and statistics
router.post(
  "/insights",
  interviewAnalysisController.getInterviewInsights.bind(
    interviewAnalysisController
  )
);

// Get interview analysis job status
router.get(
  "/jobs/:jobId/status",
  interviewAnalysisController.getJobStatus.bind(interviewAnalysisController)
);

// Get all interview analysis jobs for a user
router.get(
  "/jobs",
  interviewAnalysisController.getAllJobs.bind(interviewAnalysisController)
);

// Get interview analysis queue statistics
router.get(
  "/stats",
  interviewAnalysisController.getQueueStats.bind(interviewAnalysisController)
);

export default router;
