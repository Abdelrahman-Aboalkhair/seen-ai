export interface InterviewData {
  id?: string;
  jobTitle: string;
  jobDescription: string;
  numQuestions: number;
  interviewType: string;
  durationMinutes: number;
  interviewMode: string;
  questions: Question[];
  candidates: Candidate[];
  currentStep: number;
}

export interface Question {
  id?: string;
  questionText: string;
  questionType: string;
  isAiGenerated: boolean;
  orderIndex: number;
}

export interface Candidate {
  id?: string;
  candidateId?: string;
  name: string;
  email: string;
  resumeUrl?: string;
  status: string;
  // Additional fields from talent search
  searchId?: string;
  searchCreatedAt?: string;
  matchScore?: number;
  skills?: string[];
  experienceYears?: number;
  educationLevel?: string;
  location?: string;
}

export interface InterviewResult {
  id?: string;
  interviewId: string;
  candidateId: string;
  score: number;
  notes: string;
  durationMinutes: number;
  questionsAnswered: number;
  totalQuestions: number;
  biometricAnalysis: BiometricAnalysis;
}

export interface BiometricAnalysis {
  confidence_level: number;
  engagement_score: number;
  stress_level: number;
  eye_contact: number;
  body_language: number;
  voice_clarity: number;
  notes: string;
}

export interface Step {
  id: number;
  title: string;
  icon: any;
  description: string;
}

export const INTERVIEW_TYPES = [
  { value: "comprehensive", label: "شاملة" },
  { value: "technical", label: "تقنية" },
  { value: "behavioral", label: "سلوكية" },
  { value: "mixed", label: "مختلطة" },
] as const;

export const INTERVIEW_MODES = [
  { value: "biometric_with_questions", label: "بيومتري مع أسئلة" },
  { value: "questions_only", label: "أسئلة فقط" },
  { value: "biometric_only", label: "بيومتري فقط" },
] as const;

export const DURATION_OPTIONS = [
  { value: 15, label: "15 دقيقة" },
  { value: 30, label: "30 دقيقة" },
  { value: 45, label: "45 دقيقة" },
  { value: 60, label: "60 دقيقة" },
] as const;
