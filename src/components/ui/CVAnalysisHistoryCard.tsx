import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Calendar,
  User,
  Star,
  Eye,
  Download,
  Trash2,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface CVAnalysisHistoryItem {
  id: string;
  user_id: string;
  job_title: string;
  job_description: string;
  required_skills: string[];
  file_count: number;
  results: any[];
  credits_cost: number;
  status: string;
  created_at: string;
}

interface CVAnalysisHistoryCardProps {
  item: CVAnalysisHistoryItem;
  index: number;
  onView: (item: CVAnalysisHistoryItem) => void;
  onDelete: (id: string) => void;
}

export function CVAnalysisHistoryCard({
  item,
  index,
  onView,
  onDelete,
}: CVAnalysisHistoryCardProps) {
  const { t, isRTL } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500 bg-green-500/10 border-green-500/30";
      case "processing":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "failed":
        return "text-red-500 bg-red-500/10 border-red-500/30";
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
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {item.job_title}
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

      {/* Job Description */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">وصف الوظيفة:</h4>
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
          {item.job_description}
        </p>
      </div>

      {/* Skills Required */}
      {item.required_skills && item.required_skills.length > 0 && (
        <div className="mb-4">
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

      {/* Analysis Results Summary */}
      {item.results && item.results.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            نتائج التحليل:
          </h4>
          <div className="space-y-2">
            {item.results.map((result: any, idx: number) => (
              <div key={idx} className="bg-gray-800/50 rounded-lg p-3">
                <div
                  className={`flex items-center justify-between mb-2 ${
                    isRTL() ? "flex-row-reverse" : ""
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-white">
                      {result.name || "غير محدد"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-500 font-medium">
                      {result.vote}/10
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {result.summary}
                </p>
              </div>
            ))}
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
            <span className="text-sm">عرض التفاصيل</span>
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
