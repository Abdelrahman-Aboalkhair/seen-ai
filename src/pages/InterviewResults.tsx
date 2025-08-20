import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Progress } from "../components/ui/Progress";
import { Separator } from "../components/ui/Separator";
import {
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  Brain,
  Star,
  Target,
  Award,
  Users,
  ArrowLeft,
  RefreshCw,
  Trophy,
  Zap,
  Eye,
  BarChart3,
  Lightbulb,
  Shield,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

interface InterviewResult {
  id: string;
  interview_id: string;
  candidate_id: string;
  score: number;
  feedback: string;
  completed_at: string;
  interview_candidates: {
    name: string;
    email: string;
  };
  interviews: {
    job_title: string;
    job_description: string;
    test_types: string[];
  };
}

interface InterviewAnalysis {
  id: string;
  session_id: string;
  test_type: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  analysis_data: any;
  created_at: string;
}

interface InterviewSession {
  id: string;
  interview_id: string;
  candidate_id: string;
  session_token: string;
  status: "pending" | "started" | "completed" | "expired";
  started_at?: string;
  completed_at?: string;
  expires_at: string;
  created_at: string;
  interview_candidates: {
    name: string;
    email: string;
  };
  interviews: {
    job_title: string;
    job_description: string;
    test_types: string[];
  };
}

export const InterviewResults: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [analyses, setAnalyses] = useState<InterviewAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    if (interviewId) {
      loadInterviewResults();
    }
  }, [interviewId]);

  const loadInterviewResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the edge function to get interview data with results
      const { data, error: fetchError } = await supabase.functions.invoke(
        "get-interview-data",
        {
          method: "POST",
          body: {
            interviewId,
            includeResults: true,
          },
        }
      );

      if (fetchError) throw fetchError;

      if (!data.success) {
        throw new Error(
          data.error?.message || "Failed to fetch interview results"
        );
      }

      console.log("Interview results data:", data.data);
      setSessions(data.data.sessions || []);
      setAnalyses(data.data.analyses || []);
    } catch (error: any) {
      console.error("Error loading interview results:", error);
      setError(error.message);
      toast.error("فشل في تحميل نتائج المقابلة");
    } finally {
      setLoading(false);
    }
  };

  const getSessionAnalyses = (sessionId: string) => {
    return analyses.filter((a) => a.session_id === sessionId);
  };

  const getOverallAnalysis = (sessionId: string) => {
    return analyses.find(
      (a) => a.session_id === sessionId && a.test_type === "overall"
    );
  };

  const getTestTypeAnalyses = (sessionId: string) => {
    return analyses.filter(
      (a) => a.session_id === sessionId && a.test_type !== "overall"
    );
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation?.toLowerCase()) {
      case "hire":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "consider":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "reject":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20";
    if (score >= 60) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              جاري تحميل النتائج
            </h3>
            <p className="text-gray-400">
              يرجى الانتظار بينما نقوم بتحليل البيانات...
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full mb-6">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              خطأ في تحميل النتائج
            </h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button
              onClick={loadInterviewResults}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/dashboard/interview")}
              variant="outline"
              size="sm"
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة للمقابلات
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">نتائج المقابلة</h1>
              <p className="text-gray-400 mt-1">تحليل شامل لنتائج المرشحين</p>
            </div>
          </div>
          <Button
            onClick={loadInterviewResults}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-slate-600 text-gray-300 hover:bg-slate-700"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            تحديث
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">المرشحين</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {sessions.length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">المكتمل</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {sessions.filter((s) => s.status === "completed").length}
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
                  <p className="text-sm font-medium text-gray-400">التحليل</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {analyses.length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-400 mb-2">
                لا توجد نتائج بعد
              </h3>
              <p className="text-gray-500">لم يكمل أي مرشح المقابلة بعد</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sessions.map((session) => {
              const sessionAnalyses = getSessionAnalyses(session.id);
              const overallAnalysis = getOverallAnalysis(session.id);
              const testAnalyses = getTestTypeAnalyses(session.id);

              return (
                <Card
                  key={session.id}
                  className="bg-slate-800/50 border-slate-700 overflow-hidden"
                >
                  <CardHeader className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-b border-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-white">
                            {session.interview_candidates.name}
                          </CardTitle>
                          <p className="text-sm text-gray-400">
                            {session.interview_candidates.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            session.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {session.status === "completed"
                            ? "مكتمل"
                            : session.status === "started"
                            ? "قيد التقدم"
                            : "في الانتظار"}
                        </Badge>
                        {overallAnalysis && (
                          <Badge
                            className={`text-xs ${getRecommendationColor(
                              overallAnalysis.analysis_data?.recommendation
                            )}`}
                          >
                            {overallAnalysis.analysis_data?.recommendation ||
                              "غير محدد"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    {/* Job Info */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Target className="h-4 w-4 text-blue-400" />
                        </div>
                        <h4 className="font-semibold text-white">
                          معلومات الوظيفة
                        </h4>
                      </div>
                      <p className="text-white font-medium mb-1">
                        {session.interviews?.job_title || "N/A"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {session.interviews?.job_description ||
                          "No description available"}
                      </p>
                    </div>

                    {/* Overall Score */}
                    {overallAnalysis && (
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-white flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                              <Trophy className="h-4 w-4 text-white" />
                            </div>
                            النتيجة الإجمالية
                          </h4>
                          <div
                            className={`text-3xl font-bold ${getScoreColor(
                              overallAnalysis.score
                            )}`}
                          >
                            {overallAnalysis.score}/100
                          </div>
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between text-sm text-gray-400 mb-2">
                            <span>التقدم</span>
                            <span>{overallAnalysis.score}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-300 ${getScoreBgColor(
                                overallAnalysis.score
                              )}`}
                              style={{ width: `${overallAnalysis.score}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Strengths and Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                            <h5 className="font-medium text-green-400 mb-3 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              نقاط القوة
                            </h5>
                            <ul className="space-y-2">
                              {overallAnalysis.strengths?.map(
                                (strength, index) => (
                                  <li
                                    key={index}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <Star className="h-3 w-3 text-green-400 flex-shrink-0" />
                                    <span className="text-gray-300">
                                      {strength}
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                          <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                            <h5 className="font-medium text-red-400 mb-3 flex items-center gap-2">
                              <TrendingDown className="h-4 w-4" />
                              نقاط الضعف
                            </h5>
                            <ul className="space-y-2">
                              {overallAnalysis.weaknesses?.map(
                                (weakness, index) => (
                                  <li
                                    key={index}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
                                    <span className="text-gray-300">
                                      {weakness}
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Test Type Breakdown */}
                    {testAnalyses.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <BarChart3 className="h-4 w-4 text-purple-400" />
                          </div>
                          تفصيل النتائج حسب نوع الاختبار
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {testAnalyses.map((analysis) => (
                            <Card
                              key={analysis.id}
                              className="bg-slate-700/50 border-slate-600 p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-white">
                                  {analysis.test_type}
                                </h5>
                                <div
                                  className={`font-bold text-lg ${getScoreColor(
                                    analysis.score
                                  )}`}
                                >
                                  {analysis.score}/100
                                </div>
                              </div>

                              <div className="mb-4">
                                <div className="w-full bg-slate-600 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${getScoreBgColor(
                                      analysis.score
                                    )}`}
                                    style={{ width: `${analysis.score}%` }}
                                  ></div>
                                </div>
                              </div>

                              {analysis.strengths &&
                                analysis.strengths.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-xs text-green-400 font-medium mb-1">
                                      نقاط القوة:
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {analysis.strengths
                                        .slice(0, 2)
                                        .join(", ")}
                                      {analysis.strengths.length > 2 && "..."}
                                    </p>
                                  </div>
                                )}

                              {analysis.weaknesses &&
                                analysis.weaknesses.length > 0 && (
                                  <div>
                                    <p className="text-xs text-red-400 font-medium mb-1">
                                      نقاط الضعف:
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {analysis.weaknesses
                                        .slice(0, 2)
                                        .join(", ")}
                                      {analysis.weaknesses.length > 2 && "..."}
                                    </p>
                                  </div>
                                )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detailed Analysis */}
                    {overallAnalysis?.analysis_data?.detailedSummary && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                          <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                            <Lightbulb className="h-4 w-4 text-cyan-400" />
                          </div>
                          التحليل التفصيلي
                        </h4>
                        <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                          <p className="text-sm leading-relaxed text-gray-300">
                            {overallAnalysis.analysis_data.detailedSummary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Session Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-400 pt-4 border-t border-slate-600">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(session.created_at).toLocaleDateString(
                          "ar-SA"
                        )}
                      </span>
                      {session.completed_at && (
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {new Date(session.completed_at).toLocaleDateString(
                            "ar-SA"
                          )}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return <div className="p-6">{renderContent()}</div>;
};
