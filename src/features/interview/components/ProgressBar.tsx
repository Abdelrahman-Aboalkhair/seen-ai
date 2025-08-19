import React from "react";
import { INTERVIEW_STEPS } from "../utils/constants";

interface ProgressBarProps {
  currentStep: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">تقدم المقابلة</h2>
        <span className="text-gray-400">الخطوة {currentStep} من 4</span>
      </div>
      <div className="flex items-center space-x-4">
        {INTERVIEW_STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-blue-500 text-white"
                    : "bg-gray-600 text-gray-400"
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    isActive ? "text-blue-400" : "text-gray-400"
                  }`}
                >
                  {step.title}
                </p>
              </div>
              {index < INTERVIEW_STEPS.length - 1 && (
                <div
                  className={`w-16 h-1 mx-4 ${
                    isCompleted ? "bg-green-500" : "bg-gray-600"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
