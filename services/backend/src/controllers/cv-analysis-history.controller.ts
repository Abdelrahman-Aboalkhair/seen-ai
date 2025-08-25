// CV Analysis History Controller - Handles history and database operations

import { Request, Response } from "express";
import { CVAnalysisDBService } from "@/services/cv-analysis-db.service.js";

export class CVAnalysisHistoryController {
  private dbService: CVAnalysisDBService;

  constructor() {
    this.dbService = new CVAnalysisDBService();
  }

  /**
   * Get CV analysis history for a user
   * GET /api/ai/cv-analysis/history
   */
  async getAnalysisHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId =
        req.user?.id || (req.query.userId as string) || "anonymous";
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string)
        : 0;
      const status = req.query.status as
        | "completed"
        | "failed"
        | "processing"
        | undefined;

      console.log("📚 [History Controller] Fetching analysis history:", {
        userId,
        limit,
        offset,
        status,
        timestamp: new Date().toISOString(),
      });

      if (!userId || userId === "anonymous") {
        res.status(400).json({
          success: false,
          error: "User ID is required",
          code: "MISSING_USER_ID",
        });
        return;
      }

      const history = await this.dbService.getAnalysisHistory({
        userId,
        limit,
        offset,
        status,
      });

      console.log("✅ [History Controller] History fetched successfully:", {
        userId,
        recordCount: history.length,
      });

      res.json({
        success: true,
        data: history,
        count: history.length,
        pagination: {
          limit,
          offset,
          hasMore: history.length === limit,
        },
      });
    } catch (error) {
      console.error("❌ [History Controller] Failed to fetch history:", error);

      res.status(500).json({
        success: false,
        error: "Failed to fetch analysis history",
        code: "HISTORY_FETCH_FAILED",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Get a specific CV analysis by ID
   * GET /api/ai/cv-analysis/history/:id
   */
  async getAnalysisById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId =
        req.user?.id || (req.query.userId as string) || "anonymous";

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Analysis ID is required",
          code: "MISSING_ANALYSIS_ID",
        });
        return;
      }

      console.log("🔍 [History Controller] Fetching analysis by ID:", {
        analysisId: id,
        userId,
        timestamp: new Date().toISOString(),
      });

      const analysis = await this.dbService.getAnalysisById(id);

      if (!analysis) {
        res.status(404).json({
          success: false,
          error: "Analysis not found",
          code: "ANALYSIS_NOT_FOUND",
        });
        return;
      }

      // Check if user has access to this analysis
      if (analysis.user_id !== userId && userId !== "anonymous") {
        res.status(403).json({
          success: false,
          error: "Access denied",
          code: "ACCESS_DENIED",
        });
        return;
      }

      console.log("✅ [History Controller] Analysis fetched successfully:", {
        analysisId: id,
        userId,
      });

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      console.error("❌ [History Controller] Failed to fetch analysis:", error);

      res.status(500).json({
        success: false,
        error: "Failed to fetch analysis",
        code: "ANALYSIS_FETCH_FAILED",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Delete a CV analysis
   * DELETE /api/ai/cv-analysis/history/:id
   */
  async deleteAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId =
        req.user?.id || (req.query.userId as string) || "anonymous";

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Analysis ID is required",
          code: "MISSING_ANALYSIS_ID",
        });
        return;
      }

      console.log("🗑️ [History Controller] Deleting analysis:", {
        analysisId: id,
        userId,
        timestamp: new Date().toISOString(),
      });

      // First check if the analysis exists and user has access
      const analysis = await this.dbService.getAnalysisById(id);
      if (!analysis) {
        res.status(404).json({
          success: false,
          error: "Analysis not found",
          code: "ANALYSIS_NOT_FOUND",
        });
        return;
      }

      if (analysis.user_id !== userId && userId !== "anonymous") {
        res.status(403).json({
          success: false,
          error: "Access denied",
          code: "ACCESS_DENIED",
        });
        return;
      }

      await this.dbService.deleteAnalysis(id);

      console.log("✅ [History Controller] Analysis deleted successfully:", {
        analysisId: id,
        userId,
      });

      res.json({
        success: true,
        message: "Analysis deleted successfully",
      });
    } catch (error) {
      console.error(
        "❌ [History Controller] Failed to delete analysis:",
        error
      );

      res.status(500).json({
        success: false,
        error: "Failed to delete analysis",
        code: "ANALYSIS_DELETE_FAILED",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Get analysis statistics for a user
   * GET /api/ai/cv-analysis/history/stats
   */
  async getAnalysisStats(req: Request, res: Response): Promise<void> {
    try {
      const userId =
        req.user?.id || (req.query.userId as string) || "anonymous";

      console.log("📊 [History Controller] Fetching analysis statistics:", {
        userId,
        timestamp: new Date().toISOString(),
      });

      if (!userId || userId === "anonymous") {
        res.status(400).json({
          success: false,
          error: "User ID is required",
          code: "MISSING_USER_ID",
        });
        return;
      }

      const stats = await this.dbService.getAnalysisStats(userId);

      console.log("✅ [History Controller] Statistics fetched successfully:", {
        userId,
        stats,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error(
        "❌ [History Controller] Failed to fetch statistics:",
        error
      );

      res.status(500).json({
        success: false,
        error: "Failed to fetch analysis statistics",
        code: "STATS_FETCH_FAILED",
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
}
