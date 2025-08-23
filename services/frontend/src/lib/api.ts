import { config } from "./config";
import { supabase } from "./supabase";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  creditsRemaining?: number;
  processingTime?: number;
}

export class BackendApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.backendApiUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Talent Search API
  async searchTalent(searchCriteria: any): Promise<ApiResponse> {
    return this.request('/api/talent/search', {
      method: 'POST',
      body: JSON.stringify(searchCriteria),
    });
  }

  // AI API endpoints
  async generateQuestions(data: any): Promise<ApiResponse> {
    return this.request('/api/ai/generate-questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeCv(data: any): Promise<ApiResponse> {
    return this.request('/api/ai/cv-analysis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeInterview(data: any): Promise<ApiResponse> {
    return this.request('/api/ai/analyze-interview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateJobRequirements(data: any): Promise<ApiResponse> {
    return this.request('/api/ai/job-requirements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Payment API endpoints
  async createPaymentIntent(data: any): Promise<ApiResponse> {
    return this.request('/api/payment/create-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentStatus(paymentIntentId: string): Promise<ApiResponse> {
    return this.request(`/api/payment/status/${paymentIntentId}`, {
      method: 'GET',
    });
  }

  // Test endpoints (no auth required)
  async testPing(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/test/ping`);
      return await response.json();
    } catch (error) {
      console.error('Test ping failed:', error);
      throw error;
    }
  }

  async testGenerateQuestions(data: any): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/test/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Test question generation failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const backendApi = new BackendApiClient();

// Export default
export default backendApi;