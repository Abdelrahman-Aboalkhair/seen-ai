// Question Generation Routes - Express Router Configuration

import { Router } from "express";
import { QuestionGenerationController } from "@/controllers/question-generation.controller.js";

const router = Router();
const questionGenerationController = new QuestionGenerationController();

/**
 * Async Question Generation - Returns job ID immediately
 * POST /api/ai/generate-questions/async
 */
router.post(
  "/async",
  questionGenerationController.generateQuestionsAsync.bind(
    questionGenerationController
  )
);

/**
 * Legacy Synchronous Question Generation
 * POST /api/ai/generate-questions/sync
 */
router.post(
  "/sync",
  questionGenerationController.generateQuestionsSync.bind(
    questionGenerationController
  )
);

/**
 * Get Job Status
 * GET /api/ai/generate-questions/jobs/:jobId/status
 */
router.get(
  "/jobs/:jobId/status",
  questionGenerationController.getJobStatus.bind(questionGenerationController)
);

/**
 * Get All Jobs
 * GET /api/ai/generate-questions/jobs
 */
router.get(
  "/jobs",
  questionGenerationController.getAllJobs.bind(questionGenerationController)
);

/**
 * Get Queue Statistics
 * GET /api/ai/generate-questions/stats
 */
router.get(
  "/stats",
  questionGenerationController.getQueueStats.bind(questionGenerationController)
);

export default router;
