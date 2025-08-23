export interface CVAnalysisRequest {
    cvText: string;
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
    department?: string;
    experience?: string;
    location?: string;
    companySize?: string;
    industry?: string;
}
export interface JobRequirementsResult {
    title: string;
    description: string;
    requirements: {
        technical: string[];
        soft: string[];
        experience: string[];
        education: string[];
    };
    responsibilities: string[];
    qualifications: string[];
    preferredQualifications: string[];
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
//# sourceMappingURL=ai.types.d.ts.map