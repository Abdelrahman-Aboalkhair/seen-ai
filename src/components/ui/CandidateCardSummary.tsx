import React, { useState } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface CandidateCardSummaryProps {
  summary: string;
}

export function CandidateCardSummary({ summary }: CandidateCardSummaryProps) {
  const { isRTL } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!summary || summary === "غير محدد") {
    return null;
  }

  const isLongText = summary.length > 150;
  const displayText = isExpanded
    ? summary
    : summary.slice(0, 150) + (isLongText ? "..." : "");

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
          <FileText className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <h4 className="text-sm font-semibold text-gray-200">ملخص التقييم</h4>
        </div>
        {isLongText && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-400 hover:text-purple-300 transition-colors p-1 rounded-md hover:bg-purple-500/10 flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
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
