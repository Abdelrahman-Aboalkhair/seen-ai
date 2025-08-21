import React from "react";
import {
  X,
  Search,
  Users,
  Target,
  Calendar,
  Code,
  Award,
  Globe,
  GraduationCap,
  Eye,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface TalentSearchHistoryItem {
  id: string;
  user_id: string;
  search_query: any;
  required_skills: string[];
  certifications: string[];
  education_level: string;
  languages: string[];
  candidate_count: number;
  match_threshold: number;
  credits_cost: number;
  status: string;
  results: any[];
  created_at: string;
}

interface TalentSearchHistoryModalProps {
  item: TalentSearchHistoryItem;
  isOpen: boolean;
  onClose: () => void;
  onView: (item: TalentSearchHistoryItem) => void;
  onDelete: (id: string) => void;
}

export function TalentSearchHistoryModal({
  item,
  isOpen,
  onClose,
  onView,
  onDelete,
}: TalentSearchHistoryModalProps) {
  const { isRTL } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      case "processing":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "failed":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "pending":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "مكتمل";
      case "processing":
        return "قيد المعالجة";
      case "failed":
        return "فشل";
      case "pending":
        return "في الانتظار";
      default:
        return "غير محدد";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseSearchQuery = (query: any) => {
    if (typeof query === "string") {
      return query;
    }
    if (typeof query === "object" && query.jobTitle) {
      return query.jobTitle;
    }
    if (typeof query === "object") {
      return JSON.stringify(query, null, 2);
    }
    return "غير محدد";
  };

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
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl flex items-center justify-center">
                <Search className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  تفاصيل البحث عن المواهب
                </h2>
                <div className="text-sm text-gray-400">
                  {formatDate(item.created_at)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div
                className={`flex flex-col items-center ${getStatusColor(
                  item.status
                )} border-2 rounded-xl p-4`}
              >
                <div className="text-lg font-bold">
                  {getStatusLabel(item.status)}
                </div>
                <div className="text-xs opacity-80">
                  {item.credits_cost} كريدت
                </div>
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
          {/* Search Query Section */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center mb-4">
              <Target className="h-5 w-5 text-purple-400 mr-3" />
              <h3 className="text-lg font-semibold text-white">
                استعلام البحث
              </h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {parseSearchQuery(item.search_query)}
            </p>
          </div>

          {/* Search Parameters Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Required Skills */}
            {item.required_skills && item.required_skills.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center mb-4">
                  <Code className="h-5 w-5 text-cyan-400 mr-3" />
                  <h3 className="text-lg font-semibold text-cyan-400">
                    المهارات المطلوبة
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {item.required_skills.map((skill: string, idx: number) => (
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

            {/* Certifications */}
            {item.certifications && item.certifications.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center mb-4">
                  <Award className="h-5 w-5 text-green-400 mr-3" />
                  <h3 className="text-lg font-semibold text-green-400">
                    الشهادات
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {item.certifications.map((cert: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 text-sm font-medium px-4 py-2 rounded-full border border-green-500/30"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {item.languages && item.languages.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center mb-4">
                  <Globe className="h-5 w-5 text-yellow-400 mr-3" />
                  <h3 className="text-lg font-semibold text-yellow-400">
                    اللغات
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {item.languages.map((lang: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 text-sm font-medium px-4 py-2 rounded-full border border-yellow-500/30"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education Level */}
            {item.education_level && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center mb-4">
                  <GraduationCap className="h-5 w-5 text-purple-400 mr-3" />
                  <h3 className="text-lg font-semibold text-purple-400">
                    المستوى التعليمي
                  </h3>
                </div>
                <span className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-sm font-medium px-4 py-2 rounded-full border border-purple-500/30">
                  {item.education_level}
                </span>
              </div>
            )}
          </div>

          {/* Search Results Summary */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-blue-400 mr-3" />
              <h3 className="text-lg font-semibold text-blue-400">
                ملخص النتائج
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                <div className="text-sm text-gray-400 mb-1">
                  عدد المرشحين المطلوب
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {item.candidate_count}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                <div className="text-sm text-gray-400 mb-1">عتبة المطابقة</div>
                <div className="text-2xl font-bold text-green-400">
                  {item.match_threshold}%
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                <div className="text-sm text-gray-400 mb-1">
                  المرشحون المطابقون
                </div>
                <div className="text-2xl font-bold text-cyan-400">
                  {item.results?.length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 rounded-b-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  onView(item);
                  onClose();
                }}
                className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors text-lg font-medium px-6 py-3 rounded-xl hover:bg-cyan-500/10"
              >
                <Eye className="h-5 w-5 mr-2" />
                عرض النتائج
              </button>
              <button
                onClick={() => {
                  onDelete(item.id);
                  onClose();
                }}
                className="flex items-center text-red-400 hover:text-red-300 transition-colors text-lg font-medium px-6 py-3 rounded-xl hover:bg-red-500/10"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                حذف البحث
              </button>
            </div>
            <div className="text-sm text-gray-500">
              تم التحليل بواسطة الذكاء الاصطناعي
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
