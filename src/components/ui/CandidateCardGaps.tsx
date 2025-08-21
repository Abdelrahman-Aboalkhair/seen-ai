import React, { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface CandidateCardGapsProps {
  gaps: string;
}

export function CandidateCardGaps({ gaps }: CandidateCardGapsProps) {
  const { isRTL } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!gaps || gaps === "غير محدد") {
    return null;
  }

  const gapsList = gaps
    .split(",")
    .map((gap) => gap.trim())
    .filter(Boolean);

  if (gapsList.length === 0) {
    return null;
  }

  const displayGaps = isExpanded ? gapsList : gapsList.slice(0, 2);
  const hasMoreGaps = gapsList.length > 2;

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
          <AlertCircle className="h-4 w-4 text-orange-400" />
          <h4 className="text-sm font-semibold text-orange-400">
            نقاط التحسين
          </h4>
        </div>
        {hasMoreGaps && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-orange-400 hover:text-orange-300 transition-colors p-1 rounded-md hover:bg-orange-500/10"
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
        {displayGaps.map((gap, idx) => (
          <div
            key={idx}
            className={`flex items-start ${isRTL() ? "flex-row-reverse" : ""}`}
          >
            <AlertCircle
              className={`h-3 w-3 text-orange-400 mt-1 flex-shrink-0 ${
                isRTL() ? "ml-2" : "mr-2"
              }`}
            />
            <span className="text-sm text-gray-300 leading-relaxed">{gap}</span>
          </div>
        ))}
      </div>

      {hasMoreGaps && !isExpanded && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          +{gapsList.length - 2} نقاط تحسين أخرى
        </div>
      )}
    </div>
  );
}
