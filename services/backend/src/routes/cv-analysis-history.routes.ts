// CV Analysis History Routes

import { Router } from "express";
import { CVAnalysisHistoryController } from "@/controllers/cv-analysis-history.controller.js";

const router = Router();
const historyController = new CVAnalysisHistoryController();

/**
 * CV Analysis History Routes
 */

// Get CV analysis history for a user
router.get("/", historyController.getAnalysisHistory.bind(historyController));

// Get analysis statistics for a user
router.get(
  "/stats",
  historyController.getAnalysisStats.bind(historyController)
);

// Get a specific CV analysis by ID
router.get("/:id", historyController.getAnalysisById.bind(historyController));

// Delete a CV analysis
router.delete("/:id", historyController.deleteAnalysis.bind(historyController));

export default router;
