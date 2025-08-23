// Talent Search Types - Clean and focused

export interface TalentSearchCriteria {
  jobTitle?: string;
  skills?: string[];
  location?: string;
  experience?: {
    min?: number;
    max?: number;
  };
  education?: string[];
  availability?: 'immediate' | '2-weeks' | '1-month' | 'flexible';
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  remote?: boolean;
  keywords?: string[];
}

export interface TalentSearchResult {
  profiles: TalentProfile[];
  totalCount: number;
  searchId: string;
  timestamp: string;
  criteria: TalentSearchCriteria;
}

export interface TalentProfile {
  id: string;
  name: string;
  title: string;
  skills: string[];
  experience: number;
  location: string;
  availability: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  remote: boolean;
  education: string[];
  matchScore: number;
  lastActive: string;
}

export interface AdvancedSearchFilters {
  industry?: string[];
  companySize?: 'startup' | 'mid-size' | 'enterprise';
  technologies?: string[];
  certifications?: string[];
  languages?: string[];
  visaStatus?: string;
  relocation?: boolean;
}

export interface TalentSearchRequest {
  criteria: TalentSearchCriteria;
  filters?: AdvancedSearchFilters;
  userId: string;
}

export interface TalentSearchResponse {
  success: boolean;
  data?: TalentSearchResult;
  error?: string;
  code?: string;
  message?: string;
  creditsRemaining?: number;
  processingTime?: number;
}
