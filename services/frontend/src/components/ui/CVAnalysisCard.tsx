import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  Briefcase,
  GraduationCap,
  Award,
  AlertCircle,
  Eye,
  X,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface CVAnalysisCardProps {
  candidate: any;
  index: number;
}

export function CVAnalysisCard({ candidate, index }: CVAnalysisCardProps) {
  const { t, isRTL } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return "bg-green-400/10 border-green-400/20";
    if (score >= 6) return "bg-yellow-400/10 border-yellow-400/20";
    return "bg-red-400/10 border-red-400/20";
  };

  const getScoreText = (score: number) => {
    if (score >= 8) return "ممتاز";
    if (score >= 6) return "جيد";
    return "ضعيف";
  };

  const skills = candidate.skills
    ? candidate.skills.split(",").slice(0, 3)
    : [];

  return (
    <>
      {/* Compact Card */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-all duration-200 hover:shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                {candidate.name || "غير محدد"}
              </h3>
              <p className="text-xs text-gray-400">
                تحليل رقم: {candidate.ranking || index + 1}
              </p>
            </div>
          </div>

          {/* Score Badge */}
          <div
            className={`px-2 py-1 rounded-lg border ${getScoreBgColor(
              parseInt(candidate.vote)
            )}`}
          >
            <div
              className={`text-xs font-bold ${getScoreColor(
                parseInt(candidate.vote)
              )}`}
            >
              {candidate.vote}/10
            </div>
            <div
              className={`text-xs ${getScoreColor(parseInt(candidate.vote))}`}
            >
              {getScoreText(parseInt(candidate.vote))}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 mb-3">
          {candidate.email && (
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <Mail className="h-3 w-3 text-gray-400" />
              <span className="truncate">{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <Phone className="h-3 w-3 text-gray-400" />
              <span>{candidate.phone}</span>
            </div>
          )}
          {candidate.city && (
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span>{candidate.city}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {skills.map((skill: string, skillIndex: number) => (
                <span
                  key={skillIndex}
                  className="px-2 py-1 bg-slate-700 text-xs text-gray-300 rounded-md"
                >
                  {skill.trim()}
                </span>
              ))}
              {candidate.skills && candidate.skills.split(",").length > 3 && (
                <span className="px-2 py-1 bg-slate-700 text-xs text-gray-400 rounded-md">
                  +{candidate.skills.split(",").length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Summary Preview */}
        {candidate.summary && (
          <div className="mb-3">
            <p className="text-xs text-gray-300 line-clamp-2">
              {candidate.summary}
            </p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded-lg transition-colors duration-200"
        >
          <Eye className="h-3 w-3" />
          <span>عرض التفاصيل</span>
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {candidate.name || "غير محدد"}
                  </h2>
                  <p className="text-sm text-gray-400">
                    تحليل رقم: {candidate.ranking || index + 1}
                  </p>
                </div>
              </div>

              {/* Score */}
              <div
                className={`px-3 py-2 rounded-lg border ${getScoreBgColor(
                  parseInt(candidate.vote)
                )}`}
              >
                <div
                  className={`text-lg font-bold ${getScoreColor(
                    parseInt(candidate.vote)
                  )}`}
                >
                  {candidate.vote}/10
                </div>
                <div
                  className={`text-sm ${getScoreColor(
                    parseInt(candidate.vote)
                  )}`}
                >
                  {getScoreText(parseInt(candidate.vote))}
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidate.email && (
                  <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                    <Mail className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-xs text-gray-400">البريد الإلكتروني</p>
                      <p className="text-sm text-white">{candidate.email}</p>
                    </div>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                    <Phone className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-xs text-gray-400">رقم الهاتف</p>
                      <p className="text-sm text-white">{candidate.phone}</p>
                    </div>
                  </div>
                )}
                {candidate.city && (
                  <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-xs text-gray-400">الموقع</p>
                      <p className="text-sm text-white">{candidate.city}</p>
                    </div>
                  </div>
                )}
                {candidate.dateOfBirth && (
                  <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                    <Calendar className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-xs text-gray-400">تاريخ الميلاد</p>
                      <p className="text-sm text-white">
                        {candidate.dateOfBirth}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills */}
              {candidate.skills && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Award className="h-5 w-5 text-cyan-400 mr-2" />
                    المهارات الأساسية
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills
                      .split(",")
                      .map((skill: string, skillIndex: number) => (
                        <span
                          key={skillIndex}
                          className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded-lg border border-cyan-500/30"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {candidate.summary && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    ملخص
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {candidate.summary}
                  </p>
                </div>
              )}

              {/* Education */}
              {candidate.education && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <GraduationCap className="h-5 w-5 text-cyan-400 mr-2" />
                    التعليم
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {candidate.education}
                  </p>
                </div>
              )}

              {/* Work Experience */}
              {candidate.jobHistory && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Briefcase className="h-5 w-5 text-cyan-400 mr-2" />
                    الخبرة العملية
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {candidate.jobHistory}
                  </p>
                </div>
              )}

              {/* Strengths */}
              {candidate.strengths && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    نقاط القوة
                  </h3>
                  <div className="space-y-2">
                    {candidate.strengths
                      .split(",")
                      .map((strength: string, strengthIndex: number) => (
                        <div
                          key={strengthIndex}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300">
                            {strength.trim()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Areas for Improvement */}
              {candidate.gaps && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <XCircle className="h-5 w-5 text-red-400 mr-2" />
                    نقاط التحسين
                  </h3>
                  <div className="space-y-2">
                    {candidate.gaps
                      .split(",")
                      .map((gap: string, gapIndex: number) => (
                        <div
                          key={gapIndex}
                          className="flex items-center space-x-2"
                        >
                          <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                          <span className="text-gray-300">{gap.trim()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {candidate.recommendations && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Award className="h-5 w-5 text-blue-400 mr-2" />
                    التوصيات
                  </h3>
                  <div className="space-y-2">
                    {candidate.recommendations
                      .split(",")
                      .map((recommendation: string, recIndex: number) => (
                        <div
                          key={recIndex}
                          className="flex items-center space-x-2"
                        >
                          <Award className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <span className="text-gray-300">
                            {recommendation.trim()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Overall Assessment */}
              {candidate.consideration && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 mr-2" />
                    التقييم العام
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {candidate.consideration}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-700 bg-slate-800/50">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>تم التحليل بواسطة الذكاء الاصطناعي</span>
                <span>
                  {new Date(candidate.analysisDate).toLocaleDateString("ar-SA")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
