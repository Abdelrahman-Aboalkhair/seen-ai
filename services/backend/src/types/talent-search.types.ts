// Talent Search Types - Matching N8N format

// N8N Request Format
export interface N8NTalentSearchRequest {
  sessionId: string;
  chatInput: string;
  jobDescription: string;
  skillsRequired: string;
  certifications: string;
  education: string;
  languages: string;
  location: string;
  numberOfCandidates: number;
  matchScore: number;
}

// N8N Response Format
export interface N8NTalentSearchResponse {
  callbackId: string;
  status: string;
  totalProfiles: number;
  candidates: N8NCandidate[];
}

export interface N8NCandidate {
  matchScore: number;
  ranking: string;
  summary: string;
  analysis: {
    skillsMatch: string;
    experienceMatch: string;
    educationMatch: string;
    cultureFit: string;
    strengths: string[];
    gaps: string[];
  };
  candidate: {
    name: string;
    headline: string;
    profileUrl: string;
  };
  sheetUrl: string;
}

// Job Processing Types
export interface TalentSearchJob {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  criteria: TalentSearchCriteria;
  result?: TalentSearchResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  processingTime?: number;
}

export interface JobStatusResponse {
  success: boolean;
  jobId: string;
  status: string;
  progress?: number;
  estimatedTimeRemaining?: number;
  result?: TalentSearchResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy types for backward compatibility
export interface TalentSearchCriteria {
  jobTitle?: string;
  skills?: string[];
  location?: string;
  experience?: {
    min?: number;
    max?: number;
  };
  education?: string[];
  availability?: "immediate" | "2-weeks" | "1-month" | "flexible";
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  remote?: boolean;
  keywords?: string[];
  // N8N specific properties
  sessionId?: string;
  certifications?: string;
  languages?: string;
  numberOfCandidates?: number;
  matchScore?: number;
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
  companySize?: "startup" | "mid-size" | "enterprise";
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

// New async response types
export interface AsyncTalentSearchResponse {
  success: boolean;
  jobId: string;
  message: string;
  status: string;
  estimatedTime: number; // in seconds
  pollUrl: string;
}
