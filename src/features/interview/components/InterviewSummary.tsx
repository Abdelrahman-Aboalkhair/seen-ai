import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { CheckCircle, CreditCard, FileText, Clock, Eye, X, Sparkles } from "lucide-react";

interface InterviewSummaryProps {
  interviewData: any;
  questions: any[];
  canGenerateQuestions: boolean;
  onGenerateQuestions: () => void;
  generatingQuestions: boolean;
  balance: number;
  onContinueToNextStep?: () => void;
}

export const InterviewSummary: React.FC<InterviewSummaryProps> = ({
  interviewData,
  questions,
  canGenerateQuestions,
  onGenerateQuestions,
  generatingQuestions,
  balance,
  onContinueToNextStep,
}) => {
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  return (
    <>
      <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          ملخص المقابلة
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {interviewData.selectedTestTypes?.length || 0}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              أنواع الاختبارات
            </p>
          </div>

          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              {questions.length > 0 ? questions.length : (interviewData.totalQuestions || 0)}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              إجمالي الأسئلة
            </p>
          </div>

          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              {interviewData.creditsUsed || 0}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              الكريدت المطلوب
            </p>
          </div>
        </div>

        {/* Selected Test Types */}
        {interviewData.selectedTestTypes?.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              أنواع الاختبارات المحددة:
            </h4>
            <div className="space-y-2">
              {interviewData.selectedTestTypes.map(
                (testType: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                      >
                        {testType.label}
                      </Badge>
                      {testType.selectedPlan && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {testType.selectedPlan.questionCount} سؤال -{" "}
                          {testType.selectedPlan.duration} دقيقة
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testType.selectedPlan?.credits || 0} كريدت
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Credit Balance Check */}
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="h-5 w-5 text-amber-600" />
            <h4 className="font-semibold text-amber-800 dark:text-amber-200">
              رصيد الكريدت
            </h4>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-700 dark:text-amber-300">
              الرصيد الحالي: {balance} كريدت
            </span>
            <span className="text-sm text-amber-700 dark:text-amber-300">
              المطلوب: {interviewData.creditsUsed || 0} كريدت
            </span>
          </div>
          {balance < (interviewData.creditsUsed || 0) && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              ⚠️ رصيد الكريدت غير كافي. يرجى إضافة المزيد من الكريدت.
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="text-center">
          {questions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">
                  تم إنشاء {questions.length} سؤال بنجاح!
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => setShowQuestionsModal(true)}
                  variant="outline"
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  معاينة الأسئلة
                </Button>
                <Button
                  onClick={onContinueToNextStep}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  size="lg"
                >
                  المتابعة لإضافة المرشحين
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={onGenerateQuestions}
              disabled={!canGenerateQuestions || generatingQuestions}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {generatingQuestions ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري إنشاء الأسئلة...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 mr-2" />
                  إنشاء الأسئلة ({interviewData.creditsUsed || 0} كريدت)
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Questions Modal */}
    {showQuestionsModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                الأسئلة المُنشأة ({questions.length} سؤال)
              </h2>
              <button
                onClick={() => setShowQuestionsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card
                  key={index}
                  className="border border-gray-200 dark:border-gray-700"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {question.testType}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        السؤال {index + 1}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-gray-100 mb-3">
                      {question.questionText}
                    </p>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>المهارة المقاسة:</strong>{" "}
                      {question.skillMeasured}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowQuestionsModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
};
