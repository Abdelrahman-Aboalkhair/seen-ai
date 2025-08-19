import { useState, useMemo } from "react";
import { Candidate, SearchFilters } from "../types";

export const useSearchFilters = (candidates: Candidate[]) => {
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: "match_score",
    filterByScore: "all",
  });

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filteredResults = [...candidates];

    // Filter by score
    if (filters.filterByScore === "high") {
      filteredResults = filteredResults.filter((c) => c.match_score >= 80);
    } else if (filters.filterByScore === "medium") {
      filteredResults = filteredResults.filter(
        (c) => c.match_score >= 60 && c.match_score < 80
      );
    } else if (filters.filterByScore === "low") {
      filteredResults = filteredResults.filter((c) => c.match_score < 60);
    }

    // Filter by location
    if (filters.filterByLocation) {
      filteredResults = filteredResults.filter((c) =>
        c.location
          ?.toLowerCase()
          .includes(filters.filterByLocation!.toLowerCase())
      );
    }

    // Filter by experience
    if (filters.filterByExperience) {
      const experienceYears = parseInt(filters.filterByExperience);
      filteredResults = filteredResults.filter(
        (c) => c.experience_years >= experienceYears
      );
    }

    // Sort results
    switch (filters.sortBy) {
      case "match_score":
        filteredResults.sort((a, b) => b.match_score - a.match_score);
        break;
      case "name":
        filteredResults.sort((a, b) => a.full_name.localeCompare(b.full_name));
        break;
      case "experience":
        filteredResults.sort((a, b) => b.experience_years - a.experience_years);
        break;
      case "location":
        filteredResults.sort((a, b) =>
          (a.location || "").localeCompare(b.location || "")
        );
        break;
    }

    return filteredResults;
  }, [candidates, filters]);

  // Update filters
  const updateFilters = (updates: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  // Get unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locations = candidates
      .map((c) => c.location)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return locations.sort();
  }, [candidates]);

  // Get experience ranges for filter dropdown
  const experienceRanges = useMemo(() => {
    const ranges = [
      { value: "0", label: "0+ years" },
      { value: "1", label: "1+ years" },
      { value: "3", label: "3+ years" },
      { value: "5", label: "5+ years" },
      { value: "10", label: "10+ years" },
    ];
    return ranges;
  }, []);

  return {
    filters,
    updateFilters,
    filteredAndSortedResults,
    uniqueLocations,
    experienceRanges,
  };
};
