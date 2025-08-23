import { BaseAIService } from "./base-ai.service.js";
import cacheService from "@/services/cache.service.js";
import logger, { logPerformance } from "@/lib/logger.js";
export class CVAnalysisService extends BaseAIService {
    async analyzeCV(request) {
        const startTime = Date.now();
        try {
            const cached = await cacheService.getCVAnalysis(request.cvText, request.jobRequirements, request.userId);
            if (cached) {
                const duration = Date.now() - startTime;
                logPerformance("cv_analysis_cached", duration, {
                    userId: request.userId,
                });
                return cached;
            }
            const result = await this.withRetry(() => this.generateCVAnalysis(request), "cv_analysis");
            await cacheService.setCVAnalysis(request.cvText, request.jobRequirements, request.userId, result);
            const duration = Date.now() - startTime;
            logPerformance("cv_analysis_generated", duration, {
                userId: request.userId,
            });
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async generateCVAnalysis(request) {
        const systemPrompt = `You are an expert HR analyst specializing in CV assessment. Provide detailed, objective analysis in valid JSON format only.`;
        const userPrompt = `
    Analyze the following CV against the job requirements and provide a comprehensive assessment.

    CV Text:
    ${request.cvText}

    Job Requirements:
    ${request.jobRequirements}

    Please provide a detailed analysis in the following JSON format:
    {
      "score": number (0-100),
      "strengths": string[],
      "weaknesses": string[],
      "recommendations": string[],
      "keySkills": string[],
      "experience": {
        "years": number,
        "relevantExperience": string[]
      },
      "education": {
        "degree": string,
        "relevantCourses": string[]
      },
      "summary": string,
      "matchPercentage": number (0-100)
    }

    Focus on:
    1. Relevant skills and experience
    2. Education alignment
    3. Career progression
    4. Technical competencies
    5. Soft skills indicators
    6. Overall fit for the role
    `;
        const content = await this.generateCompletion(systemPrompt, userPrompt, {
            temperature: 0.3,
            maxTokens: 2000,
        });
        return this.parseJsonResponse(content, "cv_analysis");
    }
    async batchAnalyzeCVs(cvFiles, jobRequirements, userId) {
        const startTime = Date.now();
        const batchSize = Math.min(cvFiles.length, 5);
        const results = [];
        logger.info("Starting batch CV analysis", {
            count: cvFiles.length,
            batchSize,
            userId,
        });
        for (let i = 0; i < cvFiles.length; i += batchSize) {
            const batch = cvFiles.slice(i, i + batchSize);
            const batchPromises = batch.map(async ({ cvText, candidateId }) => {
                try {
                    const result = await this.analyzeCV({
                        cvText,
                        jobRequirements,
                        userId,
                    });
                    return { candidateId, result };
                }
                catch (error) {
                    return {
                        candidateId,
                        result: {
                            score: 0,
                            strengths: [],
                            weaknesses: [],
                            recommendations: [],
                            keySkills: [],
                            experience: { years: 0, relevantExperience: [] },
                            education: { degree: "", relevantCourses: [] },
                            summary: "",
                            matchPercentage: 0,
                        },
                        error: error.message,
                    };
                }
            });
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            if (i + batchSize < cvFiles.length) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
        const duration = Date.now() - startTime;
        logPerformance("batch_cv_analysis", duration, {
            count: cvFiles.length,
            successCount: results.filter((r) => !r.error).length,
            userId,
        });
        return results;
    }
}
//# sourceMappingURL=cv-analysis.service.js.map