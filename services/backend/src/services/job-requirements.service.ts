// Job Requirements Generation Service - Business Logic Layer

import { JobRequirementsRepository } from "@/repositories/job-requirements.repository.js";
import type { JobRequirementsRequest, JobRequirementsResult } from "@/types/ai.types.js";

export interface IJobRequirementsService {
  generateJobRequirements(request: JobRequirementsRequest): Promise<JobRequirementsResult>;
  validateRequest(request: JobRequirementsRequest): boolean;
  enrichRequest(request: JobRequirementsRequest): JobRequirementsRequest;
}

export class JobRequirementsService implements IJobRequirementsService {
  private repository: JobRequirementsRepository;

  constructor() {
    this.repository = new JobRequirementsRepository();
  }

  /**
   * Generate job requirements
   */
  async generateJobRequirements(request: JobRequirementsRequest): Promise<JobRequirementsResult> {
    // Validate request
    if (!this.validateRequest(request)) {
      throw new Error("Invalid job requirements request");
    }

    // Enrich request with defaults
    const enrichedRequest = this.enrichRequest(request);

    try {
      // Generate job requirements using repository
      const result = await this.repository.generateJobRequirements(enrichedRequest);
      
      // Validate generated result
      if (!result) {
        throw new Error("No job requirements were generated");
      }

      // Validate and normalize salary ranges
      if (result.salaryRange) {
        if (result.salaryRange.min < 0) {
          console.warn(`Job requirements salary min out of range: ${result.salaryRange.min}, normalizing to 0`);
          result.salaryRange.min = 0;
        }
        
        if (result.salaryRange.max < result.salaryRange.min) {
          console.warn(`Job requirements salary max (${result.salaryRange.max}) is less than min (${result.salaryRange.min}), swapping values`);
          const temp = result.salaryRange.max;
          result.salaryRange.max = result.salaryRange.min;
          result.salaryRange.min = temp;
        }
      }

      // Validate experience years
      if (result.experience) {
        if (result.experience.minimumYears < 0) {
          console.warn(`Job requirements minimum years out of range: ${result.experience.minimumYears}, normalizing to 0`);
          result.experience.minimumYears = 0;
        }
        
        if (result.experience.preferredYears < result.experience.minimumYears) {
          console.warn(`Job requirements preferred years (${result.experience.preferredYears}) is less than minimum (${result.experience.minimumYears}), adjusting`);
          result.experience.preferredYears = result.experience.minimumYears + 2;
        }
      }

      return result;
    } catch (error) {
      console.error("Job requirements service error:", error);
      throw error;
    }
  }

  /**
   * Validate the job requirements request
   */
  validateRequest(request: JobRequirementsRequest): boolean {
    if (!request.jobTitle || request.jobTitle.trim().length === 0) {
      return false;
    }

    if (!request.userId || request.userId.trim().length === 0) {
      return false;
    }

    // Check minimum text length for meaningful generation
    if (request.jobTitle.trim().length < 3) {
      return false;
    }

    // Validate seniority if provided
    if (request.seniority && !this.isValidSeniority(request.seniority)) {
      return false;
    }

    // Validate industry if provided
    if (request.industry && !this.isValidIndustry(request.industry)) {
      return false;
    }

    return true;
  }

  /**
   * Enrich request with default values and validation
   */
  enrichRequest(request: JobRequirementsRequest): JobRequirementsRequest {
    return {
      jobTitle: request.jobTitle.trim(),
      industry: request.industry?.trim() || "Technology",
      seniority: request.seniority?.trim() || "Mid-level",
      companySize: request.companySize?.trim() || "Medium to Large",
      location: request.location?.trim() || "Remote/Hybrid",
      userId: request.userId.trim(),
    };
  }

