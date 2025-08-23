// Job Requirements Generation Repository - Data Access Layer

import { BaseAIService } from "@/services/ai/base-ai.service.js";
import cacheService from "@/services/cache.service.js";
import logger from "@/lib/logger.js";
import type { JobRequirementsRequest, JobRequirementsResult } from "@/types/ai.types.js";

export class JobRequirementsRepository {
  private aiService: BaseAIService;

  constructor() {
    this.aiService = new BaseAIService();
  }

  /**
   * Generate job requirements using OpenAI
   */
  async generateJobRequirements(request: JobRequirementsRequest): Promise<JobRequirementsResult> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cached = await cacheService.getJobRequirements(
        request.jobTitle,
        request.industry,
        request.seniority,
        request.userId
      );

      if (cached) {
        const duration = Date.now() - startTime;
        logger.info("Job requirements retrieved from cache", {
          userId: request.userId,
          duration,
        });
        return cached;
      }

      // Generate job requirements using OpenAI
      const result = await this.aiService.withRetry(
        () => this.generateJobRequirementsWithAI(request),
        "job_requirements"
      );

      // Cache the result
      await cacheService.setJobRequirements(
        request.jobTitle,
        request.industry,
        request.seniority,
        request.userId,
        result
      );

      const duration = Date.now() - startTime;
      logger.info("Job requirements generated successfully", {
        userId: request.userId,
        duration,
      });

      return result;
    } catch (error) {
      logger.error("Failed to generate job requirements", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: request.userId,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Generate job requirements using OpenAI
   */
  private async generateJobRequirementsWithAI(
    request: JobRequirementsRequest
  ): Promise<JobRequirementsResult> {
    const systemPrompt = `You are an expert HR professional and job description writer specializing in creating comprehensive, detailed job requirements and descriptions. You understand various industries, job roles, and recruitment best practices. Always return valid JSON format only.`;

    const userPrompt = `
    Generate comprehensive job requirements and description for the following position:

    Job Title: ${request.jobTitle}
    Industry: ${request.industry || 'Technology'}
    Seniority Level: ${request.seniority || 'Mid-level'}
    Company Size: ${request.companySize || 'Medium to Large'}
    Location: ${request.location || 'Remote/Hybrid'}

    Please provide a detailed job description in the following JSON format:
    {
      "jobTitle": string,
      "summary": string,
      "keyResponsibilities": string[],
      "requiredSkills": {
        "technical": string[],
        "soft": string[],
        "certifications": string[]
      },
      "preferredSkills": {
        "technical": string[],
        "soft": string[],
        "certifications": string[]
      },
      "experience": {
        "minimumYears": number,
        "preferredYears": number,
        "relevantExperience": string[]
      },
      "education": {
        "minimum": string,
        "preferred": string,
        "relevantFields": string[]
      },
      "qualifications": {
        "essential": string[],
        "desired": string[]
      },
      "benefits": string[],
      "workEnvironment": string,
      "careerGrowth": string,
      "salaryRange": {
        "min": number,
        "max": number,
        "currency": string
      },
      "employmentType": string,
      "location": string,
      "remotePolicy": string
    }

    Guidelines for Generation:
    1. **Job Summary**: Create a compelling 2-3 sentence overview that attracts qualified candidates
    2. **Responsibilities**: List 6-8 key responsibilities that clearly define the role
    3. **Skills**: Distinguish between required and preferred skills realistically
    4. **Experience**: Set appropriate experience levels based on seniority
    5. **Education**: Consider industry standards and role requirements
    6. **Benefits**: Include competitive benefits that attract top talent
    7. **Work Environment**: Describe the company culture and work style
    8. **Career Growth**: Outline advancement opportunities
    9. **Salary Range**: Provide realistic market-based ranges
    10. **Remote Policy**: Specify work arrangement preferences

    Focus on:
    - Creating realistic and achievable requirements
    - Balancing technical and soft skills
    - Providing clear career progression paths
    - Including competitive compensation details
    - Making the role attractive to qualified candidates
    - Following industry best practices for the specified seniority level
    `;

    const content = await this.aiService.generateCompletion(
      systemPrompt,
      userPrompt,
      {
        temperature: 0.4,
        maxTokens: 3000,
      }
    );

    return this.aiService.parseJsonResponse<JobRequirementsResult>(
      content,
      "job_requirements"
    );
  }

  /**
   * Get cached job requirements if available
   */
  async getCachedJobRequirements(
    jobTitle: string,
    industry: string,
    seniority: string,
    userId: string
  ): Promise<JobRequirementsResult | null> {
    try {
      return await cacheService.getJobRequirements(jobTitle, industry, seniority, userId);
    } catch (error) {
      logger.error("Failed to get cached job requirements", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });
      return null;
    }
  }

  /**
   * Cache job requirements result
   */
  async cacheJobRequirements(
    jobTitle: string,
    industry: string,
    seniority: string,
    userId: string,
    result: JobRequirementsResult
  ): Promise<void> {
    try {
      await cacheService.setJobRequirements(jobTitle, industry, seniority, userId, result);
      logger.info("Job requirements cached successfully", { userId });
    } catch (error) {
      logger.error("Failed to cache job requirements", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });
      // Don't throw - caching failure shouldn't break the main flow
    }
  }
}
