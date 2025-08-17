import React from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Award,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Briefcase,
  FileText,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface CVAnalysisProps {
  candidate: {
    name: string;
    email: string;
    phone: string;
    city: string;
    dateOfBirth: string;
    skills: any; // Can be string, array, or object from OpenAI
    summary: string;
    education: string;
    jobHistory: string;
    consideration: string;
    strengths: any; // Can be string or array from OpenAI
    gaps: any; // Can be string or array from OpenAI
    vote: string;
    analysisDate: string;
    ranking: number;
  };
  index: number;
}

export function CVAnalysisCard({ candidate, index }: CVAnalysisProps) {
  const { t, isRTL } = useTranslation();

  const getVoteColor = (vote: string) => {
    const voteNum = parseInt(vote);
    if (voteNum >= 8)
      return "text-green-500 bg-green-500/10 border-green-500/30";
    if (voteNum >= 6)
      return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
    if (voteNum >= 4)
      return "text-orange-500 bg-orange-500/10 border-orange-500/30";
    return "text-red-500 bg-red-500/10 border-red-500/30";
  };

  const getVoteLabel = (vote: string) => {
    const voteNum = parseInt(vote);
    if (voteNum >= 8) return "ممتاز";
    if (voteNum >= 6) return "جيد";
    if (voteNum >= 4) return "متوسط";
    return "ضعيف";
  };

  const parseSkills = (skillsText: any) => {
    console.log("🔍 Parsing skills:", skillsText);
    console.log("🔍 Skills type:", typeof skillsText);
    console.log("🔍 Skills is array:", Array.isArray(skillsText));

    if (!skillsText) {
      console.log("⚠️  No skills provided, returning empty array");
      return [];
    }

    // Handle different data types
    if (typeof skillsText === "string") {
      console.log("📝 Processing skills as string");
      if (skillsText === "غير محدد") return [];
      const result = skillsText
        .split(",")
        .map((skill) => skill.trim())
        .slice(0, 5);
      console.log("✅ Parsed skills from string:", result);
      return result;
    }

    // Handle array
    if (Array.isArray(skillsText)) {
      console.log("📝 Processing skills as array");
      const result = skillsText
        .map((skill) => String(skill).trim())
        .slice(0, 5);
      console.log("✅ Parsed skills from array:", result);
      return result;
    }

    // Handle object (convert to string)
    if (typeof skillsText === "object") {
      console.log("📝 Processing skills as object");
      const skillsString = JSON.stringify(skillsText);
      const result = skillsString
        .replace(/[{}"]/g, "")
        .split(",")
        .map((skill) => skill.trim())
        .slice(0, 5);
      console.log("✅ Parsed skills from object:", result);
      return result;
    }

    // Fallback: convert to string
    console.log("📝 Processing skills as fallback (convert to string)");
    const result = String(skillsText)
      .split(",")
      .map((skill) => skill.trim())
      .slice(0, 5);
    console.log("✅ Parsed skills from fallback:", result);
    return result;
  };

  const parseList = (listText: any, maxItems: number = 3) => {
    if (!listText) return [];

    // Handle array
    if (Array.isArray(listText)) {
      return listText.map((item) => String(item).trim()).slice(0, maxItems);
    }

    // Handle string
    if (typeof listText === "string") {
      if (listText === "غير محدد") return [];
      return listText
        .split(",")
        .map((item) => item.trim())
        .slice(0, maxItems);
    }

    // Fallback: convert to string
    return String(listText)
      .split(",")
      .map((item) => item.trim())
      .slice(0, maxItems);
  };

  const skills = parseSkills(candidate.skills);

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
                {candidate.name}
              </h3>
              <div className="text-sm text-gray-400">
                تحليل رقم: {candidate.ranking}
              </div>
            </div>
          </div>
        </div>

        {/* Vote Score */}
        <div
          className={`flex flex-col items-center ${getVoteColor(
            candidate.vote
          )} border rounded-lg p-3 min-w-[80px]`}
        >
          <div className="text-2xl font-bold">{candidate.vote}/10</div>
          <div className="text-xs opacity-80">
            {getVoteLabel(candidate.vote)}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-4 space-y-2">
        {candidate.email && (
          <div
            className={`flex items-center text-sm text-gray-400 ${
              isRTL()
                ? "flex-row-reverse space-x-reverse space-x-2"
                : "space-x-2"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>{candidate.email}</span>
          </div>
        )}
        {candidate.phone && (
          <div
            className={`flex items-center text-sm text-gray-400 ${
              isRTL()
                ? "flex-row-reverse space-x-reverse space-x-2"
                : "space-x-2"
            }`}
          >
            <Phone className="h-4 w-4" />
            <span>{candidate.phone}</span>
          </div>
        )}
        {candidate.city && (
          <div
            className={`flex items-center text-sm text-gray-400 ${
              isRTL()
                ? "flex-row-reverse space-x-reverse space-x-2"
                : "space-x-2"
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>{candidate.city}</span>
          </div>
        )}
        {candidate.dateOfBirth && (
          <div
            className={`flex items-center text-sm text-gray-400 ${
              isRTL()
                ? "flex-row-reverse space-x-reverse space-x-2"
                : "space-x-2"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>{candidate.dateOfBirth}</span>
          </div>
        )}
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">المهارات:</h4>
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

      {/* Summary */}
      {candidate.summary && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">ملخص:</h4>
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
            {candidate.summary}
          </p>
        </div>
      )}

      {/* Education */}
      {candidate.education && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            <GraduationCap className="h-4 w-4 inline mr-2" />
            التعليم:
          </h4>
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
            {candidate.education}
          </p>
        </div>
      )}

      {/* Job History */}
      {candidate.jobHistory && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            <Briefcase className="h-4 w-4 inline mr-2" />
            الخبرة العملية:
          </h4>
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
            {candidate.jobHistory}
          </p>
        </div>
      )}

      {/* Strengths */}
      {candidate.strengths && candidate.strengths !== "غير محدد" && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-green-400 mb-2">
            نقاط القوة:
          </h4>
          <div className="text-sm text-gray-400">
            {parseList(candidate.strengths, 3).map((strength, idx) => (
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
                <span className="text-xs">{strength}</span>
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
            {parseList(candidate.gaps, 2).map((gap, idx) => (
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
                <span className="text-xs">{gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consideration */}
      {candidate.consideration && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-blue-400 mb-2">
            <FileText className="h-4 w-4 inline mr-2" />
            التقييم العام:
          </h4>
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
            {candidate.consideration}
          </p>
        </div>
      )}

      {/* Footer */}
      <div
        className={`flex items-center justify-between pt-4 border-t border-gray-700 ${
          isRTL() ? "flex-row-reverse" : ""
        }`}
      >
        <div
          className={`flex items-center text-xs text-gray-500 ${
            isRTL() ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"
          }`}
        >
          <Award className="h-3 w-3" />
          <span>تم التحليل بواسطة الذكاء الاصطناعي</span>
        </div>

        <div className="text-xs text-gray-500">
          {new Date(candidate.analysisDate).toLocaleDateString("ar-SA")}
        </div>
      </div>
    </motion.div>
  );
}
