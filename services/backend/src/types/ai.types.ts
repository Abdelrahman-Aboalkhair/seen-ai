// AI Service Types
export interface CVAnalysisRequest {
  cvText?: string; // Optional: for text input
  cvFile?: Express.Multer.File; // Optional: for file uploads
  cvFileUrl?: string; // Optional: Cloudinary URL for processed files
  cvPublicId?: string; // Optional: Cloudinary public ID for processed files
  jobRequirements: string;
  userId: string;
}

export interface CVAnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keySkills: string[];
  experience: {
    years: number;
    relevantExperience: string[];
  };
  education: {
    degree: string;
    relevantCourses: string[];
  };
  summary: string;
  matchPercentage: number;
}

export interface QuestionGenerationRequest {
  jobTitle: string;
  skills: string[];
  count: number;
  difficulty?: "easy" | "medium" | "hard";
  type?: "technical" | "behavioral" | "mixed";
}

export interface Question {
  id: string;
  question: string;
  type: "technical" | "behavioral";
  difficulty: "easy" | "medium" | "hard";
  expectedAnswer?: string;
  scoringCriteria?: string[];
}

export interface InterviewAnalysisRequest {
  sessionId: string;
  questions: Question[];
  answers: Array<{
    questionId: string;
    answer: string;
    duration: number;
  }>;
}

export interface InterviewAnalysisResult {
  overallScore: number;
  questionScores: Array<{
    questionId: string;
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>;
  summary: string;
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface JobRequirementsRequest {
  jobTitle: string;
  industry?: string;
  seniority?: string;
  companySize?: string;
  location?: string;
  userId: string;
}

export interface JobRequirementsResult {
  jobTitle: string;
  summary: string;
  keyResponsibilities: string[];
  requiredSkills: {
    technical: string[];
    soft: string[];
    certifications: string[];
  };
  preferredSkills: {
    technical: string[];
    soft: string[];
    certifications: string[];
  };
  experience: {
    minimumYears: number;
    preferredYears: number;
    relevantExperience: string[];
  };
  education: {
    minimum: string;
    preferred: string;
    relevantFields: string[];
  };
  qualifications: {
    essential: string[];
    desired: string[];
  };
  benefits: string[];
  workEnvironment: string;
  careerGrowth: string;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  employmentType: string;
  location: string;
  remotePolicy: string;
}

export interface BatchCVAnalysisItem {
  cvText: string;
  candidateId: string;
}

export interface BatchCVAnalysisResult {
  candidateId: string;
  result: CVAnalysisResult;
  error?: string;
}
