export interface TalentSearchForm {
  jobTitle: string;
  jobDescription: string;
  skillsRequired: string;
  certifications: string;
  educationLevel: string;
  languages: string;
  numberOfCandidates: number;
  matchScoreType: string;
}

export interface Candidate {
  id?: string;
  full_name: string;
  current_position?: string;
  linkedin_url?: string;
  match_score: number;
  skills_match: string;
  experience_match: string;
  summary?: string;
  ranking: number;
  education_match: string;
  culture_fit: string;
  strengths: string;
  gaps: string;
  
  // Legacy fields for backward compatibility
  email?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  experience_years?: number;
  education_level?: string;
  certifications?: string[];
  languages?: string[];
  resume_url?: string;
  github_url?: string;
  portfolio_url?: string;
  availability?: string;
  salary_expectation?: string;
  created_at?: string;
}

export interface SearchResult {
  candidates: Candidate[];
  totalFound: number;
  searchId: string;
  remainingCredits: number;
}

export interface MatchScoreType {
  percentage: number;
  baseCost: number;
  extraCost: number;
  total: number;
}

export interface SearchFilters {
  sortBy: "match_score" | "name" | "experience" | "location";
  filterByScore: "all" | "high" | "medium" | "low";
  filterByLocation?: string;
  filterByExperience?: string;
}

export const MATCH_SCORE_TYPES: Record<string, MatchScoreType> = {
  quick: { percentage: 50, baseCost: 10, extraCost: 0, total: 10 },
  balanced: { percentage: 60, baseCost: 10, extraCost: 5, total: 15 },
  detailed: { percentage: 70, baseCost: 10, extraCost: 10, total: 20 },
  comprehensive: { percentage: 80, baseCost: 10, extraCost: 15, total: 25 },
} as const;

export const EDUCATION_LEVELS = [
  { value: "high_school", label: "High School" },
  { value: "associate", label: "Associate Degree" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "phd", label: "PhD" },
  { value: "certification", label: "Certification" },
  { value: "bootcamp", label: "Bootcamp" },
  { value: "self_taught", label: "Self-Taught" },
] as const;

export const CANDIDATE_COUNT_OPTIONS = [
  { value: 1, label: "1 candidate" },
  { value: 2, label: "2 candidates" },
  { value: 3, label: "3 candidates" },
  { value: 5, label: "5 candidates" },
  { value: 10, label: "10 candidates" },
  { value: 15, label: "15 candidates" },
  { value: 20, label: "20 candidates" },
] as const;
