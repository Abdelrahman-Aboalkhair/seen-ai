import React, { useState } from "react";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface CandidateCardExperienceProps {
  experienceMatch: string;
}

export function CandidateCardExperience({
  experienceMatch,
}: CandidateCardExperienceProps) {
  const { isRTL } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const parseExperience = (experienceText: string) => {
    if (!experienceText || experienceText === "غير محدد") {
      return "خبرة متنوعة";
    }

    // Handle the new n8n format with relevantExperience prefix
    if (experienceText.includes("relevantExperience:")) {
      const lines = experienceText.split("\n");
      for (const line of lines) {
        if (line.includes("relevantExperience:")) {
          return line.replace("relevantExperience:", "").trim();
        }
      }
    }

    // Fallback to original text
    return experienceText;
  };

  const experience = parseExperience(experienceMatch);
  const isLongText = experience.length > 100;
  const displayText = isExpanded
    ? experience
    : experience.slice(0, 100) + (isLongText ? "..." : "");

  return (
    <div className="mb-6">
      <div
        className={`flex items-start justify-between mb-3 ${
          isRTL() ? "flex-row-reverse" : ""
        }`}
      >
        <div
          className={`flex items-center ${
            isRTL() ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"
          }`}
        >
          <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <h4 className="text-sm font-semibold text-gray-200">سنوات الخبرة</h4>
        </div>
        {isLongText && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded-md hover:bg-blue-500/10 flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <p className="text-sm text-gray-300 leading-relaxed">{displayText}</p>
      </div>

      {isLongText && !isExpanded && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          انقر لعرض المزيد
        </div>
      )}
    </div>
  );
}
