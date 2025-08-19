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
} from "lucide-react";
import { TestType, Question, Candidate } from "../types";

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
    <div className="space-y-6">
      {/* Interview Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            ملخص المقابلة
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            راجع تفاصيل المقابلة قبل إرسال الروابط للمرشحين
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              معلومات الوظيفة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">
                  عنوان الوظيفة
                </div>
                <div className="font-medium">{interviewData.jobTitle}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  مستوى الاختبار
                </div>
                <div className="font-medium">{interviewData.testLevel}</div>
              </div>
              {interviewData.jobDescription && (
                <div className="md:col-span-2">
                  <div className="text-sm text-muted-foreground">
                    وصف الوظيفة
                  </div>
                  <div className="text-sm">{interviewData.jobDescription}</div>
                </div>
              )}
            </div>
          </div>

          {/* Test Configuration */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              إعدادات الاختبار
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-lg font-bold">
                  {interviewData.durationMinutes}
                </div>
                <div className="text-sm text-muted-foreground">دقيقة</div>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <FileText className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-lg font-bold">{questions.length}</div>
                <div className="text-sm text-muted-foreground">سؤال</div>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <div className="text-lg font-bold">{candidates.length}</div>
                <div className="text-sm text-muted-foreground">مرشح</div>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <CreditCard className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div className="text-lg font-bold">
                  {interviewData.creditsUsed}
                </div>
                <div className="text-sm text-muted-foreground">كريدت</div>
              </div>
            </div>
          </div>

          {/* Selected Test Types */}
          <div>
            <h3 className="font-semibold mb-3">أنواع الاختبارات المختارة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {interviewData.selectedTestTypes?.map((testType: TestType) => (
                <div
                  key={testType.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="text-2xl">{testType.icon}</div>
                  <div>
                    <div className="font-medium">{testType.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {questionsByType[testType.name]?.length || 0} أسئلة
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Language Proficiency */}
          {interviewData.languageProficiency && (
            <div>
              <h3 className="font-semibold mb-3">لغة الاختبار</h3>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {interviewData.languageProficiency}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions Preview */}
      <Card>
        <CardHeader>
          <CardTitle>معاينة الأسئلة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(questionsByType).map(
              ([testType, typeQuestions]) => (
                <div key={testType}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{getTestTypeIcon(testType)}</span>
                    <h4 className="font-semibold">
                      {getTestTypeLabel(testType)}
                    </h4>
                    <Badge variant="secondary">
                      {typeQuestions.length} سؤال
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {typeQuestions.slice(0, 3).map((question, index) => (
                      <div key={index} className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm font-medium">
                          السؤال {index + 1}: {question.questionText}
                        </div>
                      </div>
                    ))}

                    {typeQuestions.length > 3 && (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        + {typeQuestions.length - 3} أسئلة أخرى
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Candidates List */}
      <Card>
        <CardHeader>
          <CardTitle>المرشحون المحددون</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {candidates.map((candidate, index) => (
              <div
                key={candidate.candidateId}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{candidate.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {candidate.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline">في انتظار الرابط</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={onGenerateLinks}
              disabled={loading || candidates.length === 0}
              size="lg"
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  جاري إنشاء الروابط...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  إنشاء وإرسال روابط المقابلة
                </>
              )}
            </Button>

            <Button onClick={onResetInterview} variant="outline" size="lg">
              إنشاء مقابلة جديدة
            </Button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  ما يحدث بعد الضغط على "إنشاء الروابط":
                </div>
                <ul className="text-blue-700 dark:text-blue-200 space-y-1">
                  <li>• سيتم إنشاء رابط فريد لكل مرشح</li>
                  <li>• سيتم إرسال رابط المقابلة عبر البريد الإلكتروني</li>
                  <li>• الروابط صالحة لمدة 7 أيام</li>
                  <li>• يمكن للمرشحين البدء في المقابلة في أي وقت</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
