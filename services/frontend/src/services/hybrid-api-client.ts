import { supabase } from '@/lib/supabase';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  creditsRemaining?: number;
  processingTime?: number;
}

// CV Analysis types
export interface CVAnalysisRequest {
  cvText: string;
  jobRequirements: string;
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

// Question generation types
export interface QuestionGenerationRequest {
  jobTitle: string;
  skills: string[];
  count: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  type?: 'technical' | 'behavioral' | 'mixed';
}

export interface Question {
  id: string;
  question: string;
  type: 'technical' | 'behavioral';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedAnswer?: string;
  scoringCriteria?: string[];
}

// Interview analysis types
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

// Payment types
export interface PaymentRequest {
  amount: number;
  currency: string;
  credits: number;
  description: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  paymentIntentId: string;
  clientSecret?: string;
  status: string;
  amount: number;
  currency: string;
  credits: number;
}

// Talent search types
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
  availability: 'available' | 'passive' | 'not_available';
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

class HybridApiClient {
  private customBackendUrl: string;
  private supabaseUrl: string;

  constructor() {
    this.customBackendUrl = import.meta.env.VITE_CUSTOM_BACKEND_URL || 'http://localhost:3000';
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!this.customBackendUrl) {
      console.warn('VITE_CUSTOM_BACKEND_URL not set, using localhost:3000');
    }
  }

  // Get authentication headers
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  // Make request to custom backend
  private async makeBackendRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.customBackendUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Backend request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Make request to Supabase Edge Function
  private async makeEdgeRequest<T>(
    functionName: string, 
    data?: any
  ): Promise<{ data: T | null; error: any }> {
    try {
      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: data,
      });

