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

    const systemPrompt = `You are an expert interview designer specializing in creating highly relevant and specific interview questions. You understand different industries, job roles, and assessment techniques. Always return valid JSON only.`;

    const userPrompt = this.getQuestionTypePrompt(
      request,
      count,
      jobTitle,
      skills,
      difficulty,
      type
    );

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

  /**
   * Get enhanced prompt based on question type (inspired by Edge Function)
   */
  private getQuestionTypePrompt(
    request: QuestionGenerationRequest,
    count: number,
    jobTitle: string,
    skills: string[],
    difficulty: string,
    type: string
  ): string {
    const basePrompt = `Generate ${count} interview questions for a ${jobTitle} position.

Required Skills: ${skills.join(", ")}
Difficulty Level: ${difficulty}
Question Type: ${type}

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

`;

    const typeSpecificPrompts: Record<string, string> = {
      technical: `Requirements for Technical Questions:
1. Questions should focus on practical technical skills and knowledge
2. Include coding problems, system design, and technical concepts
3. Questions should be appropriate for the job level and required skills
4. Mix of easy, medium, and hard difficulty questions
5. Focus on real-world application of ${skills.join(", ")}
6. Include questions about best practices and industry standards`,

      behavioral: `Requirements for Behavioral Questions:
1. Questions should focus on past behavior and experiences
2. Use STAR method (Situation, Task, Action, Result) format
3. Questions should assess soft skills and work ethic
4. Include questions about teamwork, leadership, and problem-solving
5. Focus on how the candidate handled challenges in previous roles
6. Assess cultural fit and communication skills`,

      situational: `Requirements for Situational Questions:
1. Questions should present hypothetical work scenarios
2. Focus on how the candidate would handle specific situations
3. Include questions about conflict resolution and decision-making
4. Questions should be relevant to the ${jobTitle} role
5. Assess problem-solving approach and critical thinking
6. Include scenarios that test adaptability and stress management`,

      problem_solving: `Requirements for Problem-Solving Questions:
1. Questions should test analytical and problem-solving skills
2. Include both technical and business problem scenarios
3. Questions should assess logical thinking and creativity
4. Mix of structured and open-ended problems
5. Focus on how the candidate approaches complex challenges
6. Include time-sensitive and resource-constrained scenarios`,

      leadership: `Requirements for Leadership Questions:
1. Questions should focus on leadership and management skills
2. Include questions about team management and motivation
3. Questions should assess strategic thinking and vision
4. Include scenarios about leading change and innovation
5. Focus on how the candidate inspires and guides others
6. Assess decision-making in leadership contexts`,

      culture_fit: `Requirements for Culture Fit Questions:
1. Questions should assess alignment with company values
2. Include questions about work style and preferences
3. Questions should evaluate adaptability and growth mindset
4. Focus on long-term career goals and motivations
5. Assess how the candidate handles feedback and learning
6. Include questions about work-life balance and collaboration`,

      mixed: `Requirements for Mixed Questions:
1. Questions should be relevant to the job title and required skills
2. Mix of technical, behavioral, and situational questions
3. Questions should be clear and professional
4. Include questions appropriate for the interview type
5. Balance between assessing technical competence and soft skills
6. Questions should provide comprehensive candidate evaluation`,
    };

    const typePrompt = typeSpecificPrompts[type] || typeSpecificPrompts.mixed;

    return (
      basePrompt +
      typePrompt +
      `

Additional Guidelines:
- Make questions specific to the ${jobTitle} role and required skills
- Ensure questions are clear, unambiguous, and professional
- Provide realistic scoring criteria that can be objectively evaluated
- Questions should be appropriate for the specified difficulty level
- Focus on practical application rather than theoretical knowledge only`
    );
  }
}
