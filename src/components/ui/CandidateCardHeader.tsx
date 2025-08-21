import React from "react";
import { User, Building2 } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface CandidateCardHeaderProps {
  candidate: {
    current_position: string;
    full_name: string;
    match_score: number;
  };
}

export function CandidateCardHeader({ candidate }: CandidateCardHeaderProps) {
  const { isRTL } = useTranslation();

  const getMatchColor = (score: number) => {
    if (score >= 80)
      return "text-green-400 bg-green-500/10 border-green-500/30 shadow-green-500/20";
    if (score >= 60)
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30 shadow-yellow-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/30 shadow-red-500/20";
  };

  // Truncate long titles
  const truncateTitle = (title: string, maxLength: number = 35) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + "...";
  };

  return (
    <div
      className={`flex items-start justify-between mb-6 ${
        isRTL() ? "flex-row-reverse" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div
          className={`flex items-center mb-3 ${
            isRTL() ? "flex-row-reverse space-x-reverse space-x-4" : "space-x-4"
          }`}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25 flex-shrink-0">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-1 truncate">
              {candidate.full_name}
            </h3>
            <div
              className={`flex items-center text-gray-400 text-sm ${
                isRTL()
                  ? "flex-row-reverse space-x-reverse space-x-2"
                  : "space-x-2"
              }`}
            >
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate" title={candidate.current_position}>
                {truncateTitle(candidate.current_position)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Match Score - Smaller and better positioned */}
      <div
        className={`flex flex-col items-center ${getMatchColor(
          candidate.match_score
        )} border rounded-lg p-2 min-w-[60px] shadow-sm backdrop-blur-sm flex-shrink-0`}
      >
        <div className="text-xl font-bold">{candidate.match_score}%</div>
        <div className="text-xs opacity-80">مطابقة</div>
      </div>
    </div>
  );
}
