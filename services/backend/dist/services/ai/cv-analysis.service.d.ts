import { BaseAIService } from "./base-ai.service.js";
import type { CVAnalysisRequest, CVAnalysisResult, BatchCVAnalysisItem, BatchCVAnalysisResult } from "@/types/ai.types.js";
export declare class CVAnalysisService extends BaseAIService {
    analyzeCV(request: CVAnalysisRequest): Promise<CVAnalysisResult>;
    private generateCVAnalysis;
    batchAnalyzeCVs(cvFiles: BatchCVAnalysisItem[], jobRequirements: string, userId: string): Promise<BatchCVAnalysisResult[]>;
}
//# sourceMappingURL=cv-analysis.service.d.ts.map