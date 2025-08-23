import React from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { TestType, DurationOption, LANGUAGE_OPTIONS } from "../types";

interface TestTypeCardProps {
  testType: TestType;
  isSelected: boolean;
  isExpanded: boolean;
  canSelect: boolean;
  selectedTestTypes: TestType[];
  onToggleTestType: (testType: TestType, selectedPlan?: DurationOption) => void;
  onToggleExpansion: (testTypeId: string) => void;
  onUpdateData: (updates: any) => void;
  interviewData: any;
}

export const TestTypeCard: React.FC<TestTypeCardProps> = ({
  testType,
  isSelected,
  isExpanded,
  canSelect,
  selectedTestTypes,
  onToggleTestType,
  onToggleExpansion,
  onUpdateData,
  interviewData,
}) => {
  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
        isSelected
          ? "ring-2 ring-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800"
          : canSelect
          ? "hover:ring-2 hover:ring-purple-300 border-gray-200 dark:border-gray-700"
          : "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700"
      }`}
      onClick={() => canSelect && onToggleTestType(testType)}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {isSelected && <CheckCircle className="h-5 w-5 text-purple-600" />}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpansion(testType.id);
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

        {/* Plan Selection - Show when test type is selected */}
        {isSelected && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4 mb-4 border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-sm text-purple-700 dark:text-purple-300 mb-3">
              اختر الخطة المناسبة:
            </h4>
            <div className="space-y-2">
              {testType.durationOptions.map((option) => {
                const isSelectedPlan =
                  selectedTestTypes.find((t: TestType) => t.id === testType.id)
                    ?.selectedPlan?.duration === option.duration;

                return (
                  <label
                    key={option.duration}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelectedPlan
                        ? "border-purple-500 bg-purple-100 dark:bg-purple-900/30"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const selectedPlan = {
                        duration: option.duration,
                        questionCount: option.questionCount,
                        credits: option.credits,
                        maxTestTypes: option.maxTestTypes,
                      };
                      onToggleTestType(testType, selectedPlan);
                    }}
                  >
                    <input
                      type="radio"
                      name={`plan-${testType.id}`}
                      value={option.duration}
                      checked={isSelectedPlan}
                      onChange={() => {}} // Empty onChange since we handle it in label onClick
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelectedPlan
                            ? "border-purple-500 bg-purple-500"
                            : "border-gray-400"
                        }`}
                      >
                        {isSelectedPlan && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                        <span className="font-medium">
                          {option.questionCount} سؤال
                        </span>
                        <span className="text-gray-500">•</span>
                        <span>{option.duration} دقيقة</span>
                      </div>
                    </div>
                    <div className="font-semibold text-purple-600 dark:text-purple-400">
                      {option.credits} كريدت
                    </div>
                  </label>
                );
              })}
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
                <div key={index} className="flex items-start gap-2 text-sm">
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
};
