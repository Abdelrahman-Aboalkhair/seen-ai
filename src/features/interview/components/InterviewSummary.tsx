import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Separator } from "../../../components/ui/Separator";
import {
  CheckCircle,
  Clock,
  Users,
  CreditCard,
  Share2,
  Mail,
  Copy,
  ExternalLink,
  FileText,
  Brain,
  Sparkles,
  Trophy,
  Target,
  Zap,
  Globe,
  Calendar,
  Building2,
  Star,
  ArrowRight,
  Play,
  Eye,
  RefreshCw,
} from "lucide-react";
import { TestType, Question, Candidate } from "../types";
import { useNavigate } from "react-router-dom";

interface InterviewSummaryProps {
  interviewData: any;
  questions: Question[];
  candidates: Candidate[];
  onGenerateLinks: () => void;
  onResetInterview: () => void;
  loading: boolean;
}

export const InterviewSummary: React.FC<InterviewSummaryProps> = ({
  interviewData,
  questions,
  candidates,
  onGenerateLinks,
  onResetInterview,
  loading,
}) => {
  const navigate = useNavigate();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(text);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const getTestTypeIcon = (testType: string) => {
    const type = interviewData.selectedTestTypes?.find(
      (t: TestType) => t.name === testType
    );
    return type?.icon || "📝";
  };

  const getTestTypeLabel = (testType: string) => {
    const type = interviewData.selectedTestTypes?.find(
      (t: TestType) => t.name === testType
    );
    return type?.label || testType;
  };

  const questionsByType = questions.reduce((acc, question) => {
    if (!acc[question.testType]) {
      acc[question.testType] = [];
    }
    acc[question.testType].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-2xl p-8 border border-green-500/20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            تم إنشاء المقابلة بنجاح! 🎉
          </h1>
          <p className="text-gray-400 text-lg mb-6">
            مقابلة{" "}
            <span className="text-green-400 font-semibold">
              {interviewData.jobTitle}
            </span>{" "}
            جاهزة للمشاركة
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {questions.length}
                </p>
                <p className="text-gray-400 text-sm">سؤال</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {candidates.length}
                </p>
                <p className="text-gray-400 text-sm">مرشح</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-center">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Clock className="h-5 w-5 text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {interviewData.durationMinutes}
                </p>
                <p className="text-gray-400 text-sm">دقيقة</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-center">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Target className="h-5 w-5 text-cyan-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {interviewData.selectedTestTypes?.length || 0}
                </p>
                <p className="text-gray-400 text-sm">نوع اختبار</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interview Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Job Information */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              معلومات الوظيفة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">عنوان الوظيفة</p>
                  <p className="text-white font-semibold">
                    {interviewData.jobTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Star className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">مستوى الاختبار</p>
                  <p className="text-white font-semibold">
                    {interviewData.testLevel}
                  </p>
                </div>
              </div>

              {interviewData.jobDescription && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mt-1">
                    <FileText className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">وصف الوظيفة</p>
                    <p className="text-white text-sm leading-relaxed">
                      {interviewData.jobDescription}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Configuration */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              إعدادات الاختبار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interviewData.languageProficiency && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <Globe className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">لغة الاختبار</p>
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        {interviewData.languageProficiency}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <CreditCard className="h-5 w-5 text-orange-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {interviewData.creditsUsed}
                  </p>
                  <p className="text-gray-400 text-sm">كريدت مستخدم</p>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Zap className="h-5 w-5 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {interviewData.selectedTestTypes?.length || 0}
                  </p>
                  <p className="text-gray-400 text-sm">نوع اختبار</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Types Overview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Brain className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            أنواع الاختبارات المختارة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interviewData.selectedTestTypes?.map((testType: TestType) => (
              <div
                key={testType.id}
                className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600 rounded-xl p-4 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{testType.icon}</div>
                  <div>
                    <h4 className="font-semibold text-white">
                      {testType.label}
                    </h4>
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                    >
                      {questionsByType[testType.name]?.length || 0} أسئلة
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  اختبار شامل لتقييم {testType.label.toLowerCase()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Questions Preview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <FileText className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            معاينة الأسئلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(questionsByType).map(
              ([testType, typeQuestions]) => (
                <div key={testType} className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl">{getTestTypeIcon(testType)}</div>
                    <div>
                      <h4 className="font-semibold text-white text-lg">
                        {getTestTypeLabel(testType)}
                      </h4>
                      <Badge
                        variant="outline"
                        className="bg-purple-500/10 text-purple-400 border-purple-500/20"
                      >
                        {typeQuestions.length} سؤال
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {typeQuestions.slice(0, 3).map((question, index) => (
                      <div
                        key={index}
                        className="bg-slate-800/50 border border-slate-600 rounded-lg p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-xs font-semibold text-blue-400">
                            {index + 1}
                          </div>
                          <p className="text-white text-sm leading-relaxed flex-1">
                            {question.questionText}
                          </p>
                        </div>
                      </div>
                    ))}

                    {typeQuestions.length > 3 && (
                      <div className="text-center py-3">
                        <Badge
                          variant="outline"
                          className="bg-gray-500/10 text-gray-400 border-gray-500/20"
                        >
                          + {typeQuestions.length - 3} أسئلة أخرى
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Candidates List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <Users className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            المرشحون المحددون
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidates.map((candidate, index) => (
              <div
                key={candidate.candidateId}
                className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600 rounded-xl p-4 hover:border-pink-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        {candidate.name}
                      </h4>
                      <p className="text-gray-400 text-sm">{candidate.email}</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    في انتظار الرابط
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Section */}
      <Card className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-green-500/20">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">
              جاهز لإرسال روابط المقابلة
            </h3>
            <p className="text-gray-400">
              سيتم إرسال روابط المقابلة إلى {candidates.length} مرشح محدد
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
            <Button
              onClick={onGenerateLinks}
              disabled={loading || candidates.length === 0}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 h-12"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  جاري إنشاء الروابط...
                </>
              ) : (
                <>
                  <Share2 className="h-5 w-5 mr-2" />
                  إنشاء وإرسال روابط المقابلة
                </>
              )}
            </Button>

            <Button
              onClick={onResetInterview}
              variant="outline"
              size="lg"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-12"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              إنشاء مقابلة جديدة
            </Button>
          </div>

          {/* View Results Button */}
          {interviewData?.id && (
            <div className="mt-6 pt-6 border-t border-green-500/20">
              <Button
                onClick={() =>
                  navigate(`/dashboard/interview-results/${interviewData.id}`)
                }
                variant="outline"
                size="lg"
                className="w-full bg-white/5 border-green-500/30 text-green-400 hover:bg-green-500/10 h-12"
              >
                <Eye className="h-5 w-5 mr-2" />
                عرض نتائج المقابلة
              </Button>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-400 mb-2">
                  ما يحدث بعد الضغط على "إنشاء الروابط":
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>سيتم إنشاء رابط فريد لكل مرشح</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>سيتم إرسال رابط المقابلة عبر البريد الإلكتروني</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>الروابط صالحة لمدة 7 أيام</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>يمكن للمرشحين البدء في المقابلة في أي وقت</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
