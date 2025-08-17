import React from "react";
import { motion } from "framer-motion";
import {
  User,
  MapPin,
  Calendar,
  Star,
  ExternalLink,
  Award,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Building2,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";

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
  const { t, isRTL } = useTranslation();

  const getMatchColor = (score: number) => {
    if (score >= 80)
      return "text-green-500 bg-green-500/10 border-green-500/30";
    if (score >= 60)
      return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
    return "text-red-500 bg-red-500/10 border-red-500/30";
  };

  const getRankingIcon = (ranking: number) => {
    if (ranking <= 3) return <Star className="h-4 w-4 text-yellow-500" />;
    if (ranking <= 5) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-orange-500" />;
  };

  const parseSkills = (skillsText: string) => {
    // Extract skills from the skills match text
    if (!skillsText || skillsText === "غير محدد") return [];
    return skillsText
      .split(",")
      .map((skill) => skill.trim())
      .slice(0, 4);
  };

  const parseExperience = (experienceText: string) => {
    if (!experienceText || experienceText === "غير محدد") return "خبرة متنوعة";
    const match = experienceText.match(/(\d+)\+?\s*years?/i);
    return match ? `${match[1]}+ سنوات` : experienceText;
  };

  const skills = parseSkills(candidate.skills_match);
  const experience = parseExperience(candidate.experience_match);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white/5 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
    >
      {/* Header */}
      <div
        className={`flex items-start justify-between mb-4 ${
          isRTL() ? "flex-row-reverse" : ""
        }`}
      >
        <div className="flex-1">
          <div
            className={`flex items-center mb-2 ${
              isRTL()
                ? "flex-row-reverse space-x-reverse space-x-3"
                : "space-x-3"
            }`}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {candidate.full_name}
              </h3>
              <div
                className={`flex items-center text-gray-400 text-sm ${
                  isRTL()
                    ? "flex-row-reverse space-x-reverse space-x-2"
                    : "space-x-2"
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span className="line-clamp-1">
                  {candidate.current_position}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Match Score */}
        <div
          className={`flex flex-col items-center ${getMatchColor(
            candidate.match_score
          )} border rounded-lg p-3 min-w-[80px]`}
        >
          <div className="text-2xl font-bold">{candidate.match_score}%</div>
          <div className="text-xs opacity-80">مطابقة</div>
        </div>
      </div>

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

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            المهارات الرئيسية:
          </h4>
          <div
            className={`flex flex-wrap gap-2 ${
              isRTL() ? "flex-row-reverse" : ""
            }`}
          >
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="bg-cyan-500/20 text-cyan-300 text-xs font-medium px-2.5 py-1 rounded-full border border-cyan-500/30"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      <div
        className={`flex items-center mb-4 ${
          isRTL() ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"
        }`}
      >
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-400">
          سنوات الخبرة:{" "}
          <span className="text-white font-medium">{experience}</span>
        </span>
      </div>

      {/* Summary */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          ملخص التقييم:
        </h4>
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
          {candidate.summary}
        </p>
      </div>

      {/* Strengths */}
      {candidate.strengths && candidate.strengths !== "غير محدد" && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-green-400 mb-2">
            نقاط القوة:
          </h4>
          <div className="text-sm text-gray-400">
            {candidate.strengths
              .split(",")
              .slice(0, 3)
              .map((strength, idx) => (
                <div
                  key={idx}
                  className={`flex items-start mb-1 ${
                    isRTL() ? "flex-row-reverse" : ""
                  }`}
                >
                  <CheckCircle
                    className={`h-3 w-3 text-green-400 mt-0.5 flex-shrink-0 ${
                      isRTL() ? "ml-2" : "mr-2"
                    }`}
                  />
                  <span className="text-xs">{strength.trim()}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Gaps */}
      {candidate.gaps && candidate.gaps !== "غير محدد" && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-orange-400 mb-2">
            نقاط التحسين:
          </h4>
          <div className="text-sm text-gray-400">
            {candidate.gaps
              .split(",")
              .slice(0, 2)
              .map((gap, idx) => (
                <div
                  key={idx}
                  className={`flex items-start mb-1 ${
                    isRTL() ? "flex-row-reverse" : ""
                  }`}
                >
                  <AlertCircle
                    className={`h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0 ${
                      isRTL() ? "ml-2" : "mr-2"
                    }`}
                  />
                  <span className="text-xs">{gap.trim()}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Culture Fit */}
      {candidate.culture_fit && candidate.culture_fit !== "غير محدد" && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-blue-400 mb-2">
            الملاءمة الثقافية:
          </h4>
          <p className="text-sm text-gray-400">{candidate.culture_fit}</p>
        </div>
      )}

      {/* Footer */}
      <div
        className={`flex items-center justify-between pt-4 border-t border-gray-700 ${
          isRTL() ? "flex-row-reverse" : ""
        }`}
      >
        <a
          href={candidate.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center text-cyan-400 hover:text-cyan-300 transition-colors text-sm ${
            isRTL() ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"
          }`}
        >
          <ExternalLink className="h-4 w-4" />
          <span>عرض الملف الشخصي</span>
        </a>

        <div
          className={`flex items-center text-xs text-gray-500 ${
            isRTL() ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"
          }`}
        >
          <TrendingUp className="h-3 w-3" />
          <span>تم التحليل بواسطة الذكاء الاصطناعي</span>
        </div>
      </div>
    </motion.div>
  );
}