  /**
   * Get estimated processing time based on request complexity
   */
  getEstimatedProcessingTime(request: JobRequirementsRequest): number {
    // Base time: 25 seconds
    let estimatedTime = 25;
    
    // Add time for complex requests
    if (request.jobTitle.length > 50) estimatedTime += 5;
    if (request.industry && request.industry.length > 20) estimatedTime += 3;
    if (request.seniority && request.seniority.length > 15) estimatedTime += 3;
    if (request.companySize && request.companySize.length > 20) estimatedTime += 3;
    
    return estimatedTime;
  }

  /**
   * Validate seniority level
   */
  private isValidSeniority(seniority: string): boolean {
    const validSeniorities = [
      "entry", "junior", "associate", "mid-level", "mid", "intermediate",
      "senior", "lead", "principal", "staff", "manager", "director", "executive"
    ];
    return validSeniorities.some(valid => 
      seniority.toLowerCase().includes(valid.toLowerCase())
    );
  }

  /**
   * Validate industry
   */
  private isValidIndustry(industry: string): boolean {
    const validIndustries = [
      "technology", "healthcare", "finance", "education", "retail", "manufacturing",
      "consulting", "media", "non-profit", "government", "real estate", "transportation"
    ];
    return validIndustries.some(valid => 
      industry.toLowerCase().includes(valid.toLowerCase())
    );
  }

  /**
   * Extract key information from job title for quick assessment
   */
  extractJobTitleSummary(jobTitle: string): {
    estimatedSeniority: string;
    keyDomain: string;
    specialization: string[];
  } {
    const title = jobTitle.toLowerCase();
    
    // Estimate seniority based on keywords
    let estimatedSeniority = "mid-level";
    if (title.includes("senior") || title.includes("lead") || title.includes("principal")) {
      estimatedSeniority = "senior";
    } else if (title.includes("junior") || title.includes("entry") || title.includes("associate")) {
      estimatedSeniority = "junior";
    } else if (title.includes("manager") || title.includes("director") || title.includes("executive")) {
      estimatedSeniority = "management";
    }

    // Extract common domains
    const commonDomains = [
      "frontend", "backend", "full-stack", "mobile", "data", "ai", "ml", "devops",
      "security", "cloud", "ui/ux", "product", "marketing", "sales", "hr", "finance"
    ];
    const keyDomain = commonDomains.find(domain => title.includes(domain)) || "general";

    // Extract specializations
    const specializations = [
      "react", "angular", "vue", "node.js", "python", "java", "c#", "sql", "aws",
      "docker", "kubernetes", "machine learning", "data science", "cybersecurity"
    ];
    const specialization = specializations.filter(spec => title.includes(spec));

    return {
      estimatedSeniority,
      keyDomain,
      specialization
    };
  }

  /**
   * Generate industry-specific insights
   */
  getIndustryInsights(industry: string): {
    marketTrends: string[];
    competitiveFactors: string[];
    growthPotential: string;
  } {
    const insights: Record<string, any> = {
      technology: {
        marketTrends: ["AI/ML adoption", "Cloud migration", "Remote work tools", "Cybersecurity focus"],
        competitiveFactors: ["Innovation speed", "Technical expertise", "Company culture", "Compensation packages"],
        growthPotential: "High - Rapid technological advancement and digital transformation"
      },
      healthcare: {
        marketTrends: ["Telemedicine", "AI diagnostics", "Patient data security", "Precision medicine"],
        competitiveFactors: ["Regulatory compliance", "Clinical expertise", "Patient outcomes", "Innovation in care delivery"],
        growthPotential: "High - Aging population and healthcare digitization"
      },
      finance: {
        marketTrends: ["Fintech disruption", "Digital banking", "Blockchain adoption", "Regulatory changes"],
        competitiveFactors: ["Risk management", "Compliance expertise", "Customer trust", "Technology integration"],
        growthPotential: "Moderate - Digital transformation with regulatory constraints"
      }
    };

    return insights[industry.toLowerCase()] || {
      marketTrends: ["Industry-specific trends"],
      competitiveFactors: ["Market positioning", "Quality of service"],
      growthPotential: "Varies by market conditions"
    };
  }
}
