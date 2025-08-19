import React from "react";
import { Users, CheckCircle2 } from "lucide-react";
import { Candidate } from "../types";
import { CandidateCard } from "../../../components/ui/CandidateCard";

interface SearchResultsProps {
  candidates: Candidate[];
  showResults: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  candidates,
  showResults,
}) => {
  if (!showResults) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Users className="h-6 w-6 text-green-400 mr-2" />
          <h2 className="text-2xl font-bold text-white">
            Search Results ({candidates.length} candidates)
          </h2>
        </div>
        <div className="flex items-center text-green-400">
          <CheckCircle2 className="h-5 w-5 mr-2" />
          <span className="text-sm">Search completed successfully</span>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate, index) => {
          // Transform candidate data to match CandidateCard expectations
          const transformedCandidate = {
            current_position:
              candidate.current_position || "Position not specified",
            full_name: candidate.full_name,
            linkedin_url: candidate.linkedin_url || "",
            match_score: candidate.match_score,
            skills_match:
              candidate.skills?.join(", ") || "Skills not specified",
            experience_match: `${candidate.experience_years || 0}+ years`,
            summary: candidate.summary || "No summary available",
            ranking: index + 1,
            education_match:
              candidate.education_level || "Education not specified",
            culture_fit: "Good cultural fit",
            strengths: "Strong technical skills",
            gaps: "No major gaps identified",
          };

          return (
            <CandidateCard
              key={candidate.id}
              candidate={transformedCandidate}
              index={index}
            />
          );
        })}
      </div>

      {/* No Results */}
      {candidates.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No candidates found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search criteria or match score type to find more
            candidates.
          </p>
        </div>
      )}
    </div>
  );
};
