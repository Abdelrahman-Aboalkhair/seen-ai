import { useState, useCallback } from "react";
import { useAuth } from "../lib/auth";
import toast from "react-hot-toast";

// Backend API configuration
const BACKEND_BASE_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

export interface InterviewAnalysisJob {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  estimatedTime: number;
  pollUrl: string;
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

export interface InterviewAnalysisJobStatus {
  success: boolean;
  jobId: string;
  status: string;
  progress?: number;
  estimatedTimeRemaining?: number;
  result?: InterviewAnalysisResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export function useInterviewAnalysis() {
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<InterviewAnalysisJobStatus | null>(
    null
  );

  /**
   * Start async interview analysis from session
   */
  const startInterviewAnalysis = useCallback(
    async (
      sessionId: string,
      testType: string = "overall"
    ): Promise<InterviewAnalysisJob | null> => {
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return null;
      }

      if (!sessionId) {
        toast.error("معرف الجلسة مطلوب");
        return null;
      }

      setAnalyzing(true);
      setJobId(null);
      setJobStatus(null);

      try {
        console.log("🚀 [Frontend] Starting interview analysis:", {
          sessionId,
          testType,
        });

        const response = await fetch(
          `${BACKEND_BASE_URL}/api/ai/interview-analysis/session/${sessionId}/analyze`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.access_token}`,
            },
            body: JSON.stringify({ testType }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "فشل في بدء تحليل المقابلة");
        }

        const job: InterviewAnalysisJob = {
          jobId: data.jobId,
          status: data.status,
          estimatedTime: data.estimatedTime,
          pollUrl: data.pollUrl,
        };

        setJobId(data.jobId);
        setJobStatus({
          success: true,
          jobId: data.jobId,
          status: data.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        console.log("✅ [Frontend] Interview analysis job created:", job);
        toast.success("تم بدء تحليل المقابلة بنجاح");

        return job;
      } catch (error: any) {
        console.error(
          "❌ [Frontend] Failed to start interview analysis:",
          error
        );
        toast.error(error.message || "فشل في بدء تحليل المقابلة");
        return null;
      } finally {
        setAnalyzing(false);
      }
    },
    [user]
  );

  /**
   * Check job status
   */
  const checkJobStatus = useCallback(
    async (jobId: string): Promise<InterviewAnalysisJobStatus | null> => {
      if (!user || !jobId) {
        return null;
      }

      try {
        const response = await fetch(
          `${BACKEND_BASE_URL}/api/ai/interview-analysis/jobs/${jobId}/status`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${user.access_token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "فشل في جلب حالة الوظيفة");
        }

        setJobStatus(data);
        return data;
      } catch (error: any) {
        console.error("❌ [Frontend] Failed to check job status:", error);
        return null;
      }
    },
    [user]
  );

  /**
   * Poll job status until completion
   */
  const pollJobStatus = useCallback(
    async (
      jobId: string,
      onProgress?: (status: InterviewAnalysisJobStatus) => void,
      onComplete?: (result: InterviewAnalysisResult) => void,
      onError?: (error: string) => void
    ): Promise<InterviewAnalysisResult | null> => {
      if (!jobId) return null;

      const maxAttempts = 60; // 5 minutes with 5-second intervals
      let attempts = 0;

      const poll = async (): Promise<InterviewAnalysisResult | null> => {
        if (attempts >= maxAttempts) {
          const error = "انتهت مهلة انتظار تحليل المقابلة";
          onError?.(error);
          throw new Error(error);
        }

        attempts++;
        console.log(
          `🔍 [Frontend] Polling job status (attempt ${attempts}/${maxAttempts}):`,
          jobId
        );

        const status = await checkJobStatus(jobId);
        if (!status) {
          throw new Error("فشل في جلب حالة الوظيفة");
        }

        onProgress?.(status);

        if (status.status === "completed" && status.result) {
          console.log(
            "✅ [Frontend] Interview analysis completed:",
            status.result
          );
          onComplete?.(status.result);
          return status.result;
        }

        if (status.status === "failed") {
          const error = status.error || "فشل في تحليل المقابلة";
          onError?.(error);
          throw new Error(error);
        }

        // Wait 5 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return poll();
      };

      try {
        return await poll();
      } catch (error: any) {
        console.error("❌ [Frontend] Job polling failed:", error);
        toast.error(error.message || "فشل في انتظار تحليل المقابلة");
        return null;
      }
    },
    [checkJobStatus]
  );

  /**
   * Get interview analysis results by session ID
   */
  const getAnalysisResults = useCallback(
    async (sessionId: string): Promise<InterviewAnalysisResult[]> => {
      if (!user || !sessionId) {
        return [];
      }

      try {
        const response = await fetch(
          `${BACKEND_BASE_URL}/api/ai/interview-analysis/session/${sessionId}/results`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${user.access_token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "فشل في جلب نتائج التحليل");
        }

        return data.data.results || [];
      } catch (error: any) {
        console.error("❌ [Frontend] Failed to get analysis results:", error);
        toast.error(error.message || "فشل في جلب نتائج التحليل");
        return [];
      }
    },
    [user]
  );

  /**
   * Get interview analysis results by interview ID
   */
  const getAnalysisResultsByInterview = useCallback(
    async (interviewId: string): Promise<InterviewAnalysisResult[]> => {
      if (!user || !interviewId) {
        return [];
      }

      try {
        const response = await fetch(
          `${BACKEND_BASE_URL}/api/ai/interview-analysis/interview/${interviewId}/results`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${user.access_token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "فشل في جلب نتائج التحليل");
        }

        return data.data.results || [];
      } catch (error: any) {
        console.error("❌ [Frontend] Failed to get analysis results:", error);
        toast.error(error.message || "فشل في جلب نتائج التحليل");
        return [];
      }
    },
    [user]
  );

  return {
    analyzing,
    jobId,
    jobStatus,
    startInterviewAnalysis,
    checkJobStatus,
    pollJobStatus,
    getAnalysisResults,
    getAnalysisResultsByInterview,
  };
}
