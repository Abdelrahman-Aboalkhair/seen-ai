// Talent Search Repository - Data Access Layer

import type {
  TalentSearchCriteria,
  TalentSearchResult,
  AdvancedSearchFilters,
  TalentProfile,
  N8NTalentSearchRequest,
  N8NTalentSearchResponse,
} from "@/types/talent-search.types.js";

export interface ITalentSearchRepository {
  searchTalent(criteria: TalentSearchCriteria): Promise<TalentSearchResult>;
  advancedSearch(
    criteria: TalentSearchCriteria,
    filters: AdvancedSearchFilters
  ): Promise<TalentSearchResult>;
  getProfileById(profileId: string): Promise<TalentProfile | null>;
  getProfilesByIds(profileIds: string[]): Promise<TalentProfile[]>;
}

export class TalentSearchRepository implements ITalentSearchRepository {
  private n8nWebhookUrl: string;
  private requestTimeout: number;

  constructor() {
    // Use environment variable or fallback to the provided URL
    this.n8nWebhookUrl =
      process.env.N8N_WEBHOOK_URL ||
      "https://seen.app.n8n.cloud/webhook/e5ed50b1-0c27-4786-9823-58b728392560";
    this.requestTimeout = 300000; // 5 minutes timeout for N8N processing
  }

  async searchTalent(
    criteria: TalentSearchCriteria
  ): Promise<TalentSearchResult> {
    console.log("Repository: Searching talent via N8N webhook:", criteria);

    try {
      // Convert our criteria to N8N format
      const n8nRequest: N8NTalentSearchRequest =
        this.convertToN8NFormat(criteria);
      console.log("n8nRequest: ", n8nRequest);

      const response = await this.callN8NWebhook(n8nRequest);
      console.log("response from searchTalent: ", response);

      if (!response || typeof response !== "object") {
        throw new Error("Invalid response format from N8N");
      }

      // N8N returns a single object, not an array
      const n8nResponse = response as N8NTalentSearchResponse;

      if (n8nResponse.status !== "completed") {
        throw new Error(`N8N search status: ${n8nResponse.status}`);
      }

      // Convert N8N response to our format
      const result = this.convertFromN8NFormat(n8nResponse, criteria);
      console.log("result from n8n: ", result);

      return result;
    } catch (error) {
      console.error("Repository: N8N webhook call failed:", error);
      console.log("Repository: Falling back to mock data for testing purposes");

      // Fallback to mock data when N8N is unavailable
      return this.getMockSearchResult(criteria);
    }
  }

  async advancedSearch(
    criteria: TalentSearchCriteria,
    filters: AdvancedSearchFilters
  ): Promise<TalentSearchResult> {
    console.log("Repository: Advanced search via N8N webhook:", {
      criteria,
      filters,
    });

    try {
      // For advanced search, we'll enhance the criteria with filters
      const enhancedCriteria = { ...criteria };

      // Add filter information to the search
      if (filters.technologies && filters.technologies.length > 0) {
        enhancedCriteria.skills = enhancedCriteria.skills || [];
        enhancedCriteria.skills.push(...filters.technologies);
      }

      if (filters.certifications && filters.certifications.length > 0) {
        enhancedCriteria.certifications = filters.certifications.join(", ");
      }

      if (filters.languages && filters.languages.length > 0) {
        enhancedCriteria.languages = filters.languages.join(", ");
      }

      // Convert to N8N format
      const n8nRequest: N8NTalentSearchRequest =
        this.convertToN8NFormat(enhancedCriteria);

      console.log(
        "Repository: Advanced search converted to N8N format:",
        n8nRequest
      );

      const response = await this.callN8NWebhook(n8nRequest);

      if (!response || typeof response !== "object") {
        throw new Error("Invalid response format from N8N");
      }

      // N8N returns a single object, not an array
      const n8nResponse = response as N8NTalentSearchResponse;

      if (n8nResponse.status !== "completed") {
        throw new Error(`N8N advanced search status: ${n8nResponse.status}`);
      }

      // Convert N8N response to our format
      const result = this.convertFromN8NFormat(n8nResponse, enhancedCriteria);

      return result;
    } catch (error) {
      console.error(
        "Repository: Advanced search N8N webhook call failed:",
        error
      );
      console.log("Repository: Falling back to mock data for testing purposes");

      // Fallback to mock data when N8N is unavailable
      return this.getMockSearchResult(criteria);
    }
  }

