import { Router, Request, Response } from "express";
import aiService from "@/services/ai/ai.service.js";
import supabaseService from "@/lib/supabase.js";
import { authenticate, requireCredits } from "@/middleware/auth.js";
import { aiRateLimit } from "@/middleware/rateLimiter.js";
import {
  commonValidations,
  validateSchema,
  schemas,
} from "@/middleware/validation.js";
import logger, { logError, logPerformance } from "@/lib/logger.js";

const router = Router();

// Apply authentication and rate limiting to all AI routes
router.use(authenticate);
router.use(aiRateLimit);

/**
 * CV Analysis Endpoint
 * POST /api/ai/cv-analysis
 */
router.post(
  "/cv-analysis",
  requireCredits(2), // CV analysis costs 2 credits
  ...commonValidations.cvAnalysis,
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      const { cvText, jobRequirements } = req.body;
      const userId = req.user!.id;

      logger.info("CV analysis requested", {
        userId,
        cvLength: cvText.length,
        jobRequirementsLength: jobRequirements.length,
      });

      // Analyze CV using AI service
      const analysisResult = await aiService.cvAnalysis.analyze({
        cvText,
        jobRequirements,
        userId,
      });

      // Deduct credits from user account
      const { data: user } = await supabaseService.getUser(userId);
      if (user) {
        const newCredits = user.credits - 2;
        await supabaseService.updateUserCredits(userId, newCredits);

        // Create credit transaction record
        await supabaseService.createCreditTransaction(
          userId,
          -2,
          "cv_analysis",
          "CV analysis operation"
        );
      }

      // Save analysis result to database (optional)
      // This could be useful for analytics and user history
      // await supabaseService.createCandidate({
      //   user_id: userId,
      //   name: 'Analyzed Candidate',
      //   email: '',
      //   cv_text: cvText,
      //   analysis_result: analysisResult,
      //   score: analysisResult.score,
      // });

      const duration = Date.now() - startTime;
      logPerformance("cv_analysis_complete", duration, {
        userId,
        score: analysisResult.score,
        matchPercentage: analysisResult.matchPercentage,
      });

      res.json({
        success: true,
        data: analysisResult,
        creditsRemaining: user ? user.credits - 2 : 0,
        processingTime: duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(error as Error, {
        operation: "cv_analysis_endpoint",
        userId: req.user!.id,
        duration,
      });

      res.status(500).json({
        success: false,
        error: "CV analysis failed",
        code: "CV_ANALYSIS_ERROR",
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Internal server error",
      });
    }
  }
);

/**
 * Batch CV Analysis Endpoint
 * POST /api/ai/batch-cv-analysis
 */
router.post(
  "/batch-cv-analysis",
  requireCredits(5), // Minimum 5 credits for batch operations
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      const { cvFiles, jobRequirements } = req.body;
      const userId = req.user!.id;

      if (!Array.isArray(cvFiles) || cvFiles.length === 0) {
        res.status(400).json({
          success: false,
          error: "CV files array is required",
          code: "MISSING_CV_FILES",
        });
        return;
      }

      if (cvFiles.length > 5) {
        res.status(400).json({
          success: false,
          error: "Maximum 5 CVs per batch",
          code: "BATCH_SIZE_EXCEEDED",
        });
        return;
      }

      const creditsRequired = cvFiles.length * 2;
      if (req.user!.credits < creditsRequired) {
        res.status(402).json({
          success: false,
          error: "Insufficient credits",
          code: "INSUFFICIENT_CREDITS",
          required: creditsRequired,
          current: req.user!.credits,
        });
        return;
      }

      logger.info("Batch CV analysis requested", {
        userId,
        batchSize: cvFiles.length,
        creditsRequired,
      });

      // Process batch CV analysis
      const results = await aiService.cvAnalysis.batchAnalyze(
        cvFiles,
        jobRequirements,
        userId
      );

      // Deduct credits
      const { data: user } = await supabaseService.getUser(userId);
      if (user) {
        const newCredits = user.credits - creditsRequired;
        await supabaseService.updateUserCredits(userId, newCredits);

        await supabaseService.createCreditTransaction(
          userId,
          -creditsRequired,
          "batch_cv_analysis",
          `Batch CV analysis of ${cvFiles.length} CVs`
        );
      }

      const duration = Date.now() - startTime;
      logPerformance("batch_cv_analysis_complete", duration, {
        userId,
        batchSize: cvFiles.length,
        successCount: results.filter((r) => !r.error).length,
      });

      res.json({
        success: true,
        data: results,
        creditsUsed: creditsRequired,
        creditsRemaining: user ? user.credits - creditsRequired : 0,
        processingTime: duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(error as Error, {
        operation: "batch_cv_analysis_endpoint",
        userId: req.user!.id,
        duration,
      });

      res.status(500).json({
        success: false,
        error: "Batch CV analysis failed",
        code: "BATCH_CV_ANALYSIS_ERROR",
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Internal server error",
      });
    }
  }
);

/**
 * Question Generation Endpoint
 * POST /api/ai/generate-questions
 */
