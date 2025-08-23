// Interview Analysis Service - Business Logic Layer

import { InterviewAnalysisRepository } from "@/repositories/interview-analysis.repository.js";
import type {
  InterviewAnalysisRequest,
  InterviewAnalysisResult,
} from "@/types/ai.types.js";

export interface IInterviewAnalysisService {
  analyzeInterview(
    request: InterviewAnalysisRequest
  ): Promise<InterviewAnalysisResult>;
  validateRequest(request: InterviewAnalysisRequest): boolean;
  enrichRequest(request: InterviewAnalysisRequest): InterviewAnalysisRequest;
}

export class InterviewAnalysisService implements IInterviewAnalysisService {
  private repository: InterviewAnalysisRepository;

  constructor() {
    this.repository = new InterviewAnalysisRepository();
  }

  /**
   * Analyze interview responses
   */
  async analyzeInterview(
    request: InterviewAnalysisRequest
  ): Promise<InterviewAnalysisResult> {
    // Validate request
    if (!this.validateRequest(request)) {
      throw new Error("Invalid interview analysis request");
    }

    // Enrich request with defaults
    const enrichedRequest = this.enrichRequest(request);

    try {
      // Analyze interview using repository
      const result = await this.repository.analyzeInterview(enrichedRequest);

      // Validate generated result
      if (!result) {
        throw new Error("No interview analysis was generated");
      }

      // Validate and normalize scores
      if (result.overallScore < 0 || result.overallScore > 100) {
        console.warn(
          `Interview analysis overall score out of range: ${result.overallScore}, normalizing to 0-100`
        );
        result.overallScore = Math.max(0, Math.min(100, result.overallScore));
      }

      // Validate question scores
      if (result.questionScores) {
        result.questionScores.forEach((questionScore, index) => {
          if (questionScore.score < 0 || questionScore.score > 100) {
            console.warn(
              `Question ${index} score out of range: ${questionScore.score}, normalizing to 0-100`
            );
            questionScore.score = Math.max(
              0,
              Math.min(100, questionScore.score)
            );
          }
        });
      }

      // Validate communication skills scores
      if (result.communicationSkills) {
        Object.keys(result.communicationSkills).forEach((key) => {
          const score = (result.communicationSkills as any)[key];
          if (score < 1 || score > 10) {
            console.warn(
              `Communication skill ${key} score out of range: ${score}, normalizing to 1-10`
            );
            (result.communicationSkills as any)[key] = Math.max(
              1,
              Math.min(10, score)
            );
          }
        });
      }

      // Validate technical skills scores
      if (result.technicalSkills) {
        Object.keys(result.technicalSkills).forEach((key) => {
          const score = (result.technicalSkills as any)[key];
          if (score < 1 || score > 10) {
            console.warn(
              `Technical skill ${key} score out of range: ${score}, normalizing to 1-10`
            );
            (result.technicalSkills as any)[key] = Math.max(
              1,
              Math.min(10, score)
            );
          }
        });
      }

      // Validate behavioral indicators scores
      if (result.behavioralIndicators) {
        Object.keys(result.behavioralIndicators).forEach((key) => {
          const score = (result.behavioralIndicators as any)[key];
          if (score < 1 || score > 10) {
            console.warn(
              `Behavioral indicator ${key} score out of range: ${score}, normalizing to 1-10`
            );
            (result.behavioralIndicators as any)[key] = Math.max(
              1,
              Math.min(10, score)
            );
          }
        });
      }

      // Validate time management scores
      if (result.timeManagement) {
        Object.keys(result.timeManagement).forEach((key) => {
          const score = (result.timeManagement as any)[key];
          if (score < 1 || score > 10) {
            console.warn(
              `Time management ${key} score out of range: ${score}, normalizing to 1-10`
            );
            (result.timeManagement as any)[key] = Math.max(
              1,
              Math.min(10, score)
            );
          }
        });
      }

      return result;
    } catch (error) {
      console.error("Interview analysis service error:", error);
      throw error;
    }
  }

