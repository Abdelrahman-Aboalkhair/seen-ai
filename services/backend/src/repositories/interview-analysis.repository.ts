// Interview Analysis Repository - Data Access Layer

import { BaseAIService } from "@/services/ai/base-ai.service.js";
import cacheService from "@/services/cache.service.js";
import logger from "@/lib/logger.js";
import type {
  InterviewAnalysisRequest,
  InterviewAnalysisResult,
} from "@/types/ai.types.js";

export class InterviewAnalysisRepository {
  private aiService: BaseAIService;

  constructor() {
    this.aiService = new BaseAIService();
  }

  /**
   * Analyze interview responses using OpenAI
   */
  async analyzeInterview(
    request: InterviewAnalysisRequest
  ): Promise<InterviewAnalysisResult> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cached = await cacheService.getInterviewAnalysis(
        request.sessionId,
        request.userId
      );

      if (cached) {
        const duration = Date.now() - startTime;
        logger.info("Interview analysis retrieved from cache", {
          userId: request.userId,
          sessionId: request.sessionId,
          duration,
        });
        return cached;
      }

      // Generate analysis using OpenAI
      const result = await this.aiService.withRetry(
        () => this.generateInterviewAnalysis(request),
        "interview_analysis"
      );

      // Cache the result
      await cacheService.setInterviewAnalysis(
        request.sessionId,
        request.userId,
        result
      );

      const duration = Date.now() - startTime;
      logger.info("Interview analysis generated successfully", {
        userId: request.userId,
        sessionId: request.sessionId,
        duration,
      });

      return result;
    } catch (error) {
      logger.error("Failed to analyze interview", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: request.userId,
        sessionId: request.sessionId,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Generate interview analysis using OpenAI
   */
  private async generateInterviewAnalysis(
    request: InterviewAnalysisRequest
  ): Promise<InterviewAnalysisResult> {
    const systemPrompt = `You are an expert HR professional and interview evaluator specializing in analyzing candidate responses and providing comprehensive feedback. You understand various assessment techniques, behavioral indicators, and evaluation criteria. Always return valid JSON format only.`;

    const userPrompt = `
    Analyze the following interview responses and provide a comprehensive assessment:

    Interview Session ID: ${request.sessionId}
    Questions Asked: ${request.questions.length}
    Total Duration: ${this.calculateTotalDuration(request.answers)} seconds

    Questions and Answers:
    ${this.formatQuestionsAndAnswers(request.questions, request.answers)}

    Please provide a detailed analysis in the following JSON format:
    {
      "overallScore": number (0-100),
      "questionScores": [
        {
          "questionId": string,
          "score": number (0-100),
          "feedback": string,
          "strengths": string[],
          "improvements": string[]
        }
      ],
      "summary": string,
      "recommendations": string[],
      "strengths": string[],
      "weaknesses": string[],
      "communicationSkills": {
        "clarity": number (1-10),
        "confidence": number (1-10),
        "articulation": number (1-10),
        "examples": number (1-10)
      },
      "technicalSkills": {
        "knowledge": number (1-10),
        "problemSolving": number (1-10),
        "practicalApplication": number (1-10)
      },
      "behavioralIndicators": {
        "teamwork": number (1-10),
        "leadership": number (1-10),
        "adaptability": number (1-10),
        "initiative": number (1-10)
      },
      "timeManagement": {
        "responseLength": number (1-10),
        "efficiency": number (1-10),
        "completeness": number (1-10)
      },
      "overallAssessment": string,
      "recommendation": "strong_hire" | "consider" | "do_not_hire"
    }

    Analysis Guidelines:
    1. **Question Scoring**: Evaluate each response individually based on relevance, completeness, and quality
    2. **Overall Assessment**: Consider the candidate's performance across all questions
    3. **Communication Skills**: Assess clarity, confidence, and ability to articulate thoughts
    4. **Technical Skills**: Evaluate knowledge depth and practical application
    5. **Behavioral Indicators**: Assess soft skills and cultural fit
    6. **Time Management**: Consider response efficiency and completeness
    7. **Strengths & Weaknesses**: Identify key areas of excellence and improvement
    8. **Recommendations**: Provide actionable feedback for improvement

    Scoring Criteria:
    - 90-100: Exceptional performance with outstanding responses
    - 80-89: Strong performance with minor areas for improvement
    - 70-79: Good performance with some development areas
    - 60-69: Adequate performance with significant improvement needed
    - Below 60: Poor performance requiring substantial development

    Focus on:
    - Quality and relevance of responses
    - Use of specific examples and experiences
    - Communication clarity and confidence
    - Technical knowledge and problem-solving approach
    - Behavioral indicators and cultural fit
    - Overall interview performance and potential
    `;

    const content = await this.aiService.generateCompletion(
      systemPrompt,
      userPrompt,
      {
        temperature: 0.3,
        maxTokens: 3500,
      }
    );

    return this.aiService.parseJsonResponse<InterviewAnalysisResult>(
      content,
      "interview_analysis"
    );
  }

  /**
   * Calculate total duration of all answers
   */
  private calculateTotalDuration(answers: Array<{ duration: number }>): number {
    return answers.reduce((total, answer) => total + answer.duration, 0);
  }

  /**
   * Format questions and answers for analysis
   */
  private formatQuestionsAndAnswers(
    questions: Array<{
      id: string;
      question: string;
      type: string;
      difficulty: string;
    }>,
    answers: Array<{ questionId: string; answer: string; duration: number }>
  ): string {
    return questions
      .map((q, index) => {
        const answer = answers.find((a) => a.questionId === q.id);
        return `
Question ${index + 1} (${q.type}, ${q.difficulty}):
"${q.question}"

Answer (${answer?.duration || 0} seconds):
"${answer?.answer || "No answer provided"}"

---`;
      })
      .join("\n");
  }

  /**
   * Get cached interview analysis if available
   */
  async getCachedInterviewAnalysis(
    sessionId: string,
    userId: string
  ): Promise<InterviewAnalysisResult | null> {
    try {
      return await cacheService.getInterviewAnalysis(sessionId, userId);
    } catch (error) {
      logger.error("Failed to get cached interview analysis", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
        sessionId,
      });
      return null;
    }
  }

  /**
   * Cache interview analysis result
   */
  async cacheInterviewAnalysis(
    sessionId: string,
    userId: string,
    result: InterviewAnalysisResult
  ): Promise<void> {
    try {
      await cacheService.setInterviewAnalysis(sessionId, userId, result);
      logger.info("Interview analysis cached successfully", {
        userId,
        sessionId,
      });
    } catch (error) {
      logger.error("Failed to cache interview analysis", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
        sessionId,
      });
      // Don't throw - caching failure shouldn't break the main flow
    }
  }
}
