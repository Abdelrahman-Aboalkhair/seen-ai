import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import {
  User,
  Target,
  Shield,
  Trophy,
  TrendingUp,
  TrendingDown,
  Star,
  AlertCircle,
  BarChart3,
  FileText,
  Lightbulb,
  Calendar,
  Clock,
} from "lucide-react";

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

interface InterviewSessionCardProps {
  session: InterviewSession;
  overallAnalysis: InterviewAnalysis | undefined;
  testAnalyses: InterviewAnalysis[];
  getRecommendationColor: (recommendation: string) => string;
  getScoreColor: (score: number) => string;
  getScoreBgColor: (score: number) => string;
}

export const InterviewSessionCard: React.FC<InterviewSessionCardProps> = ({
  session,
  overallAnalysis,
  testAnalyses,
  getRecommendationColor,
  getScoreColor,
  getScoreBgColor,
}) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
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
              variant={session.status === "completed" ? "default" : "secondary"}
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
                {overallAnalysis.analysis_data?.recommendation || "غير محدد"}
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
            <h4 className="font-semibold text-white">معلومات الوظيفة</h4>
          </div>
          <p className="text-white font-medium mb-1">
            {session.interviews?.job_title || "N/A"}
          </p>
          <p className="text-sm text-gray-400 mb-3">
            {session.interviews?.job_description || "No description available"}
          </p>
          {session.interviews?.test_types &&
            session.interviews.test_types.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {session.interviews.test_types.map(
                  (type: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs"
                    >
                      {type === "technical"
                        ? "تقني"
                        : type === "competency"
                        ? "مهارات"
                        : type}
                    </span>
                  )
                )}
              </div>
            )}
        </div>

        {/* Recommendation */}
        {overallAnalysis?.analysis_data?.recommendation && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-purple-400" />
                </div>
                <h4 className="font-semibold text-white">التوصية النهائية</h4>
              </div>
              <div
                className={`px-4 py-2 rounded-lg border ${getRecommendationColor(
                  overallAnalysis.analysis_data.recommendation
                )}`}
              >
                <span className="font-medium">
                  {overallAnalysis.analysis_data.recommendation === "Hire"
                    ? "يُنصح بالتوظيف"
                    : overallAnalysis.analysis_data.recommendation ===
                      "Consider"
                    ? "يحتاج مراجعة"
                    : overallAnalysis.analysis_data.recommendation === "Reject"
                    ? "يُنصح بالرفض"
                    : overallAnalysis.analysis_data.recommendation}
                </span>
              </div>
            </div>
            {overallAnalysis.analysis_data.detailedSummary && (
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {overallAnalysis.analysis_data.detailedSummary}
                </p>
              </div>
            )}
          </div>
        )}

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
                  {overallAnalysis.strengths &&
                  overallAnalysis.strengths.length > 0 ? (
                    overallAnalysis.strengths.map((strength, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Star className="h-3 w-3 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300">{strength}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-center gap-2 text-sm">
                      <Star className="h-3 w-3 text-green-400 flex-shrink-0" />
                      <span className="text-gray-400 italic">
                        لا توجد نقاط قوة محددة
                      </span>
                    </li>
                  )}
                </ul>
              </div>
              <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <h5 className="font-medium text-red-400 mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  نقاط الضعف
                </h5>
                <ul className="space-y-2">
                  {overallAnalysis.weaknesses?.map((weakness, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
                      <span className="text-gray-300">{weakness}</span>
                    </li>
                  ))}
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
                      {analysis.test_type === "technical"
                        ? "الاختبار التقني"
                        : analysis.test_type === "competency"
                        ? "اختبار المهارات"
                        : analysis.test_type}
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

                  {analysis.strengths && analysis.strengths.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-green-400 font-medium mb-1">
                        نقاط القوة:
                      </p>
                      <p className="text-xs text-gray-400">
                        {analysis.strengths.slice(0, 2).join(", ")}
                        {analysis.strengths.length > 2 && "..."}
                      </p>
                    </div>
                  )}

                  {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                    <div>
                      <p className="text-xs text-red-400 font-medium mb-1">
                        نقاط الضعف:
                      </p>
                      <p className="text-xs text-gray-400">
                        {analysis.weaknesses.slice(0, 2).join(", ")}
                        {analysis.weaknesses.length > 2 && "..."}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Question-by-Question Analysis */}
        {overallAnalysis?.analysis_data?.testBreakdown && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-yellow-400" />
              </div>
              تحليل الأسئلة التفصيلي
            </h4>

            {overallAnalysis.analysis_data.testBreakdown.map(
              (testBreakdown: any, testIndex: number) => (
                <div key={testIndex} className="mb-6">
                  <h5 className="font-medium text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    {testBreakdown.testType === "technical"
                      ? "الأسئلة التقنية"
                      : testBreakdown.testType === "competency"
                      ? "أسئلة المهارات"
                      : testBreakdown.testType}
                  </h5>

                  {testBreakdown.detailedAnalysis?.questionAnalysis && (
                    <div className="space-y-3">
                      {testBreakdown.detailedAnalysis.questionAnalysis.map(
                        (questionAnalysis: any, qIndex: number) => (
                          <div
                            key={qIndex}
                            className="p-4 bg-slate-700/30 rounded-lg border border-slate-600"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-blue-400">
                                السؤال {questionAnalysis.questionNumber}
                              </span>
                              <div
                                className={`px-2 py-1 rounded text-xs font-medium ${getScoreBgColor(
                                  questionAnalysis.score
                                )}`}
                              >
                                {questionAnalysis.score}/100
                              </div>
                            </div>

                            {questionAnalysis.comments && (
                              <p className="text-sm text-gray-300 mb-3">
                                {questionAnalysis.comments}
                              </p>
                            )}

                            {questionAnalysis.weaknesses &&
                              questionAnalysis.weaknesses.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {questionAnalysis.weaknesses.map(
                                    (weakness: string, wIndex: number) => (
                                      <span
                                        key={wIndex}
                                        className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs"
                                      >
                                        {weakness}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )
            )}
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
            {new Date(session.created_at).toLocaleDateString("ar-SA")}
          </span>
          {session.completed_at && (
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {new Date(session.completed_at).toLocaleDateString("ar-SA")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
