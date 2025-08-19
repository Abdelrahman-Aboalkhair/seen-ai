import React from "react";
import { QuestionCategory, QUESTION_CATEGORIES } from "../types";

interface QuestionCategorySelectorProps {
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  disabled?: boolean;
}

export const QuestionCategorySelector: React.FC<QuestionCategorySelectorProps> = ({
  selectedCategories,
  onCategoryToggle,
  disabled = false,
}) => {
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "border-blue-500 bg-blue-500/10 text-blue-400",
      green: "border-green-500 bg-green-500/10 text-green-400",
      purple: "border-purple-500 bg-purple-500/10 text-purple-400",
      orange: "border-orange-500 bg-orange-500/10 text-orange-400",
      yellow: "border-yellow-500 bg-yellow-500/10 text-yellow-400",
      pink: "border-pink-500 bg-pink-500/10 text-pink-400",
    };
    return colorMap[color] || "border-gray-500 bg-gray-500/10 text-gray-400";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        اختر أنواع الأسئلة
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUESTION_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.value);
          const colorClasses = getColorClasses(category.color);
          
          return (
            <div
              key={category.value}
              className={`relative cursor-pointer transition-all duration-200 ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => !disabled && onCategoryToggle(category.value)}
            >
              <div
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? `${colorClasses} border-opacity-100`
                    : "border-gray-600 bg-slate-800 hover:border-gray-500"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-white mb-1">
                      {category.label}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {category.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-current rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedCategories.length === 0 && (
        <p className="text-yellow-400 text-sm text-center">
          يرجى اختيار نوع واحد على الأقل من الأسئلة
        </p>
      )}
    </div>
  );
};
