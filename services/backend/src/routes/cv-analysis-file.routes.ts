// CV Analysis File Upload Routes - Handle CV file uploads (JPG, PNG, PDF)

import { Router } from "express";
import { CVAnalysisController } from "@/controllers/cv-analysis.controller.js";
import { CloudinaryFileProcessingService } from "@/services/cloudinary-file-processing.service.js";

const router = Router();
const cvAnalysisController = new CVAnalysisController();
const fileProcessingService = new CloudinaryFileProcessingService();

/**
 * POST /api/ai/cv-analysis/async/file
 * Create async CV analysis job from file upload
 */
router.post("/async/file", async (req, res) => {
  try {
    // Initialize multer configuration
    const upload = await fileProcessingService.getMulterConfig();

    // Handle file upload
    upload.single("cvFile")(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: "File upload failed",
          code: "UPLOAD_FAILED",
          message: err.message,
        });
      }

      try {
        console.log("🚀 [CV File Route] File upload request received:", {
          method: req.method,
          url: req.url,
          hasFile: !!req.file,
          fileInfo: req.file
            ? {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
              }
            : null,
          body: req.body,
        });

        // Validate file upload
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: "No CV file provided",
            code: "MISSING_FILE",
            allowedTypes:
              fileProcessingService.getFileProcessingStats().allowedTypes,
            maxSize: fileProcessingService.getFileProcessingStats().maxFileSize,
          });
        }

        // Validate file
        const validation = fileProcessingService.validateFile(req.file);
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: validation.error,
            code: "INVALID_FILE",
            allowedTypes: validation.allowedTypes,
            maxSize: validation.maxSize,
          });
        }

        // Extract form data
        const { jobRequirements, userId } = req.body;

        // Validate required fields
        if (!jobRequirements || !userId) {
          return res.status(400).json({
            success: false,
            error: "Missing required fields: jobRequirements and userId",
            code: "MISSING_FIELDS",
          });
        }

        // Create CV analysis request with file
        const cvAnalysisRequest = {
          cvFile: req.file,
          jobRequirements,
          userId,
        };

        console.log("🔧 [CV File Route] Creating async job with file...");

        // Create async job using the controller
        const jobId = await cvAnalysisController.createCVAnalysisJobFromFile(
          cvAnalysisRequest
        );

        console.log(
          "✅ [CV File Route] CV analysis job created successfully:",
          {
            jobId,
            userId,
            fileName: req.file.originalname,
          }
        );

        // Return immediate response with job details
        res.status(202).json({
          success: true,
          jobId,
          message: "CV analysis job created successfully from file",
          status: "pending",
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          pollUrl: `/api/ai/cv-analysis/jobs/${jobId}/status`,
        });
      } catch (error) {
        console.error(
          "❌ [CV File Route] Failed to create CV analysis job:",
          error
        );

        res.status(500).json({
          success: false,
          error: "Failed to create CV analysis job",
          code: "JOB_CREATION_FAILED",
          message:
            error instanceof Error ? error.message : "Internal server error",
        });
      }
    });
  } catch (error) {
    console.error("❌ [CV File Route] Multer initialization failed:", error);
    res.status(500).json({
      success: false,
      error: "File upload system unavailable",
      code: "UPLOAD_SYSTEM_ERROR",
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * GET /api/ai/cv-analysis/file/stats
 * Get file processing statistics and limits
 */
router.get("/file/stats", (req, res) => {
  try {
    const stats = fileProcessingService.getFileProcessingStats();

    res.json({
      success: true,
      data: {
        allowedTypes: stats.allowedTypes,
        maxFileSize: stats.maxFileSize,
        maxFileSizeMB: (stats.maxFileSize / 1024 / 1024).toFixed(2),
        cloudinaryConfigured: stats.cloudinaryConfigured,
        processingMethod: "Cloudinary",
      },
      message: "File processing configuration retrieved successfully",
    });
  } catch (error) {
    console.error("❌ [CV File Route] Failed to get file stats:", error);

    res.status(500).json({
      success: false,
      error: "Failed to get file processing statistics",
      code: "STATS_RETRIEVAL_FAILED",
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

export default router;
