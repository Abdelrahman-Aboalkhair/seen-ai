// CV Analysis Repository - Data Access Layer

import OpenAI from "openai";
import cacheService from "@/services/cache.service.js";
import logger from "@/lib/logger.js";
import type { CVAnalysisRequest, CVAnalysisResult } from "@/types/ai.types.js";

export class CVAnalysisRepository {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Analyze CV using OpenAI
   */
  async analyzeCV(request: CVAnalysisRequest): Promise<CVAnalysisResult> {
    const startTime = Date.now();

    try {
      // Use CV text directly
      const cvText = request.cvText;

      // Check cache first
      const cached = await cacheService.getCVAnalysis(
        cvText,
        request.jobRequirements,
        request.userId
      );

      if (cached) {
        const duration = Date.now() - startTime;
        logger.info("CV analysis retrieved from cache", {
          userId: request.userId,
          duration,
        });
        return cached;
      }

      // Generate analysis using OpenAI
      const result = await this.generateCVAnalysis(
        cvText,
        request.jobRequirements
      );

      // Cache the result
      await cacheService.setCVAnalysis(
        cvText,
        request.jobRequirements,
        request.userId,
        result
      );

      const duration = Date.now() - startTime;
      logger.info("CV analysis generated successfully", {
        userId: request.userId,
        duration,
      });

      return result;
    } catch (error) {
      logger.error("Failed to analyze CV", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: request.userId,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Generate CV analysis using OpenAI
   */
  private async generateCVAnalysis(
    cvText: string,
    jobRequirements: string
  ): Promise<CVAnalysisResult> {
    const systemPrompt = `You are an expert HR analyst specializing in CV assessment. You have deep knowledge of various industries, job roles, and recruitment best practices. Provide detailed, objective analysis in valid JSON format only.`;

    const userPrompt = `
    Analyze the following CV against the job requirements and provide a comprehensive assessment.

    CV Text:
    ${cvText}

    Job Requirements:
    ${jobRequirements}

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

    Analysis Guidelines:
    1. **Skills Assessment**: Identify technical and soft skills that match the job requirements
    2. **Experience Evaluation**: Assess relevant work experience and career progression
    3. **Education Alignment**: Evaluate educational background and certifications
    4. **Cultural Fit**: Consider communication style, achievements, and work patterns
    5. **Gap Analysis**: Identify areas where the candidate may need development
    6. **Overall Match**: Provide a comprehensive score based on all factors

    Scoring Criteria:
    - 90-100: Exceptional match with all requirements
    - 80-89: Strong match with minor gaps
    - 70-79: Good match with some development areas
    - 60-69: Moderate match with significant gaps
    - Below 60: Limited match, not recommended

    Focus on:
    - Relevant skills and experience alignment
    - Education and certification relevance
    - Career progression and achievements
    - Technical competencies and tools
    - Soft skills and communication indicators
    - Overall fit for the specific role and company
    `;

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

    console.log("🔍 [Repository] OpenAI response content:", {
      contentLength: content.length,
      contentPreview: content.substring(0, 500),
      fullContent: content,
    });

    const result = this.parseJsonResponse<CVAnalysisResult>(content);

    console.log("🔍 [Repository] Parsed result:", {
      resultKeys: Object.keys(result),
      fullResult: JSON.stringify(result, null, 2),
    });

    return result;
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
      logger.error("Failed to parse JSON response", {
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
   * Get cached CV analysis if available
   */
  async getCachedCVAnalysis(
    cvText: string,
    jobRequirements: string,
    userId: string
  ): Promise<CVAnalysisResult | null> {
    try {
      return await cacheService.getCVAnalysis(cvText, jobRequirements, userId);
    } catch (error) {
      logger.error("Failed to get cached CV analysis", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });
      return null;
    }
  }

  /**
   * Cache CV analysis result
   */
  async cacheCVAnalysis(
    cvText: string,
    jobRequirements: string,
    userId: string,
    result: CVAnalysisResult
  ): Promise<void> {
    try {
      await cacheService.setCVAnalysis(cvText, jobRequirements, userId, result);
      logger.info("CV analysis cached successfully", { userId });
    } catch (error) {
      logger.error("Failed to cache CV analysis", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });
      // Don't throw - caching failure shouldn't break the main flow
    }
  }
}
