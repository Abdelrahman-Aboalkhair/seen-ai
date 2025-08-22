import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "../../lib/i18n";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import {
  Calendar,
  Clock,
  Users,
  Video,
  MessageSquare,
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Brain,
  Eye,
  Trash2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  Target,
} from "lucide-react";
import { useInterviews } from "../../features/interview/hooks/useInterviews";

export function InterviewPage() {
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState("pending");
  const { interviews, loading, error, refetch, deleteInterview } =
    useInterviews();
  console.log("interviews: ", interviews);

  // Helper function to get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          text: "معلق",
          className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        };
      case "questions_ready":
        return {
          text: "الأسئلة جاهزة",
          className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        };
      case "candidates_added":
        return {
          text: "تم إضافة المرشحين",
          className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        };
      case "active":
        return {
          text: "نشط",
          className: "bg-green-500/20 text-green-400 border-green-500/30",
        };
      case "completed":
        return {
          text: "مكتمل",
          className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        };
      default:
        return {
          text: status,
          className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        };
    }
  };

  // Calculate statistics
  const completedInterviews = interviews.filter(
    (interview) => interview.status === "completed"
  );

  const activeInterviews = interviews.filter(
    (interview) =>
      interview.status === "active" ||
      interview.status === "questions_ready" ||
      interview.status === "candidates_added"
  );

  const pendingInterviews = interviews.filter(
    (interview) => interview.status === "pending"
  );

  const averageScore =
    completedInterviews.length > 0
      ? Math.round(
          completedInterviews.reduce(
            (sum, interview) =>
              sum + (interview._count?.interview_sessions || 0),
            0
          ) / completedInterviews.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {t("dashboard.interview")}
          </h1>
          <p className="text-gray-400 mt-1">
            {t("dashboard.interview_description")}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/dashboard/interview-wizard"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            إنشاء مقابلة جديدة
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  المقابلات المعلقة
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {loading ? "..." : pendingInterviews.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  المقابلات النشطة
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {loading ? "..." : activeInterviews.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Video className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("dashboard.completed_interviews")}
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {loading ? "..." : completedInterviews.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("dashboard.avg_score")}
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {loading ? "..." : `${averageScore}%`}
                </p>
              </div>
              <div className="h-12 w-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <h3 className="font-semibold text-red-400">
                  خطأ في تحميل البيانات
                </h3>
                <p className="text-sm text-red-300">{error}</p>
              </div>
              <Button
                onClick={refetch}
                variant="outline"
                size="sm"
                className="ml-auto border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                إعادة المحاولة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              {t("dashboard.interview_management")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                تحديث
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "pending"
                  ? "bg-yellow-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              المقابلات المعلقة ({loading ? "..." : pendingInterviews.length})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "active"
                  ? "bg-cyan-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              المقابلات النشطة ({loading ? "..." : activeInterviews.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "completed"
                  ? "bg-cyan-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              المقابلات المكتملة ({loading ? "..." : completedInterviews.length}
              )
            </button>
          </div>

          {/* Interview List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
              <p className="text-gray-500">جاري التحميل...</p>
            </div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-400 mb-2">
                لا توجد مقابلات بعد
              </h3>
              <p className="text-gray-500 mb-6">
                قم بإنشاء مقابلة جديدة لبدء العمل
              </p>
              <Link
                to="/dashboard/interview-wizard"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                إنشاء مقابلة جديدة
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews
                .filter((interview) => {
                  if (activeTab === "active") {
                    return (
                      interview.status === "active" ||
                      interview.status === "questions_ready" ||
                      interview.status === "candidates_added"
                    );
                  } else if (activeTab === "pending") {
                    return interview.status === "pending";
                  } else {
                    return interview.status === "completed";
                  }
                })
                .map((interview) => (
                  <Card
                    key={interview.id}
                    className="bg-slate-700/50 border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">
                              {interview.job_title}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                getStatusBadge(interview.status).className
                              }`}
                            >
                              {getStatusBadge(interview.status).text}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            {interview.job_description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {interview.duration_minutes} دقيقة
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(
                                interview.created_at
                              ).toLocaleDateString("ar-SA")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {interview.test_types?.length || 0} نوع اختبار
                            </span>
                            {interview._count && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {interview._count.interview_sessions || 0} مرشح
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/dashboard/interview-results/${interview.id}`}
                            className="inline-flex items-center px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            عرض النتائج
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteInterview(interview.id)}
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