  /**
   * Validate the interview analysis request
   */
  validateRequest(request: InterviewAnalysisRequest): boolean {
    if (!request.sessionId || request.sessionId.trim().length === 0) {
      return false;
    }

    if (!request.userId || request.userId.trim().length === 0) {
      return false;
    }

    if (
      !request.questions ||
      !Array.isArray(request.questions) ||
      request.questions.length === 0
    ) {
      return false;
    }

    if (
      !request.answers ||
      !Array.isArray(request.answers) ||
      request.answers.length === 0
    ) {
      return false;
    }

    // Check minimum questions and answers
    if (request.questions.length < 1) {
      return false;
    }

    if (request.answers.length < 1) {
      return false;
    }

    // Validate each question has required fields
    for (const question of request.questions) {
      if (
        !question.id ||
        !question.question ||
        !question.type ||
        !question.difficulty
      ) {
        return false;
      }
    }

    // Validate each answer has required fields
    for (const answer of request.answers) {
      if (
        !answer.questionId ||
        !answer.answer ||
        typeof answer.duration !== "number"
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Enrich request with default values and validation
   */
  enrichRequest(request: InterviewAnalysisRequest): InterviewAnalysisRequest {
    return {
      sessionId: request.sessionId.trim(),
      userId: request.userId.trim(),
      questions: request.questions.map((q) => ({
        id: q.id.trim(),
        question: q.question.trim(),
        type: q.type.trim(),
        difficulty: q.difficulty.trim(),
      })),
      answers: request.answers.map((a) => ({
        questionId: a.questionId.trim(),
        answer: a.answer.trim(),
        duration: Math.max(0, a.duration),
      })),
    };
  }

  /**
   * Get estimated processing time based on request complexity
   */
  getEstimatedProcessingTime(request: InterviewAnalysisRequest): number {
    // Base time: 30 seconds
    let estimatedTime = 30;

    // Add time for complex requests
    if (request.questions.length > 5) estimatedTime += 10;
    if (request.questions.length > 10) estimatedTime += 15;

    // Add time based on total answer duration
    const totalDuration = request.answers.reduce(
      (sum, a) => sum + a.duration,
      0
    );
    if (totalDuration > 300) estimatedTime += 10; // 5+ minutes of answers
    if (totalDuration > 600) estimatedTime += 15; // 10+ minutes of answers

    return estimatedTime;
  }

  /**
   * Extract key insights from interview data
   */
  extractInterviewInsights(request: InterviewAnalysisRequest): {
    questionTypes: Record<string, number>;
    averageAnswerDuration: number;
    totalInterviewTime: number;
    questionDifficulty: Record<string, number>;
  } {
    const questionTypes: Record<string, number> = {};
    const questionDifficulty: Record<string, number> = {};
    let totalDuration = 0;

    // Count question types
    request.questions.forEach((q) => {
      questionTypes[q.type] = (questionTypes[q.type] || 0) + 1;
      questionDifficulty[q.difficulty] =
        (questionDifficulty[q.difficulty] || 0) + 1;
    });

    // Calculate total duration
    totalDuration = request.answers.reduce((sum, a) => sum + a.duration, 0);

    const averageAnswerDuration = totalDuration / request.answers.length;

    return {
      questionTypes,
      averageAnswerDuration,
      totalInterviewTime: totalDuration,
      questionDifficulty,
    };
  }

  /**
   * Generate interview summary statistics
   */
  generateInterviewStats(request: InterviewAnalysisRequest): {
    totalQuestions: number;
    totalAnswers: number;
    averageAnswerLength: number;
    questionTypeDistribution: string;
    difficultyDistribution: string;
  } {
    const totalQuestions = request.questions.length;
    const totalAnswers = request.answers.length;

    // Calculate average answer length
    const totalAnswerLength = request.answers.reduce(
      (sum, a) => sum + a.answer.length,
      0
    );
    const averageAnswerLength =
      totalAnswers > 0 ? Math.round(totalAnswerLength / totalAnswers) : 0;

    // Generate distributions
    const questionTypeCounts = request.questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const difficultyCounts = request.questions.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const questionTypeDistribution = Object.entries(questionTypeCounts)
      .map(([type, count]) => `${type}: ${count}`)
      .join(", ");

    const difficultyDistribution = Object.entries(difficultyCounts)
      .map(([difficulty, count]) => `${difficulty}: ${count}`)
      .join(", ");

    return {
      totalQuestions,
      totalAnswers,
      averageAnswerLength,
      questionTypeDistribution,
      difficultyDistribution,
    };
  }
}
