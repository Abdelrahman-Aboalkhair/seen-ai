import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

interface InterviewAnalysis {
  id: string;
  session_id: string;
  test_type: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  analysis_data: any;
  created_at: string;
}

interface InterviewSession {
  id: string;
  interview_id: string;
  candidate_id: string;
  session_token: string;
  status: "pending" | "started" | "completed" | "expired";
  started_at?: string;
  completed_at?: string;
  expires_at: string;
  created_at: string;
  interview_candidates: {
    name: string;
    email: string;
  };
  interviews: {
    job_title: string;
    job_description: string;
    test_types: string[];
  };
}

export const useInterviewResults = (interviewId: string | undefined) => {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [analyses, setAnalyses] = useState<InterviewAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInterviewResults = useCallback(async () => {
    if (!interviewId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.functions.invoke(
        "get-interview-data",
        {
          method: "POST",
          body: {
            interviewId,
            includeResults: true,
          },
        }
      );

      if (fetchError) throw fetchError;

      if (!data.success) {
        throw new Error(
          data.error?.message || "Failed to fetch interview results"
        );
      }

      setSessions(data.data.sessions || []);
      setAnalyses(data.data.analyses || []);
    } catch (error: any) {
      console.error("Error loading interview results:", error);
      setError(error.message);
      toast.error("فشل في تحميل نتائج المقابلة");
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    loadInterviewResults();
  }, [loadInterviewResults]);

  const getSessionAnalyses = useCallback(
    (sessionId: string) => {
      return analyses.filter((a) => a.session_id === sessionId);
    },
    [analyses]
  );

  const getOverallAnalysis = useCallback(
    (sessionId: string) => {
      const overallAnalyses = analyses.filter(
        (a) => a.session_id === sessionId && a.test_type === "overall"
      );
      return overallAnalyses.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
    },
    [analyses]
  );

  const getTestTypeAnalyses = useCallback(
    (sessionId: string) => {
      const testAnalyses = analyses.filter(
        (a) => a.session_id === sessionId && a.test_type !== "overall"
      );

      const groupedByType = testAnalyses.reduce((acc, analysis) => {
        if (
          !acc[analysis.test_type] ||
          new Date(analysis.created_at) >
            new Date(acc[analysis.test_type].created_at)
        ) {
          acc[analysis.test_type] = analysis;
        }
        return acc;
      }, {} as Record<string, any>);

      return Object.values(groupedByType);
    },
    [analyses]
  );

  return {
    sessions,
    analyses,
    loading,
    error,
    refetch: loadInterviewResults,
    getSessionAnalyses,
    getOverallAnalysis,
    getTestTypeAnalyses,
  };
};
