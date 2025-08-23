// CV Analysis Routes

import { Router } from "express";
import { CVAnalysisController } from "@/controllers/cv-analysis.controller.js";

const router = Router();
const cvAnalysisController = new CVAnalysisController();

/**
 * CV Analysis Routes
 */

// Async CV analysis - creates a job and returns immediately
router.post(
  "/async",
  cvAnalysisController.analyzeCVAsync.bind(cvAnalysisController)
);

// Synchronous CV analysis - for backward compatibility
router.post(
  "/sync",
  cvAnalysisController.analyzeCVSync.bind(cvAnalysisController)
);

// Get CV analysis job status
router.get(
  "/jobs/:jobId/status",
  cvAnalysisController.getJobStatus.bind(cvAnalysisController)
);

// Get all CV analysis jobs for a user
router.get("/jobs", cvAnalysisController.getAllJobs.bind(cvAnalysisController));

// Get CV analysis queue statistics
router.get(
  "/stats",
  cvAnalysisController.getQueueStats.bind(cvAnalysisController)
);

export default router;
