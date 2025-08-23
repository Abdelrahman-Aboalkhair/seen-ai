import React, { useState } from "react";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { TalentSearchHistoryModal } from "./TalentSearchHistoryModal";

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
      month: "short",
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

  // Truncate long text
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
        <div
          className={`flex items-start justify-between mb-4 ${
            isRTL() ? "flex-row-reverse" : ""
          }`}
        >
          <div className="flex-1 min-w-0">
            <div
              className={`flex items-center mb-3 ${
                isRTL()
                  ? "flex-row-reverse space-x-reverse space-x-4"
                  : "space-x-4"
              }`}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1 truncate">
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
            )} border rounded-lg p-2 min-w-[60px] shadow-sm backdrop-blur-sm flex-shrink-0`}
          >
            <div className="text-sm font-bold">
              {getStatusLabel(item.status)}
            </div>
            <div className="text-xs opacity-80">{item.credits_cost} كريدت</div>
          </div>
        </div>

        {/* Search Query - Compact */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-200 mb-2">
            استعلام البحث
          </h4>
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
            {truncateText(parseSearchQuery(item.search_query))}
          </p>
        </div>

        {/* Skills Preview - Compact */}
        {item.required_skills && item.required_skills.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-2">
              المهارات المطلوبة
            </h4>
            <div className="flex flex-wrap gap-2">
              {item.required_skills
                .slice(0, 3)
                .map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 text-xs font-medium px-2 py-1 rounded-full border border-cyan-500/30 backdrop-blur-sm"
                  >
                    {skill}
                  </span>
                ))}
              {item.required_skills.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-1">+المزيد</span>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="text-xs text-gray-500 mb-1">عدد المرشحين</div>
            <div className="text-sm font-medium text-blue-400">
              {item.candidate_count}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="text-xs text-gray-500 mb-1">عتبة المطابقة</div>
            <div className="text-sm font-medium text-green-400">
              {item.match_threshold}%
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
        <div
          className={`flex items-center justify-between pt-4 border-t border-slate-700/50 ${
            isRTL() ? "flex-row-reverse" : ""
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(item);
            }}
            className={`flex items-center text-cyan-400 hover:text-cyan-300 transition-all duration-200 text-sm font-medium px-3 py-2 rounded-lg hover:bg-cyan-500/10 group ${
              isRTL()
                ? "flex-row-reverse space-x-reverse space-x-2"
                : "space-x-2"
            }`}
          >
            <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span>عرض النتائج</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className={`flex items-center text-red-400 hover:text-red-300 transition-all duration-200 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-500/10 group ${
              isRTL()
                ? "flex-row-reverse space-x-reverse space-x-2"
                : "space-x-2"
            }`}
          >
            <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span>حذف</span>
          </button>
        </div>
      </motion.div>

      {/* Details Modal */}
      <TalentSearchHistoryModal
        item={item}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onView={onView}
        onDelete={onDelete}
      />
    </>
  );
}
