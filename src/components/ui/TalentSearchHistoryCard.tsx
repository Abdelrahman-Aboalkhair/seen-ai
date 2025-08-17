import React from "react";
import { motion } from "framer-motion";
import {
  Search,
  Users,
  Target,
  Star,
  Eye,
  Download,
  Trash2,
  Calendar,
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

interface TalentSearchHistoryCardProps {
  item: TalentSearchHistoryItem;
  index: number;
  onView: (item: TalentSearchHistoryItem) => void;
  onDelete: (id: string) => void;
}

export function TalentSearchHistoryCard({
  item,
  index,
  onView,
  onDelete,
}: TalentSearchHistoryCardProps) {
  const { t, isRTL } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500 bg-green-500/10 border-green-500/30";
      case "processing":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "failed":
        return "text-red-500 bg-red-500/10 border-red-500/30";
      case "pending":
        return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/30";
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
    if (typeof query === "object") {
      return JSON.stringify(query, null, 2);
    }
    return "غير محدد";
  };

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
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                بحث عن المواهب
              </h3>
              <div className="text-sm text-gray-400">
                {formatDate(item.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div
          className={`flex flex-col items-center ${getStatusColor(
            item.status
          )} border rounded-lg p-3 min-w-[80px]`}
        >
          <div className="text-sm font-bold">{getStatusLabel(item.status)}</div>
          <div className="text-xs opacity-80">{item.credits_cost} كريدت</div>
        </div>
      </div>

      {/* Search Query */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          استعلام البحث:
        </h4>
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
          {parseSearchQuery(item.search_query)}
        </p>
      </div>

      {/* Search Parameters */}
      <div className="mb-4 space-y-3">
        {/* Required Skills */}
        {item.required_skills && item.required_skills.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              المهارات المطلوبة:
            </h4>
            <div className="flex flex-wrap gap-2">
              {item.required_skills.map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {item.certifications && item.certifications.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              الشهادات:
            </h4>
            <div className="flex flex-wrap gap-2">
              {item.certifications.map((cert: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-md"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {item.languages && item.languages.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">اللغات:</h4>
            <div className="flex flex-wrap gap-2">
              {item.languages.map((lang: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-md"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education Level */}
        {item.education_level && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              المستوى التعليمي:
            </h4>
            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-md">
              {item.education_level}
            </span>
          </div>
        )}
      </div>

      {/* Search Results Summary */}
      {item.results && item.results.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            نتائج البحث:
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">عدد المرشحين:</span>
              <span className="text-white font-medium">
                {item.candidate_count}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">عتبة المطابقة:</span>
              <span className="text-white font-medium">
                {item.match_threshold}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">المرشحون المطابقون:</span>
              <span className="text-green-400 font-medium">
                {item.results.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div
        className={`flex items-center justify-between pt-4 border-t border-gray-700 ${
          isRTL() ? "flex-row-reverse" : ""
        }`}
      >
        <div
          className={`flex items-center space-x-2 ${
            isRTL() ? "flex-row-reverse space-x-reverse" : ""
          }`}
        >
          <button
            onClick={() => onView(item)}
            className="flex items-center space-x-1 px-3 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span className="text-sm">عرض النتائج</span>
          </button>
        </div>

        <div
          className={`flex items-center space-x-2 ${
            isRTL() ? "flex-row-reverse space-x-reverse" : ""
          }`}
        >
          <button
            onClick={() => onDelete(item.id)}
            className="flex items-center space-x-1 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-sm">حذف</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
