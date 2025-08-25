// CV Analysis API Hook using React Query

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiService,
  type CVAnalysisRequest,
  type CVAnalysisFileRequest,
  type CVAnalysisJobResponse,
  type CVAnalysisJobStatus,
} from "../services/api";
import { useAuth } from "../lib/auth";
import toast from "react-hot-toast";
import { useTranslation } from "../lib/i18n";

// Query keys for React Query
const CV_ANALYSIS_KEYS = {
  all: ["cv-analysis"] as const,
  jobs: () => [...CV_ANALYSIS_KEYS.all, "jobs"] as const,
  job: (jobId: string) => [...CV_ANALYSIS_KEYS.jobs(), jobId] as const,
  stats: () => [...CV_ANALYSIS_KEYS.all, "stats"] as const,
};

export function useCVAnalysisAPI() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Create CV analysis job (async)
  const createJobMutation = useMutation({
    mutationFn: (request: CVAnalysisRequest) =>
      apiService.createCVAnalysisJob(request),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("CV analysis job created successfully");
        // Invalidate jobs list to refresh
        queryClient.invalidateQueries({ queryKey: CV_ANALYSIS_KEYS.jobs() });
      } else {
        toast.error(data.error || "An error occurred");
      }
    },
    onError: (error) => {
      console.error("Failed to create CV analysis job:", error);
      toast.error("An error occurred");
    },
  });

  // Create CV analysis job from file (async)
  const createFileJobMutation = useMutation({
    mutationFn: (request: CVAnalysisFileRequest) =>
      apiService.createCVAnalysisJobFromFile(request),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("CV analysis job created successfully from file");
        // Invalidate jobs list to refresh
        queryClient.invalidateQueries({ queryKey: CV_ANALYSIS_KEYS.jobs() });
      } else {
        toast.error(data.error || "An error occurred");
      }
    },
    onError: (error) => {
      console.error("Failed to create CV analysis job from file:", error);
      toast.error("An error occurred");
    },
  });

  // Get CV analysis job status
  const useJobStatus = (jobId: string | null, enabled: boolean = true) => {
    console.log("🔍 [Frontend Hook] useJobStatus called:", {
      jobId,
      enabled,
      timestamp: new Date().toISOString(),
    });

    return useQuery({
      queryKey: CV_ANALYSIS_KEYS.job(jobId || ""),
      queryFn: async () => {
        if (!jobId || jobId.trim() === "") {
          console.log("⚠️ [Frontend Hook] No valid job ID, throwing error");
          throw new Error("No valid job ID provided");
        }

        console.log("📡 [Frontend Hook] Fetching job status for:", jobId);
        const result = await apiService.getCVAnalysisJobStatus(jobId);
        console.log("📊 [Frontend Hook] Job status result:", {
          jobId,
          success: result.success,
          status: result.data?.status,
          hasResult: !!result.data?.result,
          hasError: !!result.data?.error,
        });
        return result;
      },
      enabled: enabled && !!jobId && jobId.trim() !== "",
      refetchInterval: (query) => {
        // Stop polling when job is completed or failed
        const status = query.state.data?.data?.status;
        console.log("🔄 [Frontend Hook] Refetch interval check:", {
          jobId,
          status,
          shouldPoll: !(status === "completed" || status === "failed"),
        });

        if (status === "completed" || status === "failed") {
          return false;
        }
        // Poll every 2 seconds for active jobs
        return 2000;
      },
      refetchIntervalInBackground: true,
    });
  };

  // Analyze CV synchronously (for backward compatibility)
  const analyzeSyncMutation = useMutation({
    mutationFn: (request: CVAnalysisRequest) =>
      apiService.analyzeCVSync(request),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("CV analysis completed successfully");
      } else {
        toast.error(data.error || "An error occurred");
      }
    },
    onError: (error) => {
      console.error("Synchronous CV analysis failed:", error);
      toast.error("An error occurred");
    },
  });

  // Get queue statistics
  const queueStatsQuery = useQuery({
    queryKey: CV_ANALYSIS_KEYS.stats(),
    queryFn: () => apiService.getCVAnalysisQueueStats(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Helper function to create CV analysis request
  const createCVAnalysisRequest = (
    cvText: string,
    jobRequirements: string
  ): CVAnalysisRequest => ({
    cvText,
    jobRequirements,
    userId: user?.id || "anonymous",
  });

  // Helper function to start async analysis
  const startAsyncAnalysis = async (
    cvText: string,
    jobRequirements: string
  ) => {
    const request = createCVAnalysisRequest(cvText, jobRequirements);
    return createJobMutation.mutateAsync(request);
  };

  // Helper function to start async analysis from file
  const startAsyncAnalysisFromFile = async (
    cvFile: File,
    jobRequirements: string
  ) => {
    const request: CVAnalysisFileRequest = {
      cvFile,
      jobRequirements,
      userId: user?.id || "anonymous",
    };
    return createFileJobMutation.mutateAsync(request);
  };

  // Helper function to start sync analysis
  const startSyncAnalysis = async (cvText: string, jobRequirements: string) => {
    const request = createCVAnalysisRequest(cvText, jobRequirements);
    return analyzeSyncMutation.mutateAsync(request);
  };

  return {
    // Mutations
    createJobMutation,
    createFileJobMutation,
    analyzeSyncMutation,

    // Queries
    useJobStatus,
    queueStatsQuery,

    // Helper functions
    createCVAnalysisRequest,
    startAsyncAnalysis,
    startAsyncAnalysisFromFile,
    startSyncAnalysis,

    // Loading states
    isCreatingJob: createJobMutation.isPending,
    isCreatingFileJob: createFileJobMutation.isPending,
    isAnalyzingSync: analyzeSyncMutation.isPending,

    // Error states
    createJobError: createJobMutation.error,
    createFileJobError: createFileJobMutation.error,
    analyzeSyncError: analyzeSyncMutation.error,
  };
}
