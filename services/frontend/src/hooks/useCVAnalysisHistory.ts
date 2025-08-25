// CV Analysis History Hook using React Query

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../services/api";
import { useAuth } from "../lib/auth";
import toast from "react-hot-toast";

// Query keys for React Query
const CV_ANALYSIS_HISTORY_KEYS = {
  all: ["cv-analysis-history"] as const,
  user: (userId: string) =>
    [...CV_ANALYSIS_HISTORY_KEYS.all, "user", userId] as const,
  analysis: (analysisId: string) =>
    [...CV_ANALYSIS_HISTORY_KEYS.all, "analysis", analysisId] as const,
  stats: (userId: string) =>
    [...CV_ANALYSIS_HISTORY_KEYS.all, "stats", userId] as const,
};

export function useCVAnalysisHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get CV analysis history for a user
  const useAnalysisHistory = (
    userId: string,
    limit: number = 50,
    offset: number = 0,
    status?: string
  ) => {
    return useQuery({
      queryKey: CV_ANALYSIS_HISTORY_KEYS.user(userId),
      queryFn: () =>
        apiService.getCVAnalysisHistory(userId, limit, offset, status),
      enabled: !!userId && userId !== "anonymous",
      refetchInterval: 30000, // Refresh every 30 seconds
    });
  };

  // Get a specific CV analysis by ID
  const useAnalysisById = (analysisId: string | null) => {
    return useQuery({
      queryKey: CV_ANALYSIS_HISTORY_KEYS.analysis(analysisId || ""),
      queryFn: () => apiService.getCVAnalysisById(analysisId!),
      enabled: !!analysisId,
    });
  };

  // Get analysis statistics for a user
  const useAnalysisStats = (userId: string) => {
    return useQuery({
      queryKey: CV_ANALYSIS_HISTORY_KEYS.stats(userId),
      queryFn: () => apiService.getCVAnalysisStats(userId),
      enabled: !!userId && userId !== "anonymous",
      refetchInterval: 60000, // Refresh every minute
    });
  };

  // Delete CV analysis mutation
  const deleteAnalysisMutation = useMutation({
    mutationFn: (analysisId: string) => apiService.deleteCVAnalysis(analysisId),
    onSuccess: (data, analysisId) => {
      if (data.success) {
        toast.success("Analysis deleted successfully");
        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: CV_ANALYSIS_HISTORY_KEYS.all,
        });
      } else {
        toast.error(data.error || "Failed to delete analysis");
      }
    },
    onError: (error) => {
      console.error("Failed to delete CV analysis:", error);
      toast.error("Failed to delete analysis");
    },
  });

  // Helper function to delete analysis
  const deleteAnalysis = async (analysisId: string) => {
    return deleteAnalysisMutation.mutateAsync(analysisId);
  };

  return {
    // Queries
    useAnalysisHistory,
    useAnalysisById,
    useAnalysisStats,

    // Mutations
    deleteAnalysisMutation,
    deleteAnalysis,

    // Loading states
    isDeleting: deleteAnalysisMutation.isPending,

    // Error states
    deleteError: deleteAnalysisMutation.error,
  };
}
