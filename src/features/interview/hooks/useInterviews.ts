import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";

interface Interview {
  id: string;
  job_title: string;
  job_description: string;
  test_types: string[];
  duration_minutes: number;
  status: string;
  created_at: string;
  expires_at: string;
  _count?: {
    interview_sessions: number;
    interview_candidates: number;
  };
}

export const useInterviews = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("interviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setInterviews(data || []);
    } catch (err: any) {
      console.error("Error fetching interviews:", err);
      setError(err.message);
      toast.error("فشل في تحميل المقابلات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const deleteInterview = async (interviewId: string) => {
    try {
      const { error } = await supabase
        .from("interviews")
        .delete()
        .eq("id", interviewId);

      if (error) throw error;

      setInterviews((prev) => prev.filter((i) => i.id !== interviewId));
      toast.success("تم حذف المقابلة بنجاح");
    } catch (err: any) {
      console.error("Error deleting interview:", err);
      toast.error("فشل في حذف المقابلة");
    }
  };

  return {
    interviews,
    loading,
    error,
    refetch: fetchInterviews,
    deleteInterview,
  };
};
