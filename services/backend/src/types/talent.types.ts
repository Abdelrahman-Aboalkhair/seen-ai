// Talent Service Types
export interface TalentSearchCriteria {
  jobTitle?: string;
  skills?: string[];
  location?: string;
  experience?: string;
  education?: string;
  salaryRange?: {
    min: number;
    max: number;
  };
  remote?: boolean;
  industry?: string;
  companySize?: string;
}

export interface TalentProfile {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  skills: string[];
  experience: number;
  location: string;
  education: string;
  summary: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  availability: "available" | "passive" | "not_available";
  expectedSalary?: number;
  remote: boolean;
  matchScore?: number;
}

export interface TalentSearchResult {
  profiles: TalentProfile[];
  totalCount: number;
  searchId: string;
  timestamp: string;
  criteria: TalentSearchCriteria;
}

export interface WorkflowTriggerRequest {
  workflowId: string;
  data: Record<string, any>;
  webhookUrl?: string;
}

export interface WorkflowTriggerResponse {
  executionId: string;
  status: "running" | "completed" | "failed";
  result?: any;
  error?: string;
}

export interface OutreachMessage {
  subject: string;
  content: string;
  templateId?: string;
  personalizedFields?: Record<string, string>;
}

export interface OutreachResult {
  messageId: string;
  status: string;
}

export interface SearchAnalyticsRequest {
  startDate: string;
  endDate: string;
  userId?: string;
  jobTitle?: string;
  location?: string;
}

export interface SearchAnalytics {
  totalSearches: number;
  totalProfiles: number;
  averageMatchScore: number;
  topSkills: string[];
  searchTrends: Array<{
    date: string;
    searchCount: number;
    profileCount: number;
  }>;
}

export interface AdvancedSearchFilters {
  excludeCompanies?: string[];
  includePassiveCandidates?: boolean;
  minMatchScore?: number;
  sortBy?: "relevance" | "experience" | "salary" | "location";
  limit?: number;
  offset?: number;
}
