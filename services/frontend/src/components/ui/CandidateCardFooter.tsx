import React from "react";
import { ExternalLink, TrendingUp } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface CandidateCardFooterProps {
  linkedinUrl: string;
}

export function CandidateCardFooter({ linkedinUrl }: CandidateCardFooterProps) {
  const { isRTL } = useTranslation();

  return (
    <div
      className={`flex items-center justify-between pt-4 border-t border-slate-700/50 ${
        isRTL() ? "flex-row-reverse" : ""
      }`}
    >
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`flex items-center text-cyan-400 hover:text-cyan-300 transition-all duration-200 text-sm font-medium px-3 py-2 rounded-lg hover:bg-cyan-500/10 group ${
          isRTL() ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"
        }`}
      >
        <ExternalLink className="h-4 w-4 group-hover:scale-110 transition-transform" />
        <span>LinkedIn</span>
      </a>

      <div
        className={`flex items-center text-xs text-gray-500 ${
          isRTL() ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"
        }`}
      >
        <TrendingUp className="h-3 w-3" />
        <span>AI تحليل</span>
      </div>
    </div>
  );
}
