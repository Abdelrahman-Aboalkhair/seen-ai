// CV Analysis Store using Zustand

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface CVAnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keySkills: string[];
  experience: {
    years: number;
    relevantExperience: string[];
  };
  education: {
    degree: string;
    relevantCourses: string[];
  };
  summary: string;
  matchPercentage: number;
}

export interface CVAnalysisJob {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  request: {
    cvText: string;
    jobRequirements: string;
    userId: string;
  };
  result?: CVAnalysisResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  processingTime?: number;
}

interface CVAnalysisState {
  // Current analysis state
  currentJobId: string | null;
  isAnalyzing: boolean;
  analysisProgress: number;

  // Results
  results: CVAnalysisResult[];
  showResults: boolean;

  // Form state
  jobTitle: string;
  jobDescription: string;
  skillsRequired: string;
  cvText: string;

  // UI state
  sortBy: "score" | "matchPercentage" | "experience";
  filterByScore: "all" | "high" | "medium" | "low";

  // Actions
  setCurrentJob: (jobId: string | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setAnalysisProgress: (progress: number) => void;
  setResults: (results: CVAnalysisResult[]) => void;
  setShowResults: (show: boolean) => void;
  addResult: (result: CVAnalysisResult) => void;
  clearResults: () => void;

  // Form actions
  setJobTitle: (title: string) => void;
  setJobDescription: (description: string) => void;
  setSkillsRequired: (skills: string) => void;
  setCVText: (text: string) => void;
  resetForm: () => void;

  // UI actions
  setSortBy: (sortBy: "score" | "matchPercentage" | "experience") => void;
  setFilterByScore: (filter: "all" | "high" | "medium" | "low") => void;

  // Computed values
  getFilteredAndSortedResults: () => CVAnalysisResult[];
  getTotalCost: () => number;
}

const CREDITS_COST = 5;

export const useCVAnalysisStore = create<CVAnalysisState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentJobId: null,
      isAnalyzing: false,
      analysisProgress: 0,
      results: [],
      showResults: false,
      jobTitle: "",
      jobDescription: "",
      skillsRequired: "",
      cvText: "",
      sortBy: "score",
      filterByScore: "all",

      // Actions
      setCurrentJob: (jobId) => {
        console.log("🏪 [CV Store] setCurrentJob called:", {
          previousJobId: get().currentJobId,
          newJobId: jobId,
          timestamp: new Date().toISOString(),
        });
        set({ currentJobId: jobId });
        console.log(
          "🏪 [CV Store] currentJobId updated to:",
          get().currentJobId
        );
      },
      setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
      setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
      setResults: (results) =>
        set({ results, showResults: results.length > 0 }),
      setShowResults: (show) => set({ showResults: show }),
      addResult: (result) =>
        set((state) => ({
          results: [...state.results, result],
          showResults: true,
        })),
      clearResults: () => set({ results: [], showResults: false }),

      // Form actions
      setJobTitle: (title) => set({ jobTitle: title }),
      setJobDescription: (description) => set({ jobDescription: description }),
      setSkillsRequired: (skills) => set({ skillsRequired: skills }),
      setCVText: (text) => set({ cvText: text }),
      resetForm: () =>
        set({
          jobTitle: "",
          jobDescription: "",
          skillsRequired: "",
          cvText: "",
          currentJobId: null,
          isAnalyzing: false,
          analysisProgress: 0,
        }),

      // UI actions
      setSortBy: (sortBy) => set({ sortBy }),
      setFilterByScore: (filter) => set({ filterByScore: filter }),

      // Computed values
      getFilteredAndSortedResults: () => {
        const { results, filterByScore, sortBy } = get();
        let filteredResults = [...results];

        // Filter by score
        if (filterByScore === "high") {
          filteredResults = filteredResults.filter((r) => r.score >= 80);
        } else if (filterByScore === "medium") {
          filteredResults = filteredResults.filter(
            (r) => r.score >= 60 && r.score < 80
          );
        } else if (filterByScore === "low") {
          filteredResults = filteredResults.filter((r) => r.score < 60);
        }

        // Sort results
        filteredResults.sort((a, b) => {
          switch (sortBy) {
            case "score":
              return b.score - a.score;
            case "matchPercentage":
              return b.matchPercentage - a.matchPercentage;
            case "experience":
              return b.experience.years - a.experience.years;
            default:
              return 0;
          }
        });

        return filteredResults;
      },

      getTotalCost: () => {
        const { cvText } = get();
        // For now, we'll charge per CV text (could be extended for file uploads)
        return cvText.trim() ? CREDITS_COST : 0;
      },
    }),
    {
      name: "cv-analysis-store",
    }
  )
);
