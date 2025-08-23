import React, { useState } from "react";
import { CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface CandidateCardStrengthsProps {
  strengths: string;
}

export function CandidateCardStrengths({
  strengths,
}: CandidateCardStrengthsProps) {
  const { isRTL } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!strengths || strengths === "غير محدد") {
    return null;
  }

  const strengthsList = strengths
    .split(",")
    .map((strength) => strength.trim())
    .filter(Boolean);

  if (strengthsList.length === 0) {
    return null;
  }

  const displayStrengths = isExpanded
    ? strengthsList
    : strengthsList.slice(0, 3);
  const hasMoreStrengths = strengthsList.length > 3;

  return (
    <div className="mb-6">
      <div
        className={`flex items-center justify-between mb-3 ${
          isRTL() ? "flex-row-reverse" : ""
        }`}
      >
        <div
          className={`flex items-center ${
            isRTL() ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"
          }`}
        >
          <CheckCircle className="h-4 w-4 text-green-400" />
          <h4 className="text-sm font-semibold text-green-400">نقاط القوة</h4>
        </div>
        {hasMoreStrengths && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-green-400 hover:text-green-300 transition-colors p-1 rounded-md hover:bg-green-500/10"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayStrengths.map((strength, idx) => (
          <div
            key={idx}
            className={`flex items-start ${isRTL() ? "flex-row-reverse" : ""}`}
          >
            <CheckCircle
              className={`h-3 w-3 text-green-400 mt-1 flex-shrink-0 ${
                isRTL() ? "ml-2" : "mr-2"
              }`}
            />
            <span className="text-sm text-gray-300 leading-relaxed">
              {strength}
            </span>
          </div>
        ))}
      </div>

      {hasMoreStrengths && !isExpanded && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          +{strengthsList.length - 3} نقاط قوة أخرى
        </div>
      )}
    </div>
  );
}
