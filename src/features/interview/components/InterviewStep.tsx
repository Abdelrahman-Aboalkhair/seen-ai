import React from "react";
import { Video } from "lucide-react";
import { Candidate } from "../types";

interface InterviewStepProps {
  candidates: Candidate[];
  loading: boolean;
  onSimulateInterview: (candidateIndex: number) => void;
  onNewInterview: () => void;
}

export const InterviewStep: React.FC<InterviewStepProps> = ({
  candidates,
  loading,
  onSimulateInterview,
  onNewInterview,
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
          <Video className="h-8 w-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          خطوة 4: إجراء المقابلة
        </h2>
        <p className="text-gray-400">ابدأ المقابلة مع المرشح المحدد</p>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            ابدأ المقابلة الآن
          </h3>
          <p className="text-gray-400 mb-6">
            بعد إعداد المقابلة واختيار المرشح، يمكنك بدء المقابلة من هنا. ستتمكن
            من مراقبة تقدم المقابلة وعرض النتائج مباشرة
          </p>

          <div className="text-center mb-6">
            <Video className="h-16 w-16 text-red-400 mx-auto mb-4" />
          </div>

          <div className="space-y-4">
            {candidates.map((candidate, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-slate-900 border border-slate-600 rounded-lg p-4"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-medium">
                      {candidate.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{candidate.name}</h4>
                    <p className="text-gray-400 text-sm">{candidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      candidate.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : candidate.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {candidate.status === "completed" ? "مكتمل" : "في الانتظار"}
                  </span>
                  {candidate.status === "pending" && candidate.id && (
                    <button
                      onClick={() => onSimulateInterview(index)}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      {loading ? "جاري..." : "بدء المقابلة"}
                    </button>
                  )}
                  {candidate.status === "completed" && (
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                      عرض النتائج
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onNewInterview}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            إنشاء مقابلة جديدة
          </button>
        </div>
      </div>
    </div>
  );
};
