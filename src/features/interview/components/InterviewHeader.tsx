import React from "react";
import { Brain } from "lucide-react";

export const InterviewHeader: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
        <Brain className="h-8 w-8 text-blue-400" />
      </div>
      <h1 className="text-4xl font-bold text-purple-400 mb-2">
        نظام المقابلات الذكي
      </h1>
      <p className="text-gray-400 text-lg">
        منصة متكاملة للمقابلات مع تحليل بيومتري مدعوم بالذكاء الاصطناعي
      </p>
      <button className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
        English
      </button>
    </div>
  );
};
