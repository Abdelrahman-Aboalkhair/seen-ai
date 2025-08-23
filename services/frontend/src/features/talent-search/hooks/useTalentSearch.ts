import { useState, useEffect } from "react";
import { backendApi } from "../../../lib/api";
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

  // Transform frontend form data to backend API format
  const transformFormData = (formData: TalentSearchForm) => {
    return {
      jobTitle: formData.jobTitle.trim(),
      skills: formData.skillsRequired
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0),
      location: "", // Add location field to form if needed
      experience: "", // Add experience field to form if needed
      education: formData.educationLevel,
      remote: false, // Add remote field to form if needed
      industry: "", // Add industry field to form if needed
      companySize: "", // Add company size field to form if needed
      // Additional metadata for processing
      jobDescription: formData.jobDescription,
      certifications: formData.certifications,
      languages: formData.languages,
      numberOfCandidates: formData.numberOfCandidates,
      matchScoreType: formData.matchScoreType,
    };
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

      // Transform form data to backend API format
      const searchCriteria = transformFormData(formData);

      // Call the backend API for talent search
      const searchPromise = backendApi.searchTalent(searchCriteria);

      // Wait for both the minimum delay and the actual API call
      const [apiResponse] = await Promise.all([searchPromise, minDelay]);

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || apiResponse.error || "Search failed");
      }

      if (!apiResponse.data || !apiResponse.data.profiles) {
        throw new Error("No candidates found");
      }

      // Transform backend response to frontend format
      const candidates = apiResponse.data.profiles.map((profile: any, index: number) => ({
        id: profile.id || `candidate-${index}`,
        full_name: profile.name || profile.full_name || "Unknown",
        current_position: profile.position || profile.current_position,
        linkedin_url: profile.linkedinUrl || profile.linkedin_url,
        match_score: profile.matchScore || profile.match_score || 0,
        skills_match: profile.skillsMatch || profile.skills_match || "",
        experience_match: profile.experienceMatch || profile.experience_match || "",
        summary: profile.summary || "",
        ranking: index + 1,
        education_match: profile.educationMatch || profile.education_match || "",
        culture_fit: profile.cultureFit || profile.culture_fit || "",
        strengths: profile.strengths || "",
        gaps: profile.gaps || "",
        // Legacy fields
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        skills: profile.skills || [],
        experience_years: profile.experienceYears || profile.experience_years,
        education_level: profile.educationLevel || profile.education_level,
        certifications: profile.certifications || [],
        languages: profile.languages || [],
        resume_url: profile.resumeUrl || profile.resume_url,
        github_url: profile.githubUrl || profile.github_url,
        portfolio_url: profile.portfolioUrl || profile.portfolio_url,
        availability: profile.availability,
        salary_expectation: profile.salaryExpectation || profile.salary_expectation,
        created_at: profile.createdAt || profile.created_at,
      }));

      setResults(candidates);
      setShowResults(true);
      
      // Update credit balance if provided
      if (apiResponse.creditsRemaining !== undefined) {
        // The backend handles credit deduction, so we don't need to call deductCredits
        // Just show the updated balance in the UI
      }
      
      toast.success(`Found ${candidates.length} candidates!`);
    } catch (error: any) {
      console.error("Talent Search error:", error);
      toast.error(error.message || "An error occurred during search");
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
