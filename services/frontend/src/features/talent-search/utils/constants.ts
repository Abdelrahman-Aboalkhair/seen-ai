export const SORT_OPTIONS = [
  { value: "match_score", label: "Match Score" },
  { value: "name", label: "Name" },
  { value: "experience", label: "Experience" },
  { value: "location", label: "Location" },
] as const;

export const SCORE_FILTER_OPTIONS = [
  { value: "all", label: "All Scores" },
  { value: "high", label: "High (80%+)" },
  { value: "medium", label: "Medium (60-79%)" },
  { value: "low", label: "Low (<60%)" },
] as const;

export const MATCH_SCORE_LABELS = {
  quick: "Quick Match (50%)",
  balanced: "Balanced (60%)",
  detailed: "Detailed (70%)",
  comprehensive: "Comprehensive (80%)",
} as const;