router.post(
  "/generate-questions",
  requireCredits(1), // Question generation costs 1 credit
  ...commonValidations.questionGeneration,
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      const { jobTitle, skills, count, difficulty, type } = req.body;
      const userId = req.user!.id;

      logger.info("Question generation requested", {
        userId,
        jobTitle,
        skillCount: skills.length,
        questionCount: count,
      });

      // Generate questions using AI service
      const questions = await aiService.questions.generate({
        jobTitle,
        skills,
        count,
        difficulty,
        type,
      });

      // Deduct credits
      const { data: user } = await supabaseService.getUser(userId);
      if (user) {
        const newCredits = user.credits - 1;
        await supabaseService.updateUserCredits(userId, newCredits);

        await supabaseService.createCreditTransaction(
          userId,
          -1,
          "generate_questions",
          `Generated ${count} questions for ${jobTitle}`
        );
      }

      const duration = Date.now() - startTime;
      logPerformance("question_generation_complete", duration, {
        userId,
        questionCount: questions.length,
        jobTitle,
      });

      res.json({
        success: true,
        data: questions,
        creditsRemaining: user ? user.credits - 1 : 0,
        processingTime: duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(error as Error, {
        operation: "question_generation_endpoint",
        userId: req.user!.id,
        duration,
      });

      res.status(500).json({
        success: false,
        error: "Question generation failed",
        code: "QUESTION_GENERATION_ERROR",
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Internal server error",
      });
    }
  }
);

/**
 * Interview Analysis Endpoint
 * POST /api/ai/analyze-interview
 */
router.post(
  "/analyze-interview",
  requireCredits(3), // Interview analysis costs 3 credits
  ...commonValidations.interviewAnalysis,
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      const { sessionId, questions, answers } = req.body;
      const userId = req.user!.id;

      logger.info("Interview analysis requested", {
        userId,
        sessionId,
        questionCount: questions.length,
        answerCount: answers.length,
      });

      // Analyze interview using AI service
      const analysisResult = await aiService.interviews.analyze({
        sessionId,
        questions,
        answers,
      });

      // Deduct credits
      const { data: user } = await supabaseService.getUser(userId);
      if (user) {
        const newCredits = user.credits - 3;
        await supabaseService.updateUserCredits(userId, newCredits);

        await supabaseService.createCreditTransaction(
          userId,
          -3,
          "analyze_interview",
          `Interview analysis for session ${sessionId}`
        );
      }

      // Update interview record with analysis results
      await supabaseService.updateInterview(sessionId, {
        analysis_result: analysisResult,
        status: "analyzed",
      });

      const duration = Date.now() - startTime;
      logPerformance("interview_analysis_complete", duration, {
        userId,
        sessionId,
        overallScore: analysisResult.overallScore,
      });

      res.json({
        success: true,
        data: analysisResult,
        creditsRemaining: user ? user.credits - 3 : 0,
        processingTime: duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(error as Error, {
        operation: "interview_analysis_endpoint",
        userId: req.user!.id,
        duration,
      });

      res.status(500).json({
        success: false,
        error: "Interview analysis failed",
        code: "INTERVIEW_ANALYSIS_ERROR",
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Internal server error",
      });
    }
  }
);

/**
 * Job Requirements Generation Endpoint
 * POST /api/ai/generate-job-requirements
 */
router.post(
  "/generate-job-requirements",
  requireCredits(1), // Job requirements generation costs 1 credit
  validateSchema(schemas.jobRequirements),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      const jobInfo = req.body;
      const userId = req.user!.id;

      logger.info("Job requirements generation requested", {
        userId,
        jobTitle: jobInfo.jobTitle,
        department: jobInfo.department,
      });

      // Generate job requirements using AI service
      const requirements = await aiService.jobRequirements.generate(jobInfo);

      // Deduct credits
      const { data: user } = await supabaseService.getUser(userId);
      if (user) {
        const newCredits = user.credits - 1;
        await supabaseService.updateUserCredits(userId, newCredits);

        await supabaseService.createCreditTransaction(
          userId,
          -1,
          "generate_job_requirements",
          `Generated job requirements for ${jobInfo.jobTitle}`
        );
      }

      const duration = Date.now() - startTime;
      logPerformance("job_requirements_generation_complete", duration, {
        userId,
        jobTitle: jobInfo.jobTitle,
      });

      res.json({
        success: true,
        data: requirements,
        creditsRemaining: user ? user.credits - 1 : 0,
        processingTime: duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(error as Error, {
        operation: "job_requirements_generation_endpoint",
        userId: req.user!.id,
        duration,
      });

      res.status(500).json({
        success: false,
        error: "Job requirements generation failed",
        code: "JOB_REQUIREMENTS_ERROR",
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Internal server error",
      });
    }
  }
);

/**
 * AI Service Health Check
 * GET /api/ai/health
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    const healthStatus = await aiService.healthCheck();

    res.json({
      success: true,
      service: "AI Services",
      status: healthStatus.overall ? "healthy" : "unhealthy",
      services: healthStatus.services,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error as Error, { operation: "ai_health_check" });

    res.status(503).json({
      success: false,
      service: "AI Services",
      status: "error",
      error: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get AI Usage Statistics
 * GET /api/ai/stats
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // This would typically fetch from analytics/usage database
    // For now, we'll return basic user credit information
    const { data: user } = await supabaseService.getUser(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        userId,
        currentCredits: user.credits,
        // Add more statistics here as needed
        // totalCVsAnalyzed: 0,
        // totalQuestionsGenerated: 0,
        // totalInterviewsAnalyzed: 0,
        // lastActivity: user.updated_at,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error as Error, {
      operation: "ai_stats_endpoint",
      userId: req.user!.id,
    });

    res.status(500).json({
      success: false,
      error: "Failed to get AI statistics",
      code: "STATS_ERROR",
    });
  }
});

export default router;
