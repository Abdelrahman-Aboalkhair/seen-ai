import React from "react";
import {
  X,
  User,
  Building2,
  Code,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Heart,
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface CandidateDetailsModalProps {
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
  isOpen: boolean;
  onClose: () => void;
}

export function CandidateDetailsModal({
  candidate,
  isOpen,
  onClose,
}: CandidateDetailsModalProps) {
  const { isRTL } = useTranslation();

  const getMatchColor = (score: number) => {
    if (score >= 80)
      return "text-green-400 bg-green-500/10 border-green-500/30";
    if (score >= 60)
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    return "text-red-400 bg-red-500/10 border-red-500/30";
  };

  const parseSkills = (skillsText: string) => {
    if (
      !skillsText ||
      skillsText === "غير محدد" ||
      skillsText === "[object Object]"
    ) {
      return [];
    }

    if (skillsText.includes("technicalSkills:")) {
      const lines = skillsText.split("\n");
      for (const line of lines) {
        if (line.includes("technicalSkills:")) {
          const skillsPart = line.replace("technicalSkills:", "").trim();
          return skillsPart
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean);
        }
      }
    }

    return skillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  };

  const parseExperience = (experienceText: string) => {
    if (!experienceText || experienceText === "غير محدد") {
      return "خبرة متنوعة";
    }

    if (experienceText.includes("relevantExperience:")) {
      const lines = experienceText.split("\n");
      for (const line of lines) {
        if (line.includes("relevantExperience:")) {
          return line.replace("relevantExperience:", "").trim();
        }
      }
    }

    return experienceText;
  };

  const skills = parseSkills(candidate.skills_match);
  const experience = parseExperience(candidate.experience_match);
  const strengthsList =
    candidate.strengths
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) || [];
  const gapsList =
    candidate.gaps
      ?.split(",")
      .map((g) => g.trim())
      .filter(Boolean) || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 rounded-t-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {candidate.full_name}
                </h2>
                <div className="flex items-center text-gray-400">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span>{candidate.current_position}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div
                className={`flex flex-col items-center ${getMatchColor(
                  candidate.match_score
                )} border-2 rounded-xl p-4`}
              >
                <div className="text-3xl font-black">
                  {candidate.match_score}%
                </div>
                <div className="text-xs font-medium opacity-90">مطابقة</div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700/50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Skills Section */}
          {skills.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center mb-4">
                <Code className="h-5 w-5 text-cyan-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">
                  المهارات التقنية
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 text-sm font-medium px-4 py-2 rounded-full border border-cyan-500/30"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience Section */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-blue-400 mr-3" />
              <h3 className="text-lg font-semibold text-white">
                الخبرة العملية
              </h3>
            </div>
            <p className="text-gray-300 leading-relaxed">{experience}</p>
          </div>

          {/* Summary Section */}
          {candidate.summary && (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-purple-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">
                  ملخص التقييم
                </h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                {candidate.summary}
              </p>
            </div>
          )}

          {/* Strengths & Gaps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            {strengthsList.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  <h3 className="text-lg font-semibold text-green-400">
                    نقاط القوة
                  </h3>
                </div>
                <ul className="space-y-2">
                  {strengthsList.map((strength, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-400 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-gray-300">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {gapsList.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center mb-4">
                  <AlertCircle className="h-5 w-5 text-orange-400 mr-3" />
                  <h3 className="text-lg font-semibold text-orange-400">
                    نقاط التحسين
                  </h3>
                </div>
                <ul className="space-y-2">
                  {gapsList.map((gap, idx) => (
                    <li key={idx} className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-orange-400 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-gray-300">{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Culture Fit */}
          {candidate.culture_fit && candidate.culture_fit !== "غير محدد" && (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center mb-4">
                <Heart className="h-5 w-5 text-pink-400 mr-3" />
                <h3 className="text-lg font-semibold text-pink-400">
                  الملاءمة الثقافية
                </h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                {candidate.culture_fit}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 rounded-b-2xl p-6">
          <div className="flex items-center justify-between">
            <a
              href={candidate.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors text-lg font-medium px-6 py-3 rounded-xl hover:bg-cyan-500/10"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              عرض الملف الشخصي على LinkedIn
            </a>
            <div className="text-sm text-gray-500">
              تم التحليل بواسطة الذكاء الاصطناعي
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
