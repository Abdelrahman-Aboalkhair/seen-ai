export declare class AIService {
    private cvAnalysisService;
    private questionGenerationService;
    private interviewAnalysisService;
    private jobRequirementsService;
    constructor();
    get cvAnalysis(): {
        analyze: (request: import("../../types/ai.types.js").CVAnalysisRequest) => Promise<import("../../types/ai.types.js").CVAnalysisResult>;
        batchAnalyze: (cvFiles: import("../../types/ai.types.js").BatchCVAnalysisItem[], jobRequirements: string, userId: string) => Promise<import("../../types/ai.types.js").BatchCVAnalysisResult[]>;
    };
    get questions(): {
        generate: (request: import("../../types/ai.types.js").QuestionGenerationRequest) => Promise<import("../../types/ai.types.js").Question[]>;
        generateByDifficulty: (jobTitle: string, skills: string[], easyCount?: number, mediumCount?: number, hardCount?: number) => Promise<{
            easy: import("../../types/ai.types.js").Question[];
            medium: import("../../types/ai.types.js").Question[];
            hard: import("../../types/ai.types.js").Question[];
        }>;
        generateByType: (jobTitle: string, skills: string[], technicalCount?: number, behavioralCount?: number) => Promise<{
            technical: import("../../types/ai.types.js").Question[];
            behavioral: import("../../types/ai.types.js").Question[];
        }>;
    };
    get interviews(): {
        analyze: (request: import("../../types/ai.types.js").InterviewAnalysisRequest) => Promise<import("../../types/ai.types.js").InterviewAnalysisResult>;
        analyzeQuestion: (questionId: string, question: string, answer: string, expectedAnswer?: string) => Promise<{
            score: number;
            feedback: string;
            strengths: string[];
            improvements: string[];
        }>;
        generateSummary: (candidateName: string, position: string, overallScore: number, strengths: string[], weaknesses: string[], recommendations: string[]) => Promise<string>;
    };
    get jobRequirements(): {
        generate: (request: import("../../types/ai.types.js").JobRequirementsRequest) => Promise<import("../../types/ai.types.js").JobRequirementsResult>;
        generateMultiple: (requests: import("../../types/ai.types.js").JobRequirementsRequest[]) => Promise<import("../../types/ai.types.js").JobRequirementsResult[]>;
        generateFocused: (request: import("../../types/ai.types.js").JobRequirementsRequest, focus: "technical" | "leadership" | "creative" | "sales") => Promise<import("../../types/ai.types.js").JobRequirementsResult>;
        update: (existingRequirements: import("../../types/ai.types.js").JobRequirementsResult, updates: Partial<import("../../types/ai.types.js").JobRequirementsRequest>) => Promise<import("../../types/ai.types.js").JobRequirementsResult>;
    };
    healthCheck(): Promise<{
        overall: boolean;
        services: {
            cvAnalysis: boolean;
            questionGeneration: boolean;
            interviewAnalysis: boolean;
            jobRequirements: boolean;
        };
    }>;
    getServiceStats(): Promise<{
        uptime: number;
        services: string[];
        healthStatus: any;
    }>;
}
declare const aiService: AIService;
export default aiService;
//# sourceMappingURL=ai.service.d.ts.map