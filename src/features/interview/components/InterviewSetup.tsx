import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Badge } from "../../../components/ui/Badge";

import {
  CheckCircle,
  Clock,
  CreditCard,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
  Eye,
  X,
} from "lucide-react";
import {
  TestType,
  TEST_TYPES,
  TEST_LEVELS,
  LANGUAGE_OPTIONS,
  DURATION_OPTIONS,
} from "../types";

interface InterviewSetupProps {
  interviewData: any;
  questions: any[];
  onUpdateData: (updates: any) => void;
  onGenerateQuestions: () => void;
  onUpdateQuestions: (questions: any[]) => void;
  onContinueToNextStep: () => void;
  generatingQuestions: boolean;
  balance: number;
}

export const InterviewSetup: React.FC<InterviewSetupProps> = ({
  interviewData,
  questions,
  onUpdateData,
  onGenerateQuestions,
  onUpdateQuestions,
  onContinueToNextStep,
  generatingQuestions,
  balance,
}) => {
  const [selectedDuration, setSelectedDuration] = useState(
    interviewData.durationMinutes || 30
  );
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);

  const handleDurationChange = (duration: number) => {
    setSelectedDuration(duration);
    onUpdateData({ durationMinutes: duration });
  };

  const handleTestTypeToggle = (testType: TestType) => {
    const currentSelectedTypes = interviewData.selectedTestTypes || [];
    const isSelected = currentSelectedTypes.some(
      (t: TestType) => t.id === testType.id
    );

    if (isSelected) {
      // Remove test type
      const newSelectedTypes = currentSelectedTypes.filter(
        (t: TestType) => t.id !== testType.id
      );
      onUpdateData({ selectedTestTypes: newSelectedTypes });
    } else {
      // Check if we can add more test types
      const durationOption = DURATION_OPTIONS.find(
        (opt) => opt.value === selectedDuration
      );
      if (
        durationOption &&
        currentSelectedTypes.length >= durationOption.maxTestTypes
      ) {
        return; // Will be handled by the hook
      }

      const newSelectedTypes = [...currentSelectedTypes, testType];
      onUpdateData({ selectedTestTypes: newSelectedTypes });
    }
  };

  const toggleCardExpansion = (testTypeId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(testTypeId)) {
      newExpanded.delete(testTypeId);
    } else {
      newExpanded.add(testTypeId);
    }
    setExpandedCards(newExpanded);
  };

  const getDurationOption = (duration: number) => {
    return DURATION_OPTIONS.find((opt) => opt.value === duration);
  };

  const getTestTypeForDuration = (testType: TestType, duration: number) => {
    return (
      testType.durationOptions.find((opt) => opt.duration === duration) ||
      testType.durationOptions[0]
    );
  };

  const canGenerateQuestions = () => {
    return (
      interviewData.jobTitle?.trim() !== "" &&
      (interviewData.selectedTestTypes?.length || 0) > 0 &&
      balance >= interviewData.creditsUsed
    );
  };

  const durationOption = getDurationOption(selectedDuration);
  const selectedTestTypes = interviewData.selectedTestTypes || [];

  return (
    <div className="space-y-8">
      {/* Job Information */}
      <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            معلومات الوظيفة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              عنوان الوظيفة *
            </label>
            <Input
              value={interviewData.jobTitle || ""}
              onChange={(e) => onUpdateData({ jobTitle: e.target.value })}
              placeholder="مثال: مطور برمجيات، مدير مبيعات..."
              className="w-full h-12 text-lg border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              وصف الوظيفة
            </label>
            <Textarea
              value={interviewData.jobDescription || ""}
              onChange={(e) => onUpdateData({ jobDescription: e.target.value })}
              placeholder="وصف مفصل للوظيفة والمتطلبات..."
              rows={4}
              className="w-full border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                مستوى الاختبار
              </label>
              <select
                value={interviewData.testLevel || "intermediate"}
                onChange={(e) => onUpdateData({ testLevel: e.target.value })}
                className="w-full h-12 px-3 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
              >
                {TEST_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                مدة المقابلة
              </label>
              <select
                value={selectedDuration.toString()}
                onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                className="w-full h-12 px-3 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
              >
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value.toString()}>
                    {option.label} - {option.questionCount} سؤال
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Types Selection */}
      <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            أنواع الاختبارات
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>اختر نوع واحد أو أكثر من الاختبارات</span>
            </div>
            <Badge variant="outline" className="bg-white dark:bg-gray-800">
              الحد الأقصى: {durationOption?.maxTestTypes || 3} نوع
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEST_TYPES.map((testType) => {
              const isSelected = selectedTestTypes.some(
                (t: TestType) => t.id === testType.id
              );
              const isExpanded = expandedCards.has(testType.id);
              const durationOption = getDurationOption(selectedDuration);
              const testTypeOption = getTestTypeForDuration(
                testType,
                selectedDuration
              );
              const canSelect =
                !durationOption ||
                selectedTestTypes.length < durationOption.maxTestTypes ||
                isSelected;

              return (
                <Card
                  key={testType.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
                    isSelected
                      ? "ring-2 ring-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800"
                      : canSelect
                      ? "hover:ring-2 hover:ring-purple-300 border-gray-200 dark:border-gray-700"
                      : "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700"
                  }`}
                  onClick={() => canSelect && handleTestTypeToggle(testType)}
                >
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">{testType.icon}</div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-purple-600" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCardExpansion(testType.id);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Title and Description */}
                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">
                      {testType.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                      {testType.description}
                    </p>

                    {/* Duration-specific details */}
                    {testTypeOption && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            للـ {selectedDuration} دقيقة:
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            {testTypeOption.questionCount} سؤال
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />~
                            {Math.round(
                              selectedDuration / testTypeOption.questionCount
                            )}{" "}
                            د/سؤال
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {testTypeOption.credits} كريدت
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Benefits - Show more when expanded */}
                    <div
                      className={`transition-all duration-300 ${
                        isExpanded
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0 overflow-hidden"
                      }`}
                    >
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                          الفوائد:
                        </h4>
                        <div className="space-y-2">
                          {testType.benefits.map((benefit, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 text-sm"
                            >
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-gray-600 dark:text-gray-400">
                                {benefit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Language dropdown for language proficiency test */}
                      {testType.id === "language" && isSelected && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                            اختر اللغة
                          </label>
                          <select
                            value={interviewData.languageProficiency || ""}
                            onChange={(e) =>
                              onUpdateData({
                                languageProficiency: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-md focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                          >
                            <option value="">اختر اللغة</option>
                            {LANGUAGE_OPTIONS.map((lang) => (
                              <option key={lang.value} value={lang.value}>
                                {lang.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="mt-4 pt-3 border-t border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">مُحدد</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary and Action */}
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
                {selectedTestTypes.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                نوع اختبار
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {durationOption?.questionCount || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي الأسئلة
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {interviewData.creditsUsed || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                الكريدت المطلوب
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={onGenerateQuestions}
              disabled={!canGenerateQuestions() || generatingQuestions}
              size="lg"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold h-12"
            >
              {generatingQuestions ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  جاري إنشاء الأسئلة...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  إنشاء الأسئلة ({interviewData.creditsUsed || 0} كريدت)
                </>
              )}
            </Button>

            {questions.length > 0 && (
              <Button
                onClick={onContinueToNextStep}
                size="lg"
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold h-12"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                المتابعة للخطوة التالية
              </Button>
            )}
          </div>

          {/* Credit balance warning */}
          {balance < (interviewData.creditsUsed || 0) && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">رصيد الكريدت غير كافي</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                رصيدك الحالي: {balance} كريدت | المطلوب:{" "}
                {interviewData.creditsUsed || 0} كريدت
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Questions Display */}
      {questions.length > 0 && (
        <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              الأسئلة المُنشأة ({questions.length} سؤال)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                تم إنشاء {questions.length} سؤال بنجاح. يمكنك معاينة الأسئلة قبل
                المتابعة.
              </p>
              <Button
                onClick={() => setShowQuestionsModal(true)}
                variant="outline"
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0"
              >
                <Eye className="h-5 w-5 mr-2" />
                معاينة الأسئلة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
};
