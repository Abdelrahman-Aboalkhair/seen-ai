import crypto from "crypto";
import { BaseAIService } from "./base-ai.service.js";
import cacheService from "@/services/cache.service.js";
import logger, { logPerformance } from "@/lib/logger.js";
import type { QuestionGenerationRequest, Question } from "@/types/ai.types.js";

export class QuestionGenerationService extends BaseAIService {
  // Generate questions with caching
  async generateQuestions(
    request: QuestionGenerationRequest
  ): Promise<Question[]> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cached = await cacheService.getQuestions(
        request.jobTitle,
        request.skills,
        request.count
      );

      if (cached) {
        const duration = Date.now() - startTime;
        logPerformance("questions_cached", duration, {
          jobTitle: request.jobTitle,
        });
        return cached;
      }

      // Generate questions using OpenAI
      const result = await this.withRetry(
        () => this.generateInterviewQuestions(request),
        "generate_questions"
      );

      // Cache the result
      await cacheService.setQuestions(
        request.jobTitle,
        request.skills,
        request.count,
        result
      );

      const duration = Date.now() - startTime;
      logPerformance("questions_generated", duration, {
        jobTitle: request.jobTitle,
        count: request.count,
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Generate interview questions using OpenAI
  private async generateInterviewQuestions(
    request: QuestionGenerationRequest
  ): Promise<Question[]> {
    const {
      jobTitle,
      skills,
      count,
      difficulty = "medium",
      type = "mixed",
    } = request;

    const systemPrompt = `You are an expert interview designer. Create engaging, relevant questions that effectively assess candidates. Return valid JSON only.`;

    const userPrompt = `
    Generate ${count} interview questions for a ${jobTitle} position.
    
    Required skills: ${skills.join(", ")}
    Difficulty level: ${difficulty}
    Question type: ${type}

    Please provide questions in the following JSON format:
    [
      {
        "id": "unique_id",
        "question": "question text",
        "type": "technical" | "behavioral",
        "difficulty": "easy" | "medium" | "hard",
        "expectedAnswer": "brief expected answer",
        "scoringCriteria": ["criteria1", "criteria2"]
      }
    ]

    Guidelines:
    - For technical questions, focus on practical skills and problem-solving
    - For behavioral questions, focus on soft skills and cultural fit
    - Make questions specific to the role and required skills
    - Ensure questions are clear and unambiguous
    - Provide realistic scoring criteria
    `;

    const content = await this.generateCompletion(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 1500,
    });

    const questions = this.parseJsonResponse<Question[]>(content, "questions");

    // Add unique IDs if not provided
    return questions.map((q, index) => ({
      ...q,
      id: q.id || crypto.randomUUID(),
    }));
  }

  // Generate questions for specific difficulty levels
  async generateQuestionsByDifficulty(
    jobTitle: string,
    skills: string[],
    easyCount: number = 0,
    mediumCount: number = 0,
    hardCount: number = 0
  ): Promise<{
    easy: Question[];
    medium: Question[];
    hard: Question[];
  }> {
    const results = await Promise.all([
      easyCount > 0
        ? this.generateQuestions({
            jobTitle,
            skills,
            count: easyCount,
            difficulty: "easy",
          })
        : Promise.resolve([] as Question[]),
      mediumCount > 0
        ? this.generateQuestions({
            jobTitle,
            skills,
            count: mediumCount,
            difficulty: "medium",
          })
        : Promise.resolve([] as Question[]),
      hardCount > 0
        ? this.generateQuestions({
            jobTitle,
            skills,
            count: hardCount,
            difficulty: "hard",
          })
        : Promise.resolve([] as Question[]),
    ]);

    return {
      easy: results[0],
      medium: results[1],
      hard: results[2],
    };
  }

  // Generate questions by type
  async generateQuestionsByType(
    jobTitle: string,
    skills: string[],
    technicalCount: number = 0,
    behavioralCount: number = 0
  ): Promise<{
    technical: Question[];
    behavioral: Question[];
  }> {
    const results = await Promise.all([
      technicalCount > 0
        ? this.generateQuestions({
            jobTitle,
            skills,
            count: technicalCount,
            type: "technical",
          })
        : Promise.resolve([] as Question[]),
      behavioralCount > 0
        ? this.generateQuestions({
            jobTitle,
            skills,
            count: behavioralCount,
            type: "behavioral",
          })
        : Promise.resolve([] as Question[]),
    ]);

    return {
      technical: results[0],
      behavioral: results[1],
    };
  }
}
