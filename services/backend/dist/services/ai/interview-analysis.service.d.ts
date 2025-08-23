import { BaseAIService } from './base-ai.service.js';
import type { InterviewAnalysisRequest, InterviewAnalysisResult } from '@/types/ai.types.js';
export declare class InterviewAnalysisService extends BaseAIService {
    analyzeInterviewResults(request: InterviewAnalysisRequest): Promise<InterviewAnalysisResult>;
    private generateInterviewAnalysis;
    analyzeQuestionPerformance(questionId: string, question: string, answer: string, expectedAnswer?: string): Promise<{
        score: number;
        feedback: string;
        strengths: string[];
        improvements: string[];
    }>;
    generateInterviewSummary(candidateName: string, position: string, overallScore: number, strengths: string[], weaknesses: string[], recommendations: string[]): Promise<string>;
}
//# sourceMappingURL=interview-analysis.service.d.ts.map