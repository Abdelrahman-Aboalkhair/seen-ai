import React from "react";
import { Filter, SortDesc } from "lucide-react";
import { SearchFilters as SearchFiltersType } from "../types";
import { SCORE_FILTER_OPTIONS, SORT_OPTIONS } from "../utils/constants";

interface SearchFiltersProps {
  filters: SearchFiltersType;
  uniqueLocations: string[];
  experienceRanges: { value: string; label: string }[];
  onUpdateFilters: (updates: Partial<SearchFiltersType>) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  uniqueLocations,
  experienceRanges,
  onUpdateFilters,
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 mb-6">
      <div className="flex items-center mb-4">
        <Filter className="h-5 w-5 text-blue-400 mr-2" />
        <h3 className="text-lg font-semibold text-white">Filters & Sorting</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <SortDesc className="h-4 w-4 inline mr-1" />
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onUpdateFilters({ sortBy: e.target.value as any })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Score */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Match Score
          </label>
          <select
            value={filters.filterByScore}
            onChange={(e) =>
              onUpdateFilters({ filterByScore: e.target.value as any })
            }
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SCORE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Location */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Location
          </label>
          <select
            value={filters.filterByLocation || ""}
            onChange={(e) =>
              onUpdateFilters({ filterByLocation: e.target.value || undefined })
            }
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Locations</option>
            {uniqueLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Experience
          </label>
          <select
            value={filters.filterByExperience || ""}
            onChange={(e) =>
              onUpdateFilters({
                filterByExperience: e.target.value || undefined,
              })
            }
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any Experience</option>
            {experienceRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
