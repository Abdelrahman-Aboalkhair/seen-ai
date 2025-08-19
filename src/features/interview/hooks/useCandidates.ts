import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Candidate } from "../types";
import toast from "react-hot-toast";

export const useCandidates = () => {
  const [availableCandidates, setAvailableCandidates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch candidates from talent_searches
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "fetch-candidates",
        {
          body: {},
        }
      );

      if (error) throw error;

      if (data?.success) {
        setAvailableCandidates(data.data.candidates);
      }
    } catch (error: any) {
      console.error("Error fetching candidates:", error);
      toast.error("حدث خطأ أثناء جلب المرشحين");
    } finally {
      setLoading(false);
    }
  };

  // Filter candidates based on search query
  const filteredCandidates = availableCandidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Convert talent search candidate to interview candidate
  const convertToInterviewCandidate = (candidate: any): Candidate => ({
    candidateId: candidate.id,
    name: candidate.name,
    email: candidate.email,
    resumeUrl: candidate.resume_url,
    status: "pending",
  });

  // Add manual candidate
  const createManualCandidate = (name: string, email: string): Candidate => ({
    name,
    email,
    status: "pending",
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

  return {
    availableCandidates,
    filteredCandidates,
    searchQuery,
    setSearchQuery,
    loading,
    fetchCandidates,
    convertToInterviewCandidate,
    createManualCandidate,
  };
};
