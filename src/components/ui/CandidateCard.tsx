import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { CandidateCardHeader } from "./CandidateCardHeader";
import { CandidateCardSkills } from "./CandidateCardSkills";
import { CandidateCardFooter } from "./CandidateCardFooter";
import { CandidateDetailsModal } from "./CandidateDetailsModal";

interface CandidateProps {
  candidate: {
    current_position: string;
    full_name: string;
    linkedin_url: string;
    match_score: number;
    skills_match: string;
    experience_match: string;
    summary: string;
    ranking: number;
    education_match: string;
    culture_fit: string;
    strengths: string;
    gaps: string;
  };
  index: number;
}

export function CandidateCard({ candidate, index }: CandidateProps) {
  const { isRTL } = useTranslation();
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const getRankingIcon = (ranking: number) => {
    if (ranking <= 3) return <Star className="h-4 w-4 text-yellow-500" />;
    if (ranking <= 5) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-orange-500" />;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 group cursor-pointer"
        onClick={() => setShowDetailsModal(true)}
      >
        {/* Header */}
        <CandidateCardHeader candidate={candidate} />

        {/* Ranking */}
        <div
          className={`flex items-center mb-4 ${
            isRTL() ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"
          }`}
        >
          {getRankingIcon(candidate.ranking)}
          <span className="text-sm font-medium text-gray-300">
            الترتيب: {candidate.ranking}
          </span>
        </div>

        {/* Skills Section - Compact */}
        <CandidateCardSkills skillsMatch={candidate.skills_match} />

        {/* Quick Summary - Truncated */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-200 mb-2">
            ملخص سريع
          </h4>
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
            {candidate.summary || "لا يوجد ملخص متاح"}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="text-xs text-gray-500 mb-1">نقاط القوة</div>
            <div className="text-sm font-medium text-green-400">
              {candidate.strengths?.split(",").length || 0} نقطة
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="text-xs text-gray-500 mb-1">نقاط التحسين</div>
            <div className="text-sm font-medium text-orange-400">
              {candidate.gaps?.split(",").length || 0} نقطة
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <div className="text-center mb-4">
          <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
            عرض التفاصيل الكاملة
          </button>
        </div>

        {/* Footer */}
        <CandidateCardFooter linkedinUrl={candidate.linkedin_url} />
      </motion.div>

      {/* Details Modal */}
      <CandidateDetailsModal
        candidate={candidate}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
  );
}
