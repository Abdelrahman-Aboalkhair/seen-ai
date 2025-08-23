import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FileText } from "lucide-react";
import { InterviewResultsHeader } from "../components/interview/InterviewResultsHeader";
import { InterviewResultsStats } from "../components/interview/InterviewResultsStats";
import { InterviewSessionCard } from "../components/interview/InterviewSessionCard";
import { useInterviewResults } from "../hooks/useInterviewResults";
import {
  getRecommendationColor,
  getScoreColor,
  getScoreBgColor,
} from "../utils/interviewUtils";

export const InterviewResults: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();

  const {
    sessions,
    analyses,
    loading,
    error,
    refetch,
    getOverallAnalysis,
    getTestTypeAnalyses,
  } = useInterviewResults(interviewId);

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
              <div className="h-8 w-8 text-white">⚠️</div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              خطأ في تحميل النتائج
            </h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button
              onClick={refetch}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <InterviewResultsHeader
          onBack={() => navigate("/dashboard/interview")}
          onRefresh={refetch}
          loading={loading}
        />

        <InterviewResultsStats
          sessionsCount={sessions.length}
          completedCount={
            sessions.filter((s) => s.status === "completed").length
          }
          analysesCount={analyses.length}
        />

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
              const overallAnalysis = getOverallAnalysis(session.id);
              const testAnalyses = getTestTypeAnalyses(session.id);

              return (
                <InterviewSessionCard
                  key={session.id}
                  session={session}
                  overallAnalysis={overallAnalysis}
                  testAnalyses={testAnalyses}
                  getRecommendationColor={getRecommendationColor}
                  getScoreColor={getScoreColor}
                  getScoreBgColor={getScoreBgColor}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return <div className="p-6">{renderContent()}</div>;
};
