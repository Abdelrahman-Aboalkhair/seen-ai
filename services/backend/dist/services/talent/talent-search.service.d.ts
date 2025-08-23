import { BaseTalentService } from './base-talent.service.js';
import type { TalentSearchCriteria, TalentSearchResult, AdvancedSearchFilters } from '@/types/talent.types.js';
export declare class TalentSearchService extends BaseTalentService {
    searchTalent(criteria: TalentSearchCriteria): Promise<TalentSearchResult>;
    advancedTalentSearch(criteria: TalentSearchCriteria, filters?: AdvancedSearchFilters): Promise<TalentSearchResult>;
    batchTalentSearch(searches: TalentSearchCriteria[]): Promise<TalentSearchResult[]>;
    searchBySkills(skills: string[], options?: {
        location?: string;
        experience?: string;
        remote?: boolean;
        limit?: number;
    }): Promise<TalentSearchResult>;
    searchByJobAndLocation(jobTitle: string, location: string, additionalCriteria?: Partial<TalentSearchCriteria>): Promise<TalentSearchResult>;
    searchRemoteTalent(criteria: Omit<TalentSearchCriteria, 'remote'>): Promise<TalentSearchResult>;
    searchBySalaryRange(minSalary: number, maxSalary: number, additionalCriteria?: Partial<TalentSearchCriteria>): Promise<TalentSearchResult>;
    private validateSearchCriteria;
    getSearchSuggestions(partialCriteria: Partial<TalentSearchCriteria>): Promise<{
        jobTitles: string[];
        skills: string[];
        locations: string[];
        industries: string[];
    }>;
    saveSearch(userId: string, searchName: string, criteria: TalentSearchCriteria): Promise<{
        searchId: string;
    }>;
    getSavedSearches(userId: string): Promise<Array<{
        searchId: string;
        searchName: string;
        criteria: TalentSearchCriteria;
        createdAt: string;
    }>>;
}
//# sourceMappingURL=talent-search.service.d.ts.map