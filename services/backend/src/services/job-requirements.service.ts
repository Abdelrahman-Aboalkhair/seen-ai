// Job Requirements Service - Business Logic Layer

import OpenAI from "openai";
import type {
  JobRequirementsRequest,
  JobRequirementsResult,
} from "@/types/ai.types.js";

export interface IJobRequirementsService {
  generateJobRequirements(
    request: JobRequirementsRequest
  ): Promise<JobRequirementsResult>;
  validateRequest(request: JobRequirementsRequest): boolean;
  enrichRequest(request: JobRequirementsRequest): JobRequirementsRequest;
}

export class JobRequirementsService implements IJobRequirementsService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate job requirements
   */
  async generateJobRequirements(
    request: JobRequirementsRequest
  ): Promise<JobRequirementsResult> {
    // Validate request
    if (!this.validateRequest(request)) {
      throw new Error("Invalid job requirements request");
    }

    // Enrich request with defaults
    const enrichedRequest = this.enrichRequest(request);

    try {
      // Generate job requirements using OpenAI
      const result = await this.generateJobRequirementsWithAI(enrichedRequest);

      // Validate generated result
      if (!result) {
        throw new Error("No job requirements were generated");
      }

      return result;
    } catch (error) {
      console.error("Failed to generate job requirements:", error);
      throw error;
    }
  }

  /**
   * Generate job requirements using OpenAI
   */
  private async generateJobRequirementsWithAI(
    request: JobRequirementsRequest
  ): Promise<JobRequirementsResult> {
    const systemPrompt = `You are an expert HR professional and job description specialist with deep knowledge of various industries, roles, and recruitment best practices. You understand job market trends, skill requirements, and industry standards. Always return valid JSON format only.`;

    const userPrompt = `
    Generate comprehensive job requirements for the following position:

    Job Title: ${request.jobTitle}
    Industry: ${request.industry || "Technology"}
    Seniority Level: ${request.seniority || "Mid-level"}
    Company Size: ${request.companySize || "Medium"}
    Location: ${request.location || "Remote"}

    Please provide detailed job requirements in the following JSON format:
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
      }
    }

    Guidelines:
    1. **Job Title**: Use industry-standard titles
    2. **Summary**: 2-3 sentences describing the role and impact
    3. **Responsibilities**: 5-8 key responsibilities in action-oriented language
    4. **Skills**: Distinguish between required and preferred skills
    5. **Experience**: Realistic years based on seniority level
    6. **Education**: Consider industry standards and role requirements

    Industry Insights for ${request.industry || "Technology"}:
    - Focus on relevant technical skills and tools
    - Include industry-specific certifications if applicable
    - Consider current market trends and emerging technologies
    - Adapt to company size and growth stage

    Please ensure the response is valid JSON without any markdown formatting or additional text.`;

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

    return this.parseJsonResponse<JobRequirementsResult>(content);
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
      console.error("Failed to parse JSON response:", {
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
    if (request.companySize && request.companySize.length > 20)
      estimatedTime += 3;

    return estimatedTime;
  }

  /**
   * Validate seniority level
   */
  private isValidSeniority(seniority: string): boolean {
    const validSeniorities = [
      "entry",
      "junior",
      "associate",
      "mid-level",
      "mid",
      "intermediate",
      "senior",
      "lead",
      "principal",
      "staff",
      "manager",
      "director",
      "executive",
    ];
    return validSeniorities.some((valid) =>
      seniority.toLowerCase().includes(valid.toLowerCase())
    );
  }

  /**
   * Validate industry
   */
  private isValidIndustry(industry: string): boolean {
    const validIndustries = [
      "technology",
      "healthcare",
      "finance",
      "education",
      "retail",
      "manufacturing",
      "consulting",
      "media",
      "non-profit",
      "government",
      "real estate",
      "transportation",
    ];
    return validIndustries.some((valid) =>
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
    if (
      title.includes("senior") ||
      title.includes("lead") ||
      title.includes("principal")
    ) {
      estimatedSeniority = "senior";
    } else if (
      title.includes("junior") ||
      title.includes("entry") ||
      title.includes("associate")
    ) {
      estimatedSeniority = "junior";
    } else if (
      title.includes("manager") ||
      title.includes("director") ||
      title.includes("executive")
    ) {
      estimatedSeniority = "management";
    }

    // Extract common domains
    const commonDomains = [
      "frontend",
      "backend",
      "full-stack",
      "mobile",
      "data",
      "ai",
      "ml",
      "devops",
      "security",
      "cloud",
      "ui/ux",
      "product",
      "marketing",
      "sales",
      "hr",
      "finance",
    ];
    const keyDomain =
      commonDomains.find((domain) => title.includes(domain)) || "general";

    // Extract specializations
    const specializations = [
      "react",
      "angular",
      "vue",
      "node.js",
      "python",
      "java",
      "c#",
      "sql",
      "aws",
      "docker",
      "kubernetes",
      "machine learning",
      "data science",
      "cybersecurity",
    ];
    const specialization = specializations.filter((spec) =>
      title.includes(spec)
    );

    return {
      estimatedSeniority,
      keyDomain,
      specialization,
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
        marketTrends: [
          "AI/ML adoption",
          "Cloud migration",
          "Remote work tools",
          "Cybersecurity focus",
        ],
        competitiveFactors: [
          "Innovation speed",
          "Technical expertise",
          "Company culture",
          "Compensation packages",
        ],
        growthPotential:
          "High - Rapid technological advancement and digital transformation",
      },
      healthcare: {
        marketTrends: [
          "Telemedicine",
          "AI diagnostics",
          "Patient data security",
          "Precision medicine",
        ],
        competitiveFactors: [
          "Regulatory compliance",
          "Clinical expertise",
          "Patient outcomes",
          "Innovation in care delivery",
        ],
        growthPotential: "High - Aging population and healthcare digitization",
      },
      finance: {
        marketTrends: [
          "Fintech disruption",
          "Digital banking",
          "Blockchain adoption",
          "Regulatory changes",
        ],
        competitiveFactors: [
          "Risk management",
          "Compliance expertise",
          "Customer trust",
          "Technology integration",
        ],
        growthPotential:
          "Moderate - Digital transformation with regulatory constraints",
      },
    };

    return (
      insights[industry.toLowerCase()] || {
        marketTrends: ["Industry-specific trends"],
        competitiveFactors: ["Market positioning", "Quality of service"],
        growthPotential: "Varies by market conditions",
      }
    );
  }
}
