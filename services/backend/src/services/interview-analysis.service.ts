// Interview Analysis Service - Business Logic Layer

import OpenAI from "openai";
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
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
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
      // Generate analysis using OpenAI
      const result = await this.generateInterviewAnalysis(enrichedRequest);

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

      return result;
    } catch (error) {
      console.error("Failed to analyze interview:", error);
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
      "weaknesses": string[]
    }

    Analysis Guidelines:
    1. **Response Quality**: Evaluate clarity, completeness, and relevance
    2. **Behavioral Indicators**: Identify positive and negative behavioral patterns
    3. **Communication Skills**: Assess verbal communication effectiveness
    4. **Problem-Solving**: Evaluate analytical thinking and solution approach
    5. **Cultural Fit**: Consider alignment with company values and culture
    6. **Overall Assessment**: Provide comprehensive evaluation and recommendations

    Scoring Criteria:
    - 90-100: Exceptional responses with strong examples and clear reasoning
    - 80-89: Strong responses with good examples and logical thinking
    - 70-79: Good responses with adequate examples and reasonable logic
    - 60-69: Adequate responses with some gaps in examples or reasoning
    - Below 60: Weak responses with significant gaps or poor examples

    Please ensure the response is valid JSON without any markdown formatting or additional text.`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return this.parseJsonResponse<InterviewAnalysisResult>(content);
  }

  /**
   * Parse JSON response from OpenAI
   */
  private parseJsonResponse<T>(content: string): T {
    try {
      // Strip markdown code blocks if present
      const cleanContent = content.replace(/```json\s*|\s*```/g, "").trim();
      return JSON.parse(cleanContent) as T;
    } catch (error) {
      console.error("Failed to parse JSON response:", {
        error: error instanceof Error ? error.message : "Unknown error",
        content: content.substring(0, 200),
      });
      throw new Error(
        `Failed to parse OpenAI response: ${
          error instanceof Error ? error.message : "Invalid JSON"
        }`
      );
    }
  }

  /**
   * Calculate total duration of all answers
   */
  private calculateTotalDuration(answers: { duration: number }[]): number {
    return answers.reduce((sum, a) => sum + a.duration, 0);
  }

  /**
   * Format questions and answers for prompt
   */
  private formatQuestionsAndAnswers(
    questions: { id: string; question: string }[],
    answers: { questionId: string; answer: string }[]
  ): string {
    const questionMap = new Map(questions.map((q) => [q.id, q.question]));
    return answers
      .map((a) => {
        const question = questionMap.get(a.questionId);
        return `Question: ${question}\nAnswer: ${a.answer}\n`;
      })
      .join("\n");
  }
}