  async getProfileById(profileId: string): Promise<TalentProfile | null> {
    console.log(
      "Repository: Getting profile by ID via N8N webhook:",
      profileId
    );

    try {
      // For individual profile retrieval, we'll need to search with specific criteria
      // This is a limitation of the current N8N setup - we can't directly fetch by ID
      const criteria: TalentSearchCriteria = {
        keywords: [profileId], // Use the ID as a keyword to find the profile
        numberOfCandidates: 1,
      };

      const n8nRequest: N8NTalentSearchRequest =
        this.convertToN8NFormat(criteria);

      const response = await this.callN8NWebhook(n8nRequest);

      if (!response || typeof response !== "object") {
        return null;
      }

      // N8N returns a single object, not an array
      const n8nResponse = response as N8NTalentSearchResponse;

      if (
        n8nResponse.status !== "completed" ||
        n8nResponse.candidates.length === 0
      ) {
        return null;
      }

      // Convert the first candidate to our profile format
      const candidate = n8nResponse.candidates[0];
      const profile = this.convertCandidateToProfile(candidate, profileId);

      return profile;
    } catch (error) {
      console.error("Repository: Get profile N8N webhook call failed:", error);
      console.log("Repository: Falling back to mock data for testing purposes");

      // Fallback to mock data when N8N is unavailable
      const mockResult = await this.getMockSearchResult({
        keywords: [profileId],
      });
      return mockResult.profiles[0] || null;
    }
  }

  async getProfilesByIds(profileIds: string[]): Promise<TalentProfile[]> {
    console.log(
      "Repository: Getting profiles by IDs via N8N webhook:",
      profileIds
    );

    try {
      // For multiple profiles, we'll search with broader criteria and filter results
      const criteria: TalentSearchCriteria = {
        keywords: profileIds, // Use IDs as keywords
        numberOfCandidates: Math.max(profileIds.length, 10), // Request enough candidates
      };

      const n8nRequest: N8NTalentSearchRequest =
        this.convertToN8NFormat(criteria);

      const response = await this.callN8NWebhook(n8nRequest);

      if (!response || typeof response !== "object") {
        return [];
      }

      // N8N returns a single object, not an array
      const n8nResponse = response as N8NTalentSearchResponse;

      if (n8nResponse.status !== "completed") {
        return [];
      }

      // Convert candidates to profiles
      const profiles = n8nResponse.candidates.map((candidate, index) =>
        this.convertCandidateToProfile(
          candidate,
          profileIds[index] || `profile_${index}`
        )
      );

      return profiles;
    } catch (error) {
      console.error("Repository: Get profiles N8N webhook call failed:", error);
      console.log("Repository: Falling back to mock data for testing purposes");

      // Fallback to mock data when N8N is unavailable
      const mockResult = await this.getMockSearchResult({
        keywords: profileIds,
      });
      return mockResult.profiles.slice(0, profileIds.length);
    }
  }

  private convertToN8NFormat(
    criteria: TalentSearchCriteria
  ): N8NTalentSearchRequest {
    // Generate a unique session ID for this search session
    const sessionId =
      criteria.sessionId ||
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Use jobTitle as chatInput and jobDescription for better context
    const chatInput =
      criteria.jobTitle || criteria.keywords?.join(" ") || "Talent search";
    const jobDescription =
      criteria.jobTitle ||
      criteria.keywords?.join(" ") ||
      "Software development";

    return {
      sessionId,
      chatInput,
      jobDescription,
      skillsRequired: criteria.skills?.join(", ") || "",
      certifications: criteria.certifications || "",
      education: criteria.education?.join(", ") || "",
      languages: criteria.languages || "",
      location: criteria.location || "",
      numberOfCandidates: criteria.numberOfCandidates || 5,
      matchScore: criteria.matchScore || 50,
    };
  }

  private convertFromN8NFormat(
    n8nResponse: N8NTalentSearchResponse,
    criteria: TalentSearchCriteria
  ): TalentSearchResult {
    const profiles = n8nResponse.candidates.map((candidate, index) =>
      this.convertCandidateToProfile(candidate, `profile_${index}`)
    );

    return {
      profiles,
      totalCount: n8nResponse.totalProfiles,
      searchId: n8nResponse.callbackId,
      timestamp: new Date().toISOString(),
      criteria,
    };
  }

