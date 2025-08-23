// Talent Search Service - Business Logic Layer

import type { 
  TalentSearchCriteria, 
  TalentSearchResult, 
  AdvancedSearchFilters,
  TalentProfile 
} from '@/types/talent-search.types.js';
import { TalentSearchRepository, ITalentSearchRepository } from '@/repositories/talent-search.repository.js';

export interface ITalentSearchService {
  searchTalent(criteria: TalentSearchCriteria): Promise<TalentSearchResult>;
  advancedSearch(criteria: TalentSearchCriteria, filters: AdvancedSearchFilters): Promise<TalentSearchResult>;
  getProfileById(profileId: string): Promise<TalentProfile | null>;
  getProfilesByIds(profileIds: string[]): Promise<TalentProfile[]>;
}

export class TalentSearchService implements ITalentSearchService {
  private repository: ITalentSearchRepository;

  constructor(repository?: ITalentSearchRepository) {
    this.repository = repository || new TalentSearchRepository();
  }

  async searchTalent(criteria: TalentSearchCriteria): Promise<TalentSearchResult> {
    console.log("Service: Processing talent search request:", criteria);
    
    try {
      // Validate search criteria
      this.validateSearchCriteria(criteria);
      
      // Enrich criteria with defaults
      const enrichedCriteria = this.enrichSearchCriteria(criteria);
      
      // Perform search
      const result = await this.repository.searchTalent(enrichedCriteria);
      
      // Calculate match scores
      const scoredResult = this.calculateMatchScores(result, enrichedCriteria);
      
      console.log("Service: Search completed successfully, found", scoredResult.profiles.length, "profiles");
      
      return scoredResult;
    } catch (error) {
      console.error("Service: Talent search failed:", error);
      throw new Error(`Talent search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async advancedSearch(
    criteria: TalentSearchCriteria, 
    filters: AdvancedSearchFilters
  ): Promise<TalentSearchResult> {
    console.log("Service: Processing advanced talent search:", { criteria, filters });
    
    try {
      // Validate search criteria
      this.validateSearchCriteria(criteria);
      
      // Validate filters
      this.validateAdvancedFilters(filters);
      
      // Enrich criteria with defaults
      const enrichedCriteria = this.enrichSearchCriteria(criteria);
      
      // Perform advanced search
      const result = await this.repository.advancedSearch(enrichedCriteria, filters);
      
      // Calculate match scores
      const scoredResult = this.calculateMatchScores(result, enrichedCriteria);
      
      console.log("Service: Advanced search completed successfully, found", scoredResult.profiles.length, "profiles");
      
      return scoredResult;
    } catch (error) {
      console.error("Service: Advanced talent search failed:", error);
      throw new Error(`Advanced talent search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProfileById(profileId: string): Promise<TalentProfile | null> {
    console.log("Service: Getting profile by ID:", profileId);
    
    try {
      if (!profileId || typeof profileId !== 'string') {
        throw new Error('Invalid profile ID');
      }
      
      const profile = await this.repository.getProfileById(profileId);
      
      if (!profile) {
        console.log("Service: Profile not found:", profileId);
        return null;
      }
      
      console.log("Service: Profile retrieved successfully:", profileId);
      return profile;
    } catch (error) {
      console.error("Service: Failed to get profile:", error);
      throw new Error(`Failed to get profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProfilesByIds(profileIds: string[]): Promise<TalentProfile[]> {
    console.log("Service: Getting profiles by IDs:", profileIds);
    
    try {
      if (!Array.isArray(profileIds) || profileIds.length === 0) {
        throw new Error('Invalid profile IDs array');
      }
      
      // Validate each ID
      profileIds.forEach(id => {
        if (!id || typeof id !== 'string') {
          throw new Error('Invalid profile ID in array');
        }
      });
      
      const profiles = await this.repository.getProfilesByIds(profileIds);
      
      console.log("Service: Retrieved", profiles.length, "profiles out of", profileIds.length, "requested");
      
      return profiles;
    } catch (error) {
      console.error("Service: Failed to get profiles:", error);
      throw new Error(`Failed to get profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateSearchCriteria(criteria: TalentSearchCriteria): void {
    if (!criteria || typeof criteria !== 'object') {
      throw new Error('Invalid search criteria');
    }
    
    // At least one search parameter should be provided
    const hasValidCriteria = criteria.jobTitle || 
                            (criteria.skills && criteria.skills.length > 0) ||
                            criteria.location ||
                            criteria.experience ||
                            (criteria.education && criteria.education.length > 0) ||
                            criteria.availability ||
                            criteria.salary ||
                            criteria.remote !== undefined ||
                            (criteria.keywords && criteria.keywords.length > 0);
    
    if (!hasValidCriteria) {
      throw new Error('At least one search criteria must be provided');
    }
  }

  private validateAdvancedFilters(filters: AdvancedSearchFilters): void {
    if (!filters || typeof filters !== 'object') {
      throw new Error('Invalid advanced filters');
    }
    
    // Validate specific filter types if provided
    if (filters.companySize && !['startup', 'mid-size', 'enterprise'].includes(filters.companySize)) {
      throw new Error('Invalid company size filter');
    }
    
    if (filters.visaStatus && typeof filters.visaStatus !== 'string') {
      throw new Error('Invalid visa status filter');
    }
    
    if (filters.relocation !== undefined && typeof filters.relocation !== 'boolean') {
      throw new Error('Invalid relocation filter');
    }
  }

  private enrichSearchCriteria(criteria: TalentSearchCriteria): TalentSearchCriteria {
    const enriched = { ...criteria };
    
    // Set default experience range if not provided
    if (!enriched.experience) {
      enriched.experience = { min: 0, max: 20 };
    }
    
    // Set default salary currency if not provided
    if (enriched.salary && !enriched.salary.currency) {
      enriched.salary.currency = 'USD';
    }
    
    // Set default availability if not provided
    if (!enriched.availability) {
      enriched.availability = 'flexible';
    }
    
    return enriched;
  }

  private calculateMatchScores(result: TalentSearchResult, criteria: TalentSearchCriteria): TalentSearchResult {
    const scoredProfiles = result.profiles.map(profile => {
      let score = 0;
      
      // Skills matching (40% weight)
      if (criteria.skills && criteria.skills.length > 0) {
        const skillMatches = criteria.skills.filter(skill =>
          profile.skills.some(profileSkill => 
            profileSkill.toLowerCase().includes(skill.toLowerCase())
          )
        ).length;
        score += (skillMatches / criteria.skills.length) * 40;
      }
      
      // Experience matching (25% weight)
      if (criteria.experience) {
        const { min = 0, max = 20 } = criteria.experience;
        if (profile.experience >= min && profile.experience <= max) {
          score += 25;
        } else {
          score += Math.max(0, 25 - Math.abs(profile.experience - (min + max) / 2) * 2);
        }
      }
      
      // Location matching (20% weight)
      if (criteria.location && profile.location.toLowerCase().includes(criteria.location.toLowerCase())) {
        score += 20;
      }
      
      // Remote preference matching (10% weight)
      if (criteria.remote !== undefined && profile.remote === criteria.remote) {
        score += 10;
      }
      
      // Availability matching (5% weight)
      if (criteria.availability && profile.availability === criteria.availability) {
        score += 5;
      }
      
      return {
        ...profile,
        matchScore: Math.round(score)
      };
    });
    
    // Sort by match score (highest first)
    scoredProfiles.sort((a, b) => b.matchScore - a.matchScore);
    
    return {
      ...result,
      profiles: scoredProfiles
    };
  }
}
