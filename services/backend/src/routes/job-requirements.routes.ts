// Job Requirements Generation Routes

import { Router } from "express";
import { JobRequirementsController } from "@/controllers/job-requirements.controller.js";

const router = Router();
const jobRequirementsController = new JobRequirementsController();

/**
 * Job Requirements Generation Routes
 */

// Async job requirements generation - creates a job and returns immediately
router.post(
  "/async",
  jobRequirementsController.generateJobRequirementsAsync.bind(
    jobRequirementsController
  )
);

// Synchronous job requirements generation - for backward compatibility
router.post(
  "/sync",
  jobRequirementsController.generateJobRequirementsSync.bind(
    jobRequirementsController
  )
);

// Get job requirements generation job status
router.get(
  "/jobs/:jobId/status",
  jobRequirementsController.getJobStatus.bind(jobRequirementsController)
);

// Get all job requirements generation jobs for a user
router.get(
  "/jobs",
  jobRequirementsController.getAllJobs.bind(jobRequirementsController)
);

// Get job requirements generation queue statistics
router.get(
  "/stats",
  jobRequirementsController.getQueueStats.bind(jobRequirementsController)
);

export default router;