  private convertCandidateToProfile(
    candidate: any,
    profileId: string
  ): TalentProfile {
    // Extract skills from the skillsMatch string
    const skillsMatch = candidate.analysis?.skillsMatch || "";
    const skills = this.extractSkillsFromMatch(skillsMatch || "");

    // Extract experience from the experienceMatch string
    const experience = this.extractExperienceFromMatch(
      candidate.analysis?.experienceMatch || ""
    );

    // Extract education level
    const education = this.extractEducationFromMatch(
      candidate.analysis?.educationMatch || ""
    );

    return {
      id: profileId,
      name: candidate.candidate?.name || "Unknown",
      title: candidate.candidate?.headline || "Developer",
      skills,
      experience,
      location: "Unknown", // N8N doesn't provide location in candidate data
      availability: "flexible", // Default value
      salary: { min: 0, max: 0, currency: "USD" }, // Default values
      remote: true, // Default value
      education: [education],
      matchScore: candidate.matchScore || 0,
      lastActive: new Date().toISOString(),
    };
  }

  private extractSkillsFromMatch(skillsMatch: string): string[] {
    if (!skillsMatch) return [];

    // Extract skills from the skillsMatch string
    const skills = [];
    const lines = skillsMatch.split("\n");

    for (const line of lines) {
      if (line.includes(":")) {
        const skillsPart = line.split(":")[1];
        if (skillsPart) {
          const skillList = skillsPart
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
          skills.push(...skillList);
        }
      }
    }

    return skills.length > 0 ? skills : ["JavaScript", "Web Development"];
  }

  private extractExperienceFromMatch(experienceMatch: any): number {
    if (!experienceMatch) return 0;

    // Look for years of experience in the text
    const yearMatch = experienceMatch.match(/(\d+)\s*years?/i);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }

    // Look for "fresh graduate" or similar
    if (
      experienceMatch.toLowerCase().includes("fresh graduate") ||
      experienceMatch.toLowerCase().includes("junior")
    ) {
      return 0;
    }

    // Look for "senior" or similar
    if (experienceMatch.toLowerCase().includes("senior")) {
      return 5;
    }

    return 2; // Default to 2 years
  }

  private extractEducationFromMatch(educationMatch: string): string {
    if (!educationMatch) return "Bachelor's degree";

    if (educationMatch.toLowerCase().includes("master")) {
      return "Master's degree";
    }

    if (
      educationMatch.toLowerCase().includes("phd") ||
      educationMatch.toLowerCase().includes("doctorate")
    ) {
      return "PhD";
    }

    if (
      educationMatch.toLowerCase().includes("associate") ||
      educationMatch.toLowerCase().includes("diploma")
    ) {
      return "Associate degree";
    }

    return "Bachelor's degree";
  }

  private async callN8NWebhook(payload: N8NTalentSearchRequest): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(this.n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "SmartRecruiter-Backend/1.0.0",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      console.log("response from callN8NWebhook: ", response);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      console.log("Repository: N8N webhook response received:", {
        status: response.status,
        dataKeys: data ? Object.keys(data) : [],
        success: data?.success,
        responseType: Array.isArray(data) ? "array" : typeof data,
        responseLength: Array.isArray(data) ? data.length : "N/A",
      });

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("N8N webhook request timed out");
      }

      throw error;
    }
  }

  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMockSearchResult(
    criteria: TalentSearchCriteria
  ): TalentSearchResult {
    console.log("Repository: Mocking search result for:", criteria);
    const profiles: TalentProfile[] = [];
    const mockProfile = {
      id: "mock_profile_1",
      name: "Mock Candidate",
      title: "Mock Developer",
      skills: ["Mock Skill 1", "Mock Skill 2"],
      experience: 3,
      location: "Mock City",
      availability: "full-time",
      salary: { min: 100000, max: 150000, currency: "USD" },
      remote: true,
      education: ["Mock Degree"],
      matchScore: 95,
      lastActive: "2023-10-27T10:00:00.000Z",
    };
    profiles.push(mockProfile);
    return {
      profiles,
      totalCount: 1,
      searchId: this.generateSearchId(),
      timestamp: new Date().toISOString(),
      criteria,
    };
  }
}
