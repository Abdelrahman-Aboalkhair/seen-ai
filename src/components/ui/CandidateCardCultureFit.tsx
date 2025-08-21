import React, { useState } from "react";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface CandidateCardCultureFitProps {
  cultureFit: string;
}

export function CandidateCardCultureFit({
  cultureFit,
}: CandidateCardCultureFitProps) {
  const { isRTL } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!cultureFit || cultureFit === "غير محدد") {
    return null;
  }

  const isLongText = cultureFit.length > 120;
  const displayText = isExpanded
    ? cultureFit
    : cultureFit.slice(0, 120) + (isLongText ? "..." : "");

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
          <Heart className="h-4 w-4 text-pink-400 flex-shrink-0 mt-0.5" />
          <h4 className="text-sm font-semibold text-pink-400">
            الملاءمة الثقافية
          </h4>
        </div>
        {isLongText && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-pink-400 hover:text-pink-300 transition-colors p-1 rounded-md hover:bg-pink-500/10 flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-lg p-3 border border-pink-500/20">
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
