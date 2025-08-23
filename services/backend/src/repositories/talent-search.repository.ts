// Talent Search Repository - Data Access Layer

import type { 
  TalentSearchCriteria, 
  TalentSearchResult, 
  AdvancedSearchFilters,
  TalentProfile 
} from '@/types/talent-search.types.js';

export interface ITalentSearchRepository {
  searchTalent(criteria: TalentSearchCriteria): Promise<TalentSearchResult>;
  advancedSearch(criteria: TalentSearchCriteria, filters: AdvancedSearchFilters): Promise<TalentSearchResult>;
  getProfileById(profileId: string): Promise<TalentProfile | null>;
  getProfilesByIds(profileIds: string[]): Promise<TalentProfile[]>;
}

export class TalentSearchRepository implements ITalentSearchRepository {
  
  // Mock data for testing - replace with actual database calls
  private mockProfiles: TalentProfile[] = [
    {
      id: "1",
      name: "John Doe",
      title: "Senior Software Engineer",
      skills: ["React", "Node.js", "TypeScript", "MongoDB"],
      experience: 5,
      location: "San Francisco, CA",
      availability: "immediate",
      salary: { min: 120000, max: 180000, currency: "USD" },
      remote: true,
      education: ["Bachelor's in Computer Science"],
      matchScore: 95,
      lastActive: "2025-08-23T10:00:00Z"
    },
    {
      id: "2",
      name: "Jane Smith",
      title: "Full Stack Developer",
      skills: ["Vue.js", "Python", "Django", "PostgreSQL"],
      experience: 3,
      location: "New York, NY",
      availability: "2-weeks",
      salary: { min: 90000, max: 140000, currency: "USD" },
      remote: false,
      education: ["Master's in Software Engineering"],
      matchScore: 87,
      lastActive: "2025-08-22T15:30:00Z"
    },
    {
      id: "3",
      name: "Mike Johnson",
      title: "DevOps Engineer",
      skills: ["Docker", "Kubernetes", "AWS", "Terraform"],
      experience: 7,
      location: "Austin, TX",
      availability: "1-month",
      salary: { min: 110000, max: 160000, currency: "USD" },
      remote: true,
      education: ["Bachelor's in Information Technology"],
      matchScore: 92,
      lastActive: "2025-08-21T09:15:00Z"
    }
  ];

  async searchTalent(criteria: TalentSearchCriteria): Promise<TalentSearchResult> {
    console.log("Repository: Searching talent with criteria:", criteria);
    
    // Simulate database delay
    await this.simulateDelay(100);
    
    // Simple filtering logic for testing
    let filteredProfiles = this.mockProfiles;
    
    if (criteria.skills && criteria.skills.length > 0) {
      filteredProfiles = filteredProfiles.filter(profile =>
        criteria.skills!.some(skill => 
          profile.skills.some(profileSkill => 
            profileSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }
    
    if (criteria.location) {
      filteredProfiles = filteredProfiles.filter(profile =>
        profile.location.toLowerCase().includes(criteria.location!.toLowerCase())
      );
    }
    
    if (criteria.experience?.min) {
      filteredProfiles = filteredProfiles.filter(profile =>
        profile.experience >= criteria.experience!.min!
      );
    }
    
    if (criteria.experience?.max) {
      filteredProfiles = filteredProfiles.filter(profile =>
        profile.experience <= criteria.experience!.max!
      );
    }
    
    if (criteria.remote !== undefined) {
      filteredProfiles = filteredProfiles.filter(profile =>
        profile.remote === criteria.remote
      );
    }

    return {
      profiles: filteredProfiles,
      totalCount: filteredProfiles.length,
      searchId: this.generateSearchId(),
      timestamp: new Date().toISOString(),
      criteria
    };
  }

  async advancedSearch(
    criteria: TalentSearchCriteria, 
    filters: AdvancedSearchFilters
  ): Promise<TalentSearchResult> {
    console.log("Repository: Advanced search with criteria:", criteria, "filters:", filters);
    
    // Simulate database delay
    await this.simulateDelay(150);
    
    // Get basic results first
    const basicResults = await this.searchTalent(criteria);
    
    // Apply advanced filters
    let filteredProfiles = basicResults.profiles;
    
    if (filters.industry && filters.industry.length > 0) {
      // Mock industry filtering
      filteredProfiles = filteredProfiles.filter((_, index) => index % 2 === 0);
    }
    
    if (filters.technologies && filters.technologies.length > 0) {
      filteredProfiles = filteredProfiles.filter(profile =>
        filters.technologies!.some(tech => 
          profile.skills.some(skill => 
            skill.toLowerCase().includes(tech.toLowerCase())
          )
        )
      );
    }
    
    if (filters.relocation !== undefined) {
      // Mock relocation filtering
      filteredProfiles = filteredProfiles.filter((_, index) => index % 3 === 0);
    }

    return {
      profiles: filteredProfiles,
      totalCount: filteredProfiles.length,
      searchId: this.generateSearchId(),
      timestamp: new Date().toISOString(),
      criteria
    };
  }

  async getProfileById(profileId: string): Promise<TalentProfile | null> {
    console.log("Repository: Getting profile by ID:", profileId);
    
    await this.simulateDelay(50);
    
    const profile = this.mockProfiles.find(p => p.id === profileId);
    return profile || null;
  }

  async getProfilesByIds(profileIds: string[]): Promise<TalentProfile[]> {
    console.log("Repository: Getting profiles by IDs:", profileIds);
    
    await this.simulateDelay(80);
    
    return this.mockProfiles.filter(p => profileIds.includes(p.id));
  }

  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
