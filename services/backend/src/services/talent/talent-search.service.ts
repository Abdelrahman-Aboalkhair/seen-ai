import { BaseTalentService } from './base-talent.service.js';
import logger, { logError, logPerformance } from '@/lib/logger.js';
import type { 
  TalentSearchCriteria, 
  TalentSearchResult, 
  AdvancedSearchFilters 
} from '@/types/talent.types.js';

export class TalentSearchService extends BaseTalentService {

  // Basic talent search
  async searchTalent(criteria: TalentSearchCriteria): Promise<TalentSearchResult> {
    const startTime = Date.now();
    
    try {
      this.validateSearchCriteria(criteria);
      
      logger.info('Starting talent search', { criteria });

      const result = await this.withRetry(
        () => this.client.post<TalentSearchResult>('/talent-search', {
          criteria,
          timestamp: new Date().toISOString(),
          searchId: this.generateSearchId(),
        }),
        'talent_search'
      );

      const duration = Date.now() - startTime;
      logPerformance('talent_search_completed', duration, { 
        profileCount: result.profiles?.length || 0,
        criteria: JSON.stringify(criteria)
      });

      return result;
    } catch (error) {
      logError(error as Error, { 
        operation: 'search_talent', 
        criteria 
      });
      throw error;
    }
  }

  // Advanced talent search with filters
  async advancedTalentSearch(
    criteria: TalentSearchCriteria,
    filters: AdvancedSearchFilters = {}
  ): Promise<TalentSearchResult> {
    const startTime = Date.now();
    
    try {
      this.validateSearchCriteria(criteria);
      
      logger.info('Starting advanced talent search', { criteria, filters });

      const searchPayload = {
        criteria,
        filters,
        timestamp: new Date().toISOString(),
        searchId: this.generateSearchId(),
        advanced: true,
      };

      const result = await this.withRetry(
        () => this.client.post<TalentSearchResult>('/talent-search/advanced', searchPayload),
        'advanced_talent_search'
      );

      const duration = Date.now() - startTime;
      logPerformance('advanced_talent_search_completed', duration, { 
        profileCount: result.profiles?.length || 0,
        criteria: JSON.stringify(criteria),
        filters: JSON.stringify(filters)
      });

      return result;
    } catch (error) {
      logError(error as Error, { 
        operation: 'advanced_talent_search', 
        criteria,
        filters 
      });
      throw error;
    }
  }

  // Batch talent searches
  async batchTalentSearch(searches: TalentSearchCriteria[]): Promise<TalentSearchResult[]> {
    const startTime = Date.now();
    const batchSize = Math.min(searches.length, 5); // Limit batch size
    const results: TalentSearchResult[] = [];

    logger.info('Starting batch talent search', { 
      count: searches.length, 
      batchSize 
    });

    try {
      // Process in batches to avoid overwhelming N8N
      for (let i = 0; i < searches.length; i += batchSize) {
        const batch = searches.slice(i, i + batchSize);
        
        const batchPromises = batch.map(criteria => this.searchTalent(criteria));
        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            logError(result.reason, { 
              operation: 'batch_talent_search_item', 
              index: i + index,
              criteria: batch[index]
            });
          }
        });

        // Add delay between batches
        if (i + batchSize < searches.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const duration = Date.now() - startTime;
      logPerformance('batch_talent_search', duration, { 
        searchCount: searches.length,
        successCount: results.length
      });

      return results;
    } catch (error) {
      logError(error as Error, { 
        operation: 'batch_talent_search', 
        searchCount: searches.length 
      });
      throw error;
    }
  }

  // Search with specific skills
  async searchBySkills(
    skills: string[], 
    options: {
      location?: string;
      experience?: string;
      remote?: boolean;
      limit?: number;
    } = {}
  ): Promise<TalentSearchResult> {
    return this.searchTalent({
      skills,
      location: options.location,
      experience: options.experience,
      remote: options.remote,
    });
  }

  // Search by job title and location
  async searchByJobAndLocation(
    jobTitle: string,
    location: string,
    additionalCriteria: Partial<TalentSearchCriteria> = {}
  ): Promise<TalentSearchResult> {
    return this.searchTalent({
      jobTitle,
      location,
      ...additionalCriteria,
    });
  }

  // Search for remote candidates
  async searchRemoteTalent(
    criteria: Omit<TalentSearchCriteria, 'remote'>
  ): Promise<TalentSearchResult> {
    return this.searchTalent({
      ...criteria,
      remote: true,
    });
  }

  // Search within salary range
  async searchBySalaryRange(
    minSalary: number,
    maxSalary: number,
    additionalCriteria: Partial<TalentSearchCriteria> = {}
  ): Promise<TalentSearchResult> {
    return this.searchTalent({
      ...additionalCriteria,
      salaryRange: {
        min: minSalary,
        max: maxSalary,
      },
    });
  }

  // Validate search criteria
  private validateSearchCriteria(criteria: TalentSearchCriteria): boolean {
    // At least one search criterion must be provided
    const hasValidCriteria = !!(
      criteria.jobTitle ||
      criteria.skills?.length ||
      criteria.location ||
      criteria.experience ||
      criteria.education ||
      criteria.industry
    );

    if (!hasValidCriteria) {
      throw new Error('At least one search criterion must be provided');
    }

    // Validate salary range if provided
    if (criteria.salaryRange) {
      if (criteria.salaryRange.min < 0 || criteria.salaryRange.max < criteria.salaryRange.min) {
        throw new Error('Invalid salary range');
      }
    }

    return true;
  }

  // Get search suggestions based on partial criteria
  async getSearchSuggestions(partialCriteria: Partial<TalentSearchCriteria>): Promise<{
    jobTitles: string[];
    skills: string[];
    locations: string[];
    industries: string[];
  }> {
    try {
      const result = await this.withRetry(
        () => this.client.post('/talent-search/suggestions', {
          criteria: partialCriteria,
        }),
        'get_search_suggestions'
      );

      return result;
    } catch (error) {
      logError(error as Error, { 
        operation: 'get_search_suggestions', 
        partialCriteria 
      });
      throw error;
    }
  }

  // Save search for later use
  async saveSearch(
    userId: string,
    searchName: string,
    criteria: TalentSearchCriteria
  ): Promise<{ searchId: string }> {
    try {
      const result = await this.withRetry(
        () => this.client.post('/talent-search/save', {
          userId,
          searchName,
          criteria,
          timestamp: new Date().toISOString(),
        }),
        'save_search'
      );

      logger.info('Search saved', { userId, searchName });
      return result;
    } catch (error) {
      logError(error as Error, { 
        operation: 'save_search', 
        userId,
        searchName 
      });
      throw error;
    }
  }

  // Get saved searches for user
  async getSavedSearches(userId: string): Promise<Array<{
    searchId: string;
    searchName: string;
    criteria: TalentSearchCriteria;
    createdAt: string;
  }>> {
    try {
      const result = await this.withRetry(
        () => this.client.get(`/talent-search/saved/${userId}`),
        'get_saved_searches'
      );

      return result;
    } catch (error) {
      logError(error as Error, { 
        operation: 'get_saved_searches', 
        userId 
      });
      throw error;
    }
  }
}
