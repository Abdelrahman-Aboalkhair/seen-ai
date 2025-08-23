import { BaseAIService } from "./base-ai.service.js";
import type { QuestionGenerationRequest, Question } from "@/types/ai.types.js";
export declare class QuestionGenerationService extends BaseAIService {
    generateQuestions(request: QuestionGenerationRequest): Promise<Question[]>;
    private generateInterviewQuestions;
    generateQuestionsByDifficulty(jobTitle: string, skills: string[], easyCount?: number, mediumCount?: number, hardCount?: number): Promise<{
        easy: Question[];
        medium: Question[];
        hard: Question[];
    }>;
    generateQuestionsByType(jobTitle: string, skills: string[], technicalCount?: number, behavioralCount?: number): Promise<{
        technical: Question[];
        behavioral: Question[];
    }>;
}
//# sourceMappingURL=question-generation.service.d.ts.map