import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  RefreshCw,
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { CVAnalysisHistoryCard } from "../ui/CVAnalysisHistoryCard";
import { CVAnalysisCard } from "../ui/CVAnalysisCard";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

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

export function CVAnalysisHistoryPage() {
  const { t, isRTL } = useTranslation();
  const { user } = useAuth();
  const [history, setHistory] = useState<CVAnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] =
    useState<CVAnalysisHistoryItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load CV analysis history
  const loadHistory = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("cv_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setHistory(data || []);
    } catch (err: any) {
      console.error("Error loading CV analysis history:", err);
      setError(err.message || t("error.load_analysis_history"));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  // Delete CV analysis
  const handleDelete = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("cv_analyses")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Remove from local state
      setHistory(history.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error("Error deleting CV analysis:", err);
      setError(err.message || t("error.delete_analysis"));
    }
  };

  // View CV analysis details
  const handleView = (item: CVAnalysisHistoryItem) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  // Filter history based on search and status
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.job_description &&
        item.job_description
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (item.required_skills &&
        item.required_skills.some((skill) =>
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ));

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Load history on component mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">
            {t("history.loading_analysis_history")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadHistory}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div
          className={`flex items-center justify-between mb-4 ${
            isRTL() ? "flex-row-reverse" : ""
          }`}
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t("history.cv_analysis_history")}
            </h1>
            <p className="text-gray-400">
              {t("history.cv_analysis_history_description")}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-cyan-500">
                {history.length}
              </div>
              <div className="text-sm text-gray-400">
                {t("history.total_analyses")}
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {history.filter((item) => item.status === "completed").length}
                </div>
                <div className="text-sm text-gray-400">
                  {t("history.completed")}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {
                    history.filter((item) => item.status === "processing")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-400">قيد المعالجة</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {history.filter((item) => item.status === "failed").length}
                </div>
                <div className="text-sm text-gray-400">
                  {t("history.failed")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div
          className={`flex flex-col md:flex-row gap-4 ${
            isRTL() ? "md:flex-row-reverse" : ""
          }`}
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("history.search_in_analyses")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">جميع الحالات</option>
            <option value="completed">{t("history.completed")}</option>
            <option value="processing">قيد المعالجة</option>
            <option value="failed">{t("history.failed")}</option>
          </select>

          <button
            onClick={loadHistory}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            {t("history.no_analyses")}
          </h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== "all"
              ? t("history.no_analysis_results")
              : t("history.no_analyses_yet")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredHistory.map((item, index) => (
            <CVAnalysisHistoryCard
              key={item.id}
              item={item}
              index={index}
              onView={handleView}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div
                className={`flex items-center justify-between mb-6 ${
                  isRTL() ? "flex-row-reverse" : ""
                }`}
              >
                <h2 className="text-2xl font-bold text-white">
                  {t("history.analysis_details")}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {selectedItem.results.map((result, index) => (
                  <CVAnalysisCard
                    key={index}
                    candidate={result}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
