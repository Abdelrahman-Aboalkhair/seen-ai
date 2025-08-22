import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import {
  Play,
  Mail,
  Users,
  FileText,
  Clock,
  CheckCircle,
  ArrowLeft,
  Target,
  Brain,
  Trophy,
  Calendar,
  Globe,
  Eye,
  BarChart3,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { InterviewData } from "../types";
import toast from "react-hot-toast";

interface InterviewManagementStepProps {
  interviewData: InterviewData;
  onStartInterview: () => Promise<void>;
  onSendInvitations: () => Promise<boolean>;
  onBackToSetup: () => void;
}

export const InterviewManagementStep: React.FC<
  InterviewManagementStepProps
> = ({ interviewData, onStartInterview, onSendInvitations, onBackToSetup }) => {
  const [invitationsSent, setInvitationsSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [startingInterview, setStartingInterview] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);

  const handleSendInvitations = async () => {
    try {
      setSendingInvitations(true);
      const success = await onSendInvitations();
      if (success) {
        setInvitationsSent(true);
      }
    } catch (error) {
      console.error("Error sending invitations:", error);
    } finally {
      setSendingInvitations(false);
    }
  };

  const handleStartInterview = async () => {
    try {
      setStartingInterview(true);
      await onStartInterview();
    } catch (error) {
      console.error("Error starting interview:", error);
    } finally {
      setStartingInterview(false);
    }
  };

  const copyInterviewLink = async () => {
    try {
      setCopyingLink(true);
      const link = `${window.location.origin}/dashboard/interview-results/${interviewData.id}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("تم نسخ الرابط");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("فشل في نسخ الرابط");
    } finally {
      setCopyingLink(false);
    }
  };

  const getTestTypeIcon = (testType: string) => {
    const icons: Record<string, string> = {
      biometric: "🎭",
      iq: "🧠",
      psychometric: "📊",
      competency: "🎯",
      eq: "❤️",
      sjt: "⚖️",
      technical: "💻",
      language: "🌍",
    };
    return icons[testType] || "❓";
  };

  const getTestTypeLabel = (testType: string) => {
    const labels: Record<string, string> = {
      biometric: "اختبار بيومتري",
      iq: "اختبار الذكاء",
      psychometric: "اختبار نفسي",
      competency: "اختبار الكفاءة",
      eq: "اختبار الذكاء العاطفي",
      sjt: "اختبار الحكم الموقفي",
      technical: "اختبار تقني",
      language: "اختبار اللغة",
    };
    return labels[testType] || testType;
  };

  // Show success state after sending invitations
  if (invitationsSent) {
    return (
      <div className="space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">تم إرسال الدعوات بنجاح!</h2>
          <p className="text-muted-foreground">
            تم إرسال روابط المقابلة للمرشحين. يمكنك الآن متابعة تقدمهم.
          </p>
        </div>

        {/* What's Next Section */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              ما التالي؟
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-green-800 dark:text-green-200">
                  للمرشحين:
                </h4>
                <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    سيتلقون بريد إلكتروني برابط المقابلة
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    يمكنهم الوصول للمقابلة خلال 7 أيام
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    سيتم تحليل إجاباتهم تلقائياً
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-green-800 dark:text-green-200">
                  لك (HR):
                </h4>
                <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    ستظهر النتائج في لوحة التحكم
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    يمكنك متابعة تقدم المرشحين
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    ستتلقى إشعارات عند اكتمال المقابلات
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* View Results */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">عرض النتائج</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    انتقل إلى صفحة النتائج لمتابعة التقدم
                  </p>
                </div>
                <Button
                  onClick={() =>
                    (window.location.href = `/dashboard/interview-results/${interviewData.id}`)
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  عرض النتائج
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Copy Link */}
          <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <Copy className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">نسخ الرابط</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    انسخ رابط النتائج للمشاركة
                  </p>
                </div>
                <Button
                  onClick={copyInterviewLink}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {copyingLink ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      جاري النسخ
                    </>
                  ) : (
                    <>
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          تم النسخ
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          نسخ الرابط
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Back to Dashboard */}
          <Card className="border-gray-200 bg-gray-50 dark:bg-gray-950/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                  <ArrowLeft className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">العودة للوحة التحكم</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    انتقل إلى صفحة المقابلات الرئيسية
                  </p>
                </div>
                <Button
                  onClick={() =>
                    (window.location.href = "/dashboard/interview")
                  }
                  className="w-full bg-gray-600 hover:bg-gray-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  العودة للوحة التحكم
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex justify-center">
          <Button onClick={() => setInvitationsSent(false)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة لإدارة المقابلة
          </Button>
        </div>
      </div>
    );
  }

  // Original management interface
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <h2 className="text-2xl font-bold">تم إنشاء المقابلة بنجاح!</h2>
        </div>
        <p className="text-muted-foreground">
          المقابلة جاهزة الآن. يمكنك بدء المقابلة بنفسك أو إرسال الروابط
          للمرشحين.
        </p>
      </div>

      {/* Interview Summary */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            ملخص المقابلة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">معلومات الوظيفة</h4>
              <p className="text-sm text-muted-foreground">
                {interviewData.jobTitle}
              </p>
              {interviewData.jobDescription && (
                <p className="text-sm text-muted-foreground mt-1">
                  {interviewData.jobDescription.substring(0, 100)}...
                </p>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-2">التفاصيل</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{interviewData.durationMinutes} دقيقة</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{interviewData.totalQuestions} سؤال</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{interviewData.candidates?.length || 0} مرشح</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Types */}
          <div>
            <h4 className="font-semibold mb-2">أنواع الاختبارات</h4>
            <div className="flex flex-wrap gap-2">
              {interviewData.selectedTestTypes.map((testType) => (
                <Badge
                  key={testType.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <span>{getTestTypeIcon(testType.name)}</span>
                  <span>{getTestTypeLabel(testType.name)}</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">الحالة:</span>
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              نشط
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Interview Button */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Play className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">ابدأ المقابلة</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  جرب المقابلة بنفسك كما سيراها المرشحون
                </p>
              </div>
              <Button
                onClick={handleStartInterview}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {startingInterview ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    جاري البدء
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    ابدأ المقابلة الآن
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Send Invitations Button */}
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">إرسال الروابط</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  أرسل روابط المقابلة للمرشحين المحددين
                </p>
              </div>
              <Button
                onClick={handleSendInvitations}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {sendingInvitations ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    جاري إرسال الروابط
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    إرسال الروابط
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button onClick={onBackToSetup} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          العودة للإعداد
        </Button>

        <div className="text-sm text-muted-foreground">
          يمكنك العودة إلى هذه الصفحة في أي وقت من لوحة التحكم
        </div>
      </div>
    </div>
  );
};
