import { Router, Request, Response } from "express";
import logger from "@/lib/logger.js";

const router = Router();

/**
 * Simple Test Endpoint
 * GET /api/test/ping
 */
router.get("/ping", (req: Request, res: Response): void => {
  logger.info("Test ping endpoint called");

  res.json({
    success: true,
    message: "Pong! Backend is working",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Simplified Question Generation Test
 * POST /api/test/generate-questions
 */
router.post(
  "/generate-questions",
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      const { jobTitle, skills, count = 5 } = req.body;

      logger.info("Test question generation requested", {
        jobTitle,
        skills,
        count,
      });

      // Simple mock questions without OpenAI dependency
      const mockQuestions = [
        {
          id: "1",
          question: `What experience do you have with ${
            skills?.[0] || "the main technologies"
          } in a ${jobTitle || "similar"} role?`,
          type: "behavioral",
          difficulty: "medium",
          expectedAnswer:
            "Candidate should provide specific examples of their experience.",
          scoringCriteria: [
            "Relevant experience",
            "Specific examples",
            "Clear communication",
          ],
        },
        {
          id: "2",
          question: `Can you explain a challenging problem you solved using ${
            skills?.[1] || "technology"
          }?`,
          type: "technical",
          difficulty: "medium",
          expectedAnswer: "Candidate should describe problem-solving approach.",
          scoringCriteria: [
            "Problem identification",
            "Solution approach",
            "Technical depth",
          ],
        },
        {
          id: "3",
          question: `How do you stay updated with the latest trends in ${
            jobTitle || "your field"
          }?`,
          type: "behavioral",
          difficulty: "easy",
          expectedAnswer:
            "Candidate should show commitment to continuous learning.",
          scoringCriteria: [
            "Learning methods",
            "Industry awareness",
            "Professional growth",
          ],
        },
        {
          id: "4",
          question: `Describe your experience working in a team environment.`,
          type: "behavioral",
          difficulty: "easy",
          expectedAnswer: "Candidate should demonstrate teamwork skills.",
          scoringCriteria: [
            "Collaboration",
            "Communication",
            "Conflict resolution",
          ],
        },
        {
          id: "5",
          question: `What interests you most about this ${
            jobTitle || "position"
          }?`,
          type: "behavioral",
          difficulty: "easy",
          expectedAnswer:
            "Candidate should show genuine interest and research.",
          scoringCriteria: [
            "Company knowledge",
            "Role understanding",
            "Motivation",
          ],
        },
      ];

      // Return only the requested number of questions
      const questions = mockQuestions.slice(0, Math.min(count, 5));

      const duration = Date.now() - startTime;

      logger.info("Test questions generated successfully", {
        jobTitle,
        questionCount: questions.length,
        duration,
      });

      res.json({
        success: true,
        data: questions,
        processingTime: duration,
        message:
          "Mock questions generated successfully (OpenAI integration disabled for testing)",
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Test question generation failed", {
        error: (error as Error).message,
        duration,
      });

      res.status(500).json({
        success: false,
        error: "Question generation failed",
        code: "QUESTION_GENERATION_ERROR",
        message: (error as Error).message,
      });
    }
  }
);

/**
 * Health Check Endpoint
 * GET /api/test/health
 */
router.get("/health", (req: Request, res: Response): void => {
  const healthCheck = {
    success: true,
    message: "Hello World! Server is healthy and running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    status: "OK"
  };

  logger.info("Health check endpoint called", healthCheck);
  
  res.status(200).json(healthCheck);
});

/**
 * Config Test Endpoint
 * GET /api/test/config
 */
router.get("/config", (req: Request, res: Response): void => {
  try {
    // Test if config is accessible
    res.json({
      success: true,
      message: "Config is accessible",
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSupabase: !!process.env.SUPABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Config test failed",
      message: (error as Error).message,
    });
  }
});

export default router;
