import crypto from "crypto";
import { BaseAIService } from "./base-ai.service.js";
import cacheService from "@/services/cache.service.js";
import { logPerformance } from "@/lib/logger.js";
export class QuestionGenerationService extends BaseAIService {
    async generateQuestions(request) {
        const startTime = Date.now();
        try {
            const cached = await cacheService.getQuestions(request.jobTitle, request.skills, request.count);
            if (cached) {
                const duration = Date.now() - startTime;
                logPerformance("questions_cached", duration, {
                    jobTitle: request.jobTitle,
                });
                return cached;
            }
            const result = await this.withRetry(() => this.generateInterviewQuestions(request), "generate_questions");
            await cacheService.setQuestions(request.jobTitle, request.skills, request.count, result);
            const duration = Date.now() - startTime;
            logPerformance("questions_generated", duration, {
                jobTitle: request.jobTitle,
                count: request.count,
            });
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async generateInterviewQuestions(request) {
        const { jobTitle, skills, count, difficulty = "medium", type = "mixed", } = request;
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
        const questions = this.parseJsonResponse(content, "questions");
        return questions.map((q, index) => ({
            ...q,
            id: q.id || crypto.randomUUID(),
        }));
    }
    async generateQuestionsByDifficulty(jobTitle, skills, easyCount = 0, mediumCount = 0, hardCount = 0) {
        const results = await Promise.all([
            easyCount > 0
                ? this.generateQuestions({
                    jobTitle,
                    skills,
                    count: easyCount,
                    difficulty: "easy",
                })
                : Promise.resolve([]),
            mediumCount > 0
                ? this.generateQuestions({
                    jobTitle,
                    skills,
                    count: mediumCount,
                    difficulty: "medium",
                })
                : Promise.resolve([]),
            hardCount > 0
                ? this.generateQuestions({
                    jobTitle,
                    skills,
                    count: hardCount,
                    difficulty: "hard",
                })
                : Promise.resolve([]),
        ]);
        return {
            easy: results[0],
            medium: results[1],
            hard: results[2],
        };
    }
    async generateQuestionsByType(jobTitle, skills, technicalCount = 0, behavioralCount = 0) {
        const results = await Promise.all([
            technicalCount > 0
                ? this.generateQuestions({
                    jobTitle,
                    skills,
                    count: technicalCount,
                    type: "technical",
                })
                : Promise.resolve([]),
            behavioralCount > 0
                ? this.generateQuestions({
                    jobTitle,
                    skills,
                    count: behavioralCount,
                    type: "behavioral",
                })
                : Promise.resolve([]),
        ]);
        return {
            technical: results[0],
            behavioral: results[1],
        };
    }
}
//# sourceMappingURL=question-generation.service.js.map