// API Service - Centralized HTTP client for backend communication

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

interface CVAnalysisJobResponse {
  success: boolean;
  jobId: string;
  message: string;
  status: string;
  estimatedTime: number;
  pollUrl: string;
}

interface CVAnalysisJobStatus {
  success: boolean;
  jobId: string;
  status: string;
  progress?: number;
  estimatedTimeRemaining?: number;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface CVAnalysisRequest {
  cvText: string;
  jobRequirements: string;
  userId: string;
}

interface CVAnalysisFileRequest {
  cvFile: File;
  jobRequirements: string;
  userId: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const requestId = Math.random().toString(36).substr(2, 9);

    console.log(`🌐 [API Service] Making request ${requestId}:`, {
      url,
      method: options.method || "GET",
      hasBody: !!options.body,
      bodyPreview: options.body
        ? String(options.body).substring(0, 200) + "..."
        : undefined,
      timestamp: new Date().toISOString(),
    });

    const defaultOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      const data = await response.json();

      console.log(`📊 [API Service] Response ${requestId}:`, {
        url,
        status: response.status,
        ok: response.ok,
        hasData: !!data,
        dataPreview: data
          ? JSON.stringify(data).substring(0, 200) + "..."
          : undefined,
        timestamp: new Date().toISOString(),
      });

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          code: data.code || "HTTP_ERROR",
          message: data.message || "Request failed",
        };
      }

      return {
        success: true,
        data,
        ...data,
      };
    } catch (error) {
      console.error(`❌ [API Service] Request ${requestId} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        code: "NETWORK_ERROR",
        message: "Failed to connect to server",
      };
    }
  }

  // CV Analysis API methods
  async createCVAnalysisJob(
    request: CVAnalysisRequest
  ): Promise<ApiResponse<CVAnalysisJobResponse>> {
    console.log("📡 [API Service] Creating CV analysis job:", {
      cvTextLength: request.cvText.length,
      jobRequirementsLength: request.jobRequirements.length,
      userId: request.userId,
      endpoint: "/api/ai/cv-analysis/async",
      timestamp: new Date().toISOString(),
    });

    const result = await this.request<CVAnalysisJobResponse>(
      "/api/ai/cv-analysis/async",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    console.log("📊 [API Service] CV analysis job creation result:", {
      success: result.success,
      jobId: result.data?.jobId,
      error: result.error,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  async createCVAnalysisJobFromFile(
    request: CVAnalysisFileRequest
  ): Promise<ApiResponse<CVAnalysisJobResponse>> {
    console.log("📡 [API Service] Creating CV analysis job from file:", {
      fileName: request.cvFile.name,
      fileSize: request.cvFile.size,
      fileType: request.cvFile.type,
      jobRequirementsLength: request.jobRequirements.length,
      userId: request.userId,
      endpoint: "/api/ai/cv-analysis/async/file",
      timestamp: new Date().toISOString(),
    });

    const formData = new FormData();
    formData.append("cvFile", request.cvFile);
    formData.append("jobRequirements", request.jobRequirements);
    formData.append("userId", request.userId);

    const result = await this.request<CVAnalysisJobResponse>(
      "/api/ai/cv-analysis/async/file",
      {
        method: "POST",
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
      }
    );

    console.log("📊 [API Service] CV analysis file job creation result:", {
      success: result.success,
      jobId: result.data?.jobId,
      error: result.error,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  async getCVAnalysisJobStatus(
    jobId: string
  ): Promise<ApiResponse<CVAnalysisJobStatus>> {
    console.log("📡 [API Service] Getting CV analysis job status:", {
      jobId,
      endpoint: `/api/ai/cv-analysis/jobs/${jobId}/status`,
      timestamp: new Date().toISOString(),
    });

    const result = await this.request<CVAnalysisJobStatus>(
      `/api/ai/cv-analysis/jobs/${jobId}/status`
    );

    console.log("📊 [API Service] CV analysis job status result:", {
      jobId,
      success: result.success,
      status: result.data?.status,
      progress: result.data?.progress,
      hasResult: !!result.data?.result,
      hasError: !!result.data?.error,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  async analyzeCVSync(request: CVAnalysisRequest): Promise<ApiResponse<any>> {
    return this.request("/api/ai/cv-analysis/sync", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getCVAnalysisQueueStats(): Promise<ApiResponse<any>> {
    return this.request("/api/ai/cv-analysis/stats");
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request("/health");
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types for use in components
export type {
  ApiResponse,
  CVAnalysisJobResponse,
  CVAnalysisJobStatus,
  CVAnalysisRequest,
  CVAnalysisFileRequest,
};
