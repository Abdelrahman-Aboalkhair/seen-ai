import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import {
  TalentSearchForm,
  SearchResult,
  Candidate,
  MATCH_SCORE_TYPES,
} from "../types";
import { useCreditBalance } from "../../../hooks/useCreditBalance";
import toast from "react-hot-toast";

export const useTalentSearch = () => {
  const { balance, deductCredits } = useCreditBalance();
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Candidate[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  // Form state
  const [formData, setFormData] = useState<TalentSearchForm>({
    jobTitle: "",
    jobDescription: "",
    skillsRequired: "",
    certifications: "",
    educationLevel: "",
    languages: "",
    numberOfCandidates: 5,
    matchScoreType: "balanced",
  });

  // Calculate total cost when inputs change
  useEffect(() => {
    const scoreTypeData = MATCH_SCORE_TYPES[formData.matchScoreType];
    const cost = formData.numberOfCandidates * scoreTypeData.total;
    setTotalCost(cost);
  }, [formData.numberOfCandidates, formData.matchScoreType]);

  // Update form data
  const updateFormData = (updates: Partial<TalentSearchForm>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Handle search
  const handleSearch = async () => {
    if (balance < totalCost) {
      toast.error("Insufficient credits");
      return;
    }

    if (!formData.jobTitle.trim() || !formData.skillsRequired.trim()) {
      toast.error("Please fill in required fields");
      return;
    }

    setSearching(true);

    try {
      // Add a minimum delay to show the loading animation
      const minDelay = new Promise((resolve) => setTimeout(resolve, 3000));

      // Call the Edge Function for real AI processing
      const searchPromise = supabase.functions.invoke("talent-search", {
        body: formData,
      });

      // Wait for both the minimum delay and the actual API call
      const [data, error] = await Promise.all([searchPromise, minDelay]).then(
        ([result]) => [result.data, result.error]
      );

      if (error) {
        throw error;
      }

      // Check for error in response body
      if (data?.error) {
        throw new Error(data.error.message || "Unknown error occurred");
      }

      if (!data || !data.data || !data.data.candidates) {
        throw new Error("No candidates found");
      }

      setResults(data.data.candidates);
      setShowResults(true);
      toast.success(`Found ${data.data.candidates.length} candidates!`);
    } catch (error: any) {
      console.error("Talent Search error:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setSearching(false);
    }
  };

  // Reset search
  const resetSearch = () => {
    setResults([]);
    setShowResults(false);
  };

  // Apply requirements from generator
  const applyRequirements = (requirements: any) => {
    setFormData((prev) => ({
      ...prev,
      jobTitle: requirements.jobTitle,
      jobDescription: requirements.requirements,
      skillsRequired: requirements.skills.join(", "),
      certifications: requirements.certificates.join(", "),
      educationLevel: requirements.educationLevel,
    }));
    toast.success("Requirements applied successfully");
  };

  return {
    formData,
    updateFormData,
    searching,
    results,
    showResults,
    totalCost,
    balance,
    handleSearch,
    resetSearch,
    applyRequirements,
  };
};
