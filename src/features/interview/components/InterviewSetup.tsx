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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/Select";
import { CheckCircle, Clock, CreditCard, Brain, Sparkles } from "lucide-react";
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
    interviewData.durationMinutes
  );
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

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

  const getDurationOption = (duration: number) => {
    return DURATION_OPTIONS.find((opt) => opt.value === duration);
  };

  const canGenerateQuestions = () => {
    return (
      interviewData.jobTitle.trim() !== "" &&
      (interviewData.selectedTestTypes?.length || 0) > 0 &&
      balance >= interviewData.creditsUsed
    );
  };

  return (
    <div className="space-y-6">
      {/* Job Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            معلومات الوظيفة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              عنوان الوظيفة *
            </label>
            <Input
              value={interviewData.jobTitle}
              onChange={(e) => onUpdateData({ jobTitle: e.target.value })}
              placeholder="مثال: مطور برمجيات، مدير مبيعات..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              وصف الوظيفة
            </label>
            <Textarea
              value={interviewData.jobDescription}
              onChange={(e) => onUpdateData({ jobDescription: e.target.value })}
              placeholder="وصف مفصل للوظيفة والمتطلبات..."
              rows={3}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                مستوى الاختبار
              </label>
              <Select
                value={interviewData.testLevel}
                onValueChange={(value) => onUpdateData({ testLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEST_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">المدة</label>
              <Select
                value={selectedDuration.toString()}
                onValueChange={(value) => handleDurationChange(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label} - {option.questionCount} سؤال
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Types Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            أنواع الاختبارات
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            اختر نوع واحد أو أكثر من الاختبارات. الحد الأقصى:{" "}
            {getDurationOption(selectedDuration)?.maxTestTypes} نوع
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEST_TYPES.map((testType) => {
              const isSelected =
                interviewData.selectedTestTypes?.some(
                  (t: TestType) => t.id === testType.id
                ) || false;
              const durationOption = getDurationOption(selectedDuration);
              const canSelect =
                !durationOption ||
                (interviewData.selectedTestTypes?.length || 0) <
                  durationOption.maxTestTypes ||
                isSelected;

              return (
                <Card
                  key={testType.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? "ring-2 ring-primary bg-primary/5"
                      : canSelect
                      ? "hover:ring-1 hover:ring-primary/50"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => canSelect && handleTestTypeToggle(testType)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-2xl">{testType.icon}</div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>

                    <h3 className="font-semibold mb-2">{testType.label}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {testType.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>~{testType.questionCount} أسئلة</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4" />
                        <span>{testType.creditsPerQuestion} كريدت/سؤال</span>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="mt-3">
                      {testType.benefits.map((benefit, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="mr-1 mb-1 text-xs"
                        >
                          {benefit}
                        </Badge>
                      ))}
                    </div>

                    {/* Language dropdown for language proficiency test */}
                    {testType.id === "language" && isSelected && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium mb-1">
                          اختر اللغة
                        </label>
                        <Select
                          value={interviewData.languageProficiency || ""}
                          onValueChange={(value) =>
                            onUpdateData({ languageProficiency: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر اللغة" />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGE_OPTIONS.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Generated Questions Display */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              الأسئلة المُنشأة ({questions.length} سؤال)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              راجع الأسئلة المُنشأة ويمكنك تعديلها أو حذفها قبل المتابعة
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className="p-4 border border-muted rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        السؤال {index + 1}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {question.testType || "عام"}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updatedQuestions = questions.filter(
                          (_, i) => i !== index
                        );
                        onUpdateQuestions(updatedQuestions);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      حذف
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        نص السؤال:
                      </label>
                      <Textarea
                        value={question.questionText}
                        onChange={(e) => {
                          const updatedQuestions = [...questions];
                          updatedQuestions[index] = {
                            ...updatedQuestions[index],
                            questionText: e.target.value,
                          };
                          onUpdateQuestions(updatedQuestions);
                        }}
                        rows={2}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        الإجابة النموذجية:
                      </label>
                      <Textarea
                        value={question.modelAnswer}
                        onChange={(e) => {
                          const updatedQuestions = [...questions];
                          updatedQuestions[index] = {
                            ...updatedQuestions[index],
                            modelAnswer: e.target.value,
                          };
                          onUpdateQuestions(updatedQuestions);
                        }}
                        rows={2}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        المهارة المُختبرة:
                      </label>
                      <Input
                        value={question.skillMeasured}
                        onChange={(e) => {
                          const updatedQuestions = [...questions];
                          updatedQuestions[index] = {
                            ...updatedQuestions[index],
                            skillMeasured: e.target.value,
                          };
                          onUpdateQuestions(updatedQuestions);
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  تم إنشاء {questions.length} سؤال بنجاح
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => onUpdateQuestions([])}
                    variant="outline"
                    size="sm"
                  >
                    حذف جميع الأسئلة
                  </Button>
                  <Button
                    onClick={onContinueToNextStep}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    متابعة للخطوة التالية
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary and Generate Button */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص المقابلة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {interviewData.totalQuestions}
              </div>
              <div className="text-sm text-muted-foreground">
                إجمالي الأسئلة
              </div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {interviewData.selectedTestTypes?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                أنواع الاختبارات
              </div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {interviewData.creditsUsed}
              </div>
              <div className="text-sm text-muted-foreground">
                الكريدت المطلوب
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
            <div>
              <div className="font-medium">رصيد الكريدت المتوفر</div>
              <div className="text-sm text-muted-foreground">
                {balance} كريدت
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">الرصيد المتبقي</div>
              <div
                className={`text-sm ${
                  balance >= interviewData.creditsUsed
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {balance - interviewData.creditsUsed} كريدت
              </div>
            </div>
          </div>

          <Button
            onClick={onGenerateQuestions}
            disabled={!canGenerateQuestions() || generatingQuestions}
            className="w-full"
            size="lg"
          >
            {generatingQuestions ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                جاري إنشاء الأسئلة...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {questions.length > 0
                  ? "إعادة إنشاء الأسئلة"
                  : "إنشاء الأسئلة"}{" "}
                ({interviewData.creditsUsed} كريدت)
              </>
            )}
          </Button>

          {!canGenerateQuestions() && (
            <div className="text-sm text-muted-foreground text-center">
              {!interviewData.jobTitle.trim() && "يرجى إدخال عنوان الوظيفة"}
              {interviewData.jobTitle.trim() &&
                (interviewData.selectedTestTypes?.length || 0) === 0 &&
                "يرجى اختيار نوع اختبار واحد على الأقل"}
              {interviewData.jobTitle.trim() &&
                (interviewData.selectedTestTypes?.length || 0) > 0 &&
                balance < interviewData.creditsUsed &&
                "رصيد الكريدت غير كافي"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
