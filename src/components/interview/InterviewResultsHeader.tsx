import React from "react";
import { Button } from "../ui/Button";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface InterviewResultsHeaderProps {
  onBack: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const InterviewResultsHeader: React.FC<InterviewResultsHeaderProps> = ({
  onBack,
  onRefresh,
  loading,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="border-slate-600 text-gray-300 hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          العودة للمقابلات
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">نتائج المقابلة</h1>
          <p className="text-gray-400 mt-1">تحليل شامل لنتائج المرشحين</p>
        </div>
      </div>
      <Button
        onClick={onRefresh}
        variant="outline"
        size="sm"
        disabled={loading}
        className="border-slate-600 text-gray-300 hover:bg-slate-700"
      >
        <RefreshCw
          className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
        />
        تحديث
      </Button>
    </div>
  );
};
