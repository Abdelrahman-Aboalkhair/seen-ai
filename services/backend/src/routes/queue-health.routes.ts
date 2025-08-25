// Queue Health Routes - Centralized monitoring for all queues

import { Router } from "express";
import { QueueManagerService } from "@/services/queue-manager.service.js";

const router = Router();
const queueManager = QueueManagerService.getInstance();

/**
 * GET /api/queues/health
 * Get overall health status of all queues
 */
router.get("/health", async (req, res) => {
  try {
    const healthStatus = await queueManager.getHealthStatus();
    res.json(healthStatus);
  } catch (error) {
    console.error("❌ [Queue Health] Error getting health status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get queue health status",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/queues/stats
 * Get statistics for all queues
 */
router.get("/stats", async (req, res) => {
  try {
    const allStats = await queueManager.getAllQueueStats();
    res.json({
      success: true,
      data: allStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [Queue Health] Error getting queue stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get queue statistics",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/queues/cleanup
 * Clean up old jobs for all queues
 */
router.post("/cleanup", async (req, res) => {
  try {
    const { maxAgeHours = 24 } = req.body;

    if (typeof maxAgeHours !== "number" || maxAgeHours < 1) {
      return res.status(400).json({
        success: false,
        error: "maxAgeHours must be a positive number",
      });
    }

    await queueManager.cleanupAllQueues(maxAgeHours);

    res.json({
      success: true,
      message: `Cleaned up old jobs (older than ${maxAgeHours} hours)`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [Queue Health] Error cleaning up queues:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clean up queues",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/queues/shutdown
 * Gracefully shutdown all queues (for maintenance)
 */
router.post("/shutdown", async (req, res) => {
  try {
    await queueManager.shutdownAllQueues();

    res.json({
      success: true,
      message: "All queues shut down successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [Queue Health] Error shutting down queues:", error);
    res.status(500).json({
      success: false,
      error: "Failed to shutdown queues",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
