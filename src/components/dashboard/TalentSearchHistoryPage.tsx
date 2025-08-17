import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  RefreshCw,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  Target,
  Star,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { TalentSearchHistoryCard } from "../ui/TalentSearchHistoryCard";
import { CandidateCard } from "../ui/CandidateCard";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

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

export function TalentSearchHistoryPage() {
  const { t, isRTL } = useTranslation();
  const { user } = useAuth();
  const [history, setHistory] = useState<TalentSearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] =
    useState<TalentSearchHistoryItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load talent search history
  const loadHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("talent_searches")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setHistory(data || []);
    } catch (err: any) {
      console.error("Error loading talent search history:", err);
      setError(err.message || "فشل في تحميل سجل عمليات البحث");
    } finally {
      setLoading(false);
    }
  };

  // Delete talent search
  const handleDelete = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("talent_searches")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Remove from local state
      setHistory(history.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error("Error deleting talent search:", err);
      setError(err.message || "فشل في حذف عملية البحث");
    }
  };

  // View talent search details
  const handleView = (item: TalentSearchHistoryItem) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  // Filter history based on search and status
  const filteredHistory = history.filter((item) => {
    const searchQueryText =
      typeof item.search_query === "string"
        ? item.search_query
        : JSON.stringify(item.search_query);

    const matchesSearch =
      searchQueryText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.required_skills &&
        item.required_skills.some((skill) =>
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
      (item.certifications &&
        item.certifications.some((cert) =>
          cert.toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
      (item.languages &&
        item.languages.some((lang) =>
          lang.toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
      (item.education_level &&
        item.education_level.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Load history on component mount
  useEffect(() => {
    loadHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">جاري تحميل سجل عمليات البحث...</p>
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
              سجل عمليات البحث عن المواهب
            </h1>
            <p className="text-gray-400">
              عرض جميع عمليات البحث عن المواهب السابقة
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-500">
                {history.length}
              </div>
              <div className="text-sm text-gray-400">إجمالي عمليات البحث</div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {history.filter((item) => item.status === "completed").length}
                </div>
                <div className="text-sm text-gray-400">مكتمل</div>
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
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {history.filter((item) => item.status === "pending").length}
                </div>
                <div className="text-sm text-gray-400">في الانتظار</div>
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
                <div className="text-sm text-gray-400">فشل</div>
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
              placeholder="البحث في عمليات البحث..."
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
            <option value="completed">مكتمل</option>
            <option value="processing">قيد المعالجة</option>
            <option value="pending">في الانتظار</option>
            <option value="failed">فشل</option>
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
          <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            لا توجد عمليات بحث
          </h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== "all"
              ? "لا توجد نتائج تطابق البحث"
              : "لم تقم بأي عملية بحث عن المواهب بعد"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredHistory.map((item, index) => (
            <TalentSearchHistoryCard
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
          <div className="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div
                className={`flex items-center justify-between mb-6 ${
                  isRTL() ? "flex-row-reverse" : ""
                }`}
              >
                <h2 className="text-2xl font-bold text-white">
                  تفاصيل نتائج البحث
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Search Summary */}
              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">
                  ملخص البحث
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">عدد المرشحين:</span>
                    <span className="text-white ml-2">
                      {selectedItem.candidate_count}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">عتبة المطابقة:</span>
                    <span className="text-white ml-2">
                      {selectedItem.match_threshold}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">المرشحون المطابقون:</span>
                    <span className="text-green-400 ml-2">
                      {selectedItem.results?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">التكلفة:</span>
                    <span className="text-white ml-2">
                      {selectedItem.credits_cost} كريدت
                    </span>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {selectedItem.results && selectedItem.results.length > 0 ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">
                    المرشحون المطابقون ({selectedItem.results.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedItem.results.map((candidate, index) => (
                      <CandidateCard
                        key={index}
                        candidate={candidate}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">لا توجد نتائج مطابقة</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
