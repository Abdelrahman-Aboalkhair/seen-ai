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
  Users,
  Clock,
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
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "processing":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "failed":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTopCandidates = () => {
    if (
      !item.results ||
      !Array.isArray(item.results) ||
      item.results.length === 0
    )
      return [];
    return item.results
      .filter((result) => result && typeof result === "object" && result.vote)
      .sort((a, b) => parseInt(b.vote) - parseInt(a.vote))
      .slice(0, 3);
  };

  const topCandidates = getTopCandidates();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">
                {item.job_title}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="h-3 w-3" />
                <span>{formatDate(item.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`flex flex-col items-center ${getStatusColor(
            item.status
          )} border rounded-lg px-3 py-2 min-w-[70px]`}
        >
          <div className="text-xs font-bold">{getStatusLabel(item.status)}</div>
          <div className="text-xs opacity-80">{item.credits_cost} كريدت</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Users className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">
              {Array.isArray(item.results) ? item.results.length : 0}
            </span>
          </div>
          <div className="text-xs text-gray-400">مرشح</div>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <FileText className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-white">
              {item.file_count || 0}
            </span>
          </div>
          <div className="text-xs text-gray-400">ملف</div>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-white">
              {topCandidates.length > 0 && topCandidates[0]?.vote
                ? topCandidates[0].vote
                : "0"}
              /10
            </span>
          </div>
          <div className="text-xs text-gray-400">أعلى تقييم</div>
        </div>
      </div>

      {/* Job Description Preview */}
      {item.job_description && (
        <div className="mb-4">
          <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">
            {item.job_description}
          </p>
        </div>
      )}

      {/* Top Skills */}
      {item.required_skills && item.required_skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {item.required_skills
              .slice(0, 4)
              .map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-md border border-cyan-500/30"
                >
                  {skill}
                </span>
              ))}
            {item.required_skills.length > 4 && (
              <span className="px-2 py-1 bg-slate-600/50 text-gray-400 text-xs rounded-md">
                +{item.required_skills.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Top Candidates Preview */}
      {topCandidates.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            أفضل المرشحين:
          </h4>
          <div className="space-y-2">
            {topCandidates.map((result: any, idx: number) => (
              <div key={idx} className="bg-slate-700/30 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="text-xs font-medium text-white line-clamp-1">
                      {result.name || "غير محدد"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-medium">
                      {result.vote}/10
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-600">
        <button
          onClick={() => onView(item)}
          className="flex items-center space-x-2 px-3 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/30"
        >
          <Eye className="h-4 w-4" />
          <span className="text-sm">عرض التفاصيل</span>
        </button>

        <button
          onClick={() => onDelete(item.id)}
          className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-sm">حذف</span>
        </button>
      </div>
    </motion.div>
  );
}
