// CV Analysis Service - Business Logic Layer

import { CVAnalysisRepository } from "@/repositories/cv-analysis.repository.js";
import type { CVAnalysisRequest, CVAnalysisResult } from "@/types/ai.types.js";

export interface ICVAnalysisService {
  analyzeCV(request: CVAnalysisRequest): Promise<CVAnalysisResult>;
  validateRequest(request: CVAnalysisRequest): boolean;
  enrichRequest(request: CVAnalysisRequest): CVAnalysisRequest;
}

export class CVAnalysisService implements ICVAnalysisService {
  private repository: CVAnalysisRepository;

  constructor() {
    this.repository = new CVAnalysisRepository();
  }

  /**
   * Analyze CV
   */
  async analyzeCV(request: CVAnalysisRequest): Promise<CVAnalysisResult> {
    // Validate request
    if (!this.validateRequest(request)) {
      throw new Error("Invalid CV analysis request");
    }

    // Enrich request with defaults
    const enrichedRequest = this.enrichRequest(request);

    try {
      // Analyze CV using repository
      const result = await this.repository.analyzeCV(enrichedRequest);

      // Validate generated result
      if (!result) {
        throw new Error("No CV analysis was generated");
      }

      // Validate score ranges
      if (result.score < 0 || result.score > 100) {
        console.warn(
          `CV analysis score out of range: ${result.score}, normalizing to 0-100`
        );
        result.score = Math.max(0, Math.min(100, result.score));
      }

      if (result.matchPercentage < 0 || result.matchPercentage > 100) {
        console.warn(
          `CV analysis match percentage out of range: ${result.matchPercentage}, normalizing to 0-100`
        );
        result.matchPercentage = Math.max(
          0,
          Math.min(100, result.matchPercentage)
        );
      }

      return result;
    } catch (error) {
      console.error("CV analysis service error:", error);
      throw error;
    }
  }

  /**
   * Validate the CV analysis request
   */
  validateRequest(request: CVAnalysisRequest): boolean {
    if (!request.cvText || request.cvText.trim().length === 0) {
      return false;
    }

    if (
      !request.jobRequirements ||
      request.jobRequirements.trim().length === 0
    ) {
      return false;
    }

    if (!request.userId || request.userId.trim().length === 0) {
      return false;
    }

    // Check minimum text length for meaningful analysis
    if (request.cvText.trim().length < 50) {
      return false;
    }

    if (request.jobRequirements.trim().length < 20) {
      return false;
    }

    return true;
  }

  /**
   * Enrich request with default values and validation
   */
  enrichRequest(request: CVAnalysisRequest): CVAnalysisRequest {
    return {
      cvText: request.cvText.trim(),
      jobRequirements: request.jobRequirements.trim(),
      userId: request.userId.trim(),
    };
  }

  /**
   * Get estimated processing time based on request complexity
   */
  getEstimatedProcessingTime(request: CVAnalysisRequest): number {
    // Base time: 20 seconds
    let estimatedTime = 20;

    // Add time for complex requests
    if (request.cvText.length > 2000) estimatedTime += 10;
    if (request.cvText.length > 5000) estimatedTime += 15;
    if (request.jobRequirements.length > 500) estimatedTime += 5;
    if (request.jobRequirements.length > 1000) estimatedTime += 10;

    return estimatedTime;
  }

  /**
   * Extract key information from CV text for quick assessment
   */
  extractCVSummary(cvText: string): {
    estimatedExperience: number;
    keySkills: string[];
    educationLevel: string;
  } {
    const text = cvText.toLowerCase();

    // Estimate experience based on keywords
    let estimatedExperience = 0;
    if (
      text.includes("senior") ||
      text.includes("lead") ||
      text.includes("manager")
    ) {
      estimatedExperience = 5;
    } else if (text.includes("mid") || text.includes("intermediate")) {
      estimatedExperience = 3;
    } else if (text.includes("junior") || text.includes("entry")) {
      estimatedExperience = 1;
    }

    // Extract common skills
    const commonSkills = [
      "javascript",
      "python",
      "java",
      "react",
      "node.js",
      "sql",
      "aws",
      "docker",
      "agile",
      "scrum",
      "git",
      "html",
      "css",
      "typescript",
      "angular",
      "vue",
    ];
    const keySkills = commonSkills.filter((skill) => text.includes(skill));

    // Determine education level
    let educationLevel = "bachelor";
    if (text.includes("phd") || text.includes("doctorate")) {
      educationLevel = "phd";
    } else if (text.includes("master") || text.includes("mba")) {
      educationLevel = "master";
    } else if (text.includes("associate") || text.includes("diploma")) {
      educationLevel = "associate";
    }

    return {
      estimatedExperience,
      keySkills,
      educationLevel,
    };
  }
}