      return { data: result, error };
    } catch (error) {
      console.error(`Edge function request failed: ${functionName}`, error);
      return { data: null, error };
    }
  }

  // =================
  // AI OPERATIONS (Custom Backend)
  // =================

  async analyzeCV(request: CVAnalysisRequest): Promise<ApiResponse<CVAnalysisResult>> {
    return this.makeBackendRequest<CVAnalysisResult>('/api/ai/cv-analysis', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async batchAnalyzeCV(
    cvFiles: Array<{ cvText: string; candidateId: string }>,
    jobRequirements: string
  ): Promise<ApiResponse<Array<{ candidateId: string; result: CVAnalysisResult; error?: string }>>> {
    return this.makeBackendRequest('/api/ai/batch-cv-analysis', {
      method: 'POST',
      body: JSON.stringify({ cvFiles, jobRequirements }),
    });
  }

  async generateQuestions(request: QuestionGenerationRequest): Promise<ApiResponse<Question[]>> {
    return this.makeBackendRequest<Question[]>('/api/ai/generate-questions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async analyzeInterview(request: InterviewAnalysisRequest): Promise<ApiResponse<InterviewAnalysisResult>> {
    return this.makeBackendRequest<InterviewAnalysisResult>('/api/ai/analyze-interview', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateJobRequirements(jobInfo: any): Promise<ApiResponse<any>> {
    return this.makeBackendRequest('/api/ai/generate-job-requirements', {
      method: 'POST',
      body: JSON.stringify(jobInfo),
    });
  }

  async getAIStats(): Promise<ApiResponse<any>> {
    return this.makeBackendRequest('/api/ai/stats');
  }

  // =================
  // PAYMENT OPERATIONS (Custom Backend)
  // =================

  async processPayment(request: PaymentRequest): Promise<ApiResponse<PaymentResult>> {
    return this.makeBackendRequest<PaymentResult>('/api/payment/process', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async processRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<ApiResponse<any>> {
    return this.makeBackendRequest('/api/payment/refund', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId, amount, reason }),
    });
  }

  async createSetupIntent(): Promise<ApiResponse<any>> {
    return this.makeBackendRequest('/api/payment/setup-intent', {
      method: 'POST',
    });
  }

  async getPaymentMethods(): Promise<ApiResponse<any[]>> {
    return this.makeBackendRequest('/api/payment/payment-methods');
  }

  async getPaymentStatus(paymentIntentId: string): Promise<ApiResponse<any>> {
    return this.makeBackendRequest(`/api/payment/status/${paymentIntentId}`);
  }

  async createSubscription(priceId: string, metadata?: Record<string, string>): Promise<ApiResponse<any>> {
    return this.makeBackendRequest('/api/payment/subscription', {
      method: 'POST',
      body: JSON.stringify({ priceId, metadata }),
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<ApiResponse<any>> {
    return this.makeBackendRequest(`/api/payment/subscription/${subscriptionId}/cancel`, {
      method: 'POST',
    });
  }

  async getPaymentHistory(page = 1, limit = 10): Promise<ApiResponse<any>> {
    return this.makeBackendRequest(`/api/payment/history?page=${page}&limit=${limit}`);
  }

  // =================
  // TALENT SEARCH (Custom Backend)
  // =================

  async searchTalent(criteria: TalentSearchCriteria): Promise<ApiResponse<TalentSearchResult>> {
    return this.makeBackendRequest<TalentSearchResult>('/api/talent/search', {
      method: 'POST',
      body: JSON.stringify(criteria),
    });
  }

  async advancedTalentSearch(
    criteria: TalentSearchCriteria, 
    filters?: any
  ): Promise<ApiResponse<TalentSearchResult>> {
    return this.makeBackendRequest<TalentSearchResult>('/api/talent/search/advanced', {
      method: 'POST',
      body: JSON.stringify({ criteria, filters }),
    });
  }

  async batchTalentSearch(searches: TalentSearchCriteria[]): Promise<ApiResponse<TalentSearchResult[]>> {
    return this.makeBackendRequest('/api/talent/search/batch', {
      method: 'POST',
      body: JSON.stringify({ searches }),
    });
  }

  async getTalentProfile(profileId: string): Promise<ApiResponse<TalentProfile>> {
    return this.makeBackendRequest<TalentProfile>(`/api/talent/profile/${profileId}`);
  }

  async sendOutreachMessage(
    profileId: string, 
    message: { subject: string; content: string; templateId?: string; personalizedFields?: Record<string, string> }
  ): Promise<ApiResponse<any>> {
    return this.makeBackendRequest(`/api/talent/outreach/${profileId}`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async triggerWorkflow(workflowId: string, data: any, webhookUrl?: string): Promise<ApiResponse<any>> {
    return this.makeBackendRequest('/api/talent/workflow/trigger', {
      method: 'POST',
      body: JSON.stringify({ workflowId, data, webhookUrl }),
    });
  }

  async getWorkflowStatus(executionId: string): Promise<ApiResponse<any>> {
    return this.makeBackendRequest(`/api/talent/workflow/status/${executionId}`);
  }

  async cancelWorkflow(executionId: string): Promise<ApiResponse<any>> {
    return this.makeBackendRequest(`/api/talent/workflow/cancel/${executionId}`, {
      method: 'POST',
    });
  }

  async getTalentAnalytics(startDate: string, endDate: string, filters?: any): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({
      startDate,
      endDate,
      ...filters,
    });
    return this.makeBackendRequest(`/api/talent/analytics?${params}`);
  }

  // =================
  // CREDIT OPERATIONS (Supabase Edge Functions)
  // =================

  async addCredits(userId: string, credits: number, description?: string): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('add-credits', { userId, credits, description });
  }

  async deductCredits(userId: string, credits: number, description?: string): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('deduct-credits', { userId, credits, description });
  }

  async checkCreditBalance(userId: string): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('check-credit-balance', { userId });
  }

  async getCreditTransactions(userId: string, limit = 50, offset = 0): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('credit-usage-log', { userId, limit, offset });
  }

  // =================
  // ADMIN OPERATIONS (Supabase Edge Functions)
  // =================

  async adminGetUsers(page = 1, limit = 50): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('admin-get-users', { page, limit });
  }

  async adminGrantCredits(userId: string, credits: number, reason: string): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('admin-grant-credits', { userId, credits, reason });
  }

  async adminUpdateUser(userId: string, updates: any): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('admin-update-user', { userId, ...updates });
  }

  async adminSuspendUser(userId: string, reason: string): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('admin-suspend-user', { userId, reason });
  }

  async adminGetAnalytics(startDate: string, endDate: string): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('admin-get-analytics', { startDate, endDate });
  }

  async adminGetLogs(level = 'info', limit = 100): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('admin-get-logs', { level, limit });
  }

  async adminGenerateReports(type: string, filters?: any): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('admin-generate-reports', { type, ...filters });
  }

  // =================
  // INTERVIEW OPERATIONS (Supabase Edge Functions)
  // =================

  async createInterview(candidateId: string, questions: Question[]): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('create-interview', { candidateId, questions });
  }

  async getInterviews(userId: string, limit = 50, offset = 0): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('get-interviews', { userId, limit, offset });
  }

  async getInterviewData(interviewId: string): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('get-interview-data', { interviewId });
  }

  async saveInterviewAnswers(interviewId: string, answers: any[]): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('save-interview-answers', { interviewId, answers });
  }

  async sendInterviewInvitation(candidateId: string, interviewId: string, email: string): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('send-interview-invitation', { candidateId, interviewId, email });
  }

  // =================
  // CANDIDATE OPERATIONS (Supabase Edge Functions)
  // =================

  async fetchCandidates(userId: string, filters?: any): Promise<{ data: any; error: any }> {
    return this.makeEdgeRequest('fetch-candidates', { userId, ...filters });
  }

  // =================
  // HEALTH CHECKS
  // =================

  async checkBackendHealth(): Promise<ApiResponse<any>> {
    try {
      return await this.makeBackendRequest('/health');
    } catch (error) {
      return {
        success: false,
        error: 'Backend health check failed',
        message: (error as Error).message,
      };
    }
  }

  async checkAIHealth(): Promise<ApiResponse<any>> {
    try {
      return await this.makeBackendRequest('/api/ai/health');
    } catch (error) {
      return {
        success: false,
        error: 'AI service health check failed',
        message: (error as Error).message,
      };
    }
  }

  async checkPaymentHealth(): Promise<ApiResponse<any>> {
    try {
      return await this.makeBackendRequest('/api/payment/health');
    } catch (error) {
      return {
        success: false,
        error: 'Payment service health check failed',
        message: (error as Error).message,
      };
    }
  }

  async checkTalentHealth(): Promise<ApiResponse<any>> {
    try {
      return await this.makeBackendRequest('/api/talent/health');
    } catch (error) {
      return {
        success: false,
        error: 'Talent service health check failed',
        message: (error as Error).message,
      };
    }
  }

  // =================
  // UTILITY METHODS
  // =================

  async getRateLimitStatus(): Promise<ApiResponse<any>> {
    return this.makeBackendRequest('/api/rate-limit-status');
  }

  getBackendUrl(): string {
    return this.customBackendUrl;
  }

  getSupabaseUrl(): string {
    return this.supabaseUrl;
  }
}

// Create singleton instance
export const hybridApiClient = new HybridApiClient();

export default hybridApiClient;
