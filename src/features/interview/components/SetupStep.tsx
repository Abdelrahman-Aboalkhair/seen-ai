import React from "react";
import { Brain, Video } from "lucide-react";
import {
  InterviewData,
  INTERVIEW_TYPES,
  INTERVIEW_MODES,
  DURATION_OPTIONS,
} from "../types";

interface SetupStepProps {
  interviewData: InterviewData;
  loading: boolean;
  onUpdateData: (updates: Partial<InterviewData>) => void;
  onCreateInterview: () => void;
}

export const SetupStep: React.FC<SetupStepProps> = ({
  interviewData,
  loading,
  onUpdateData,
  onCreateInterview,
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
          <Brain className="h-8 w-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          مرحباً بك في نظام المقابلات الذكي
        </h2>
        <p className="text-gray-400">
          سنرشدك خطوة بخطوة لإعداد مقابلة احترافية. يرجى ملء المعلومات الأساسية
          أدناه للبدء
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            المسمى الوظيفي *
          </label>
          <input
            type="text"
            value={interviewData.jobTitle}
            onChange={(e) => onUpdateData({ jobTitle: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="مطور واجهات أمامية"
          />
          <p className="text-sm text-gray-500 mt-1">مطلوب للمتابعة</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            وصف الوظيفة
          </label>
          <textarea
            value={interviewData.jobDescription}
            onChange={(e) => onUpdateData({ jobDescription: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="... وصف مفصل للوظيفة والمتطلبات"
          />
          <p className="text-sm text-gray-500 mt-1">
            اختياري - يساعد في إنشاء أسئلة أفضل
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              نوع المقابلة
            </label>
            <select
              value={interviewData.interviewType}
              onChange={(e) => onUpdateData({ interviewType: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {INTERVIEW_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              المدة (دقائق)
            </label>
            <select
              value={interviewData.durationMinutes}
              onChange={(e) =>
                onUpdateData({ durationMinutes: parseInt(e.target.value) })
              }
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              نمط المقابلة
            </label>
            <select
              value={interviewData.interviewMode}
              onChange={(e) => onUpdateData({ interviewMode: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {INTERVIEW_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              تحليل سلوك المرشح مع طرح الأسئلة
            </p>
          </div>
        </div>

        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-green-400 font-medium">
                  مولد الأسئلة الذكي
                </h3>
                <p className="text-green-300 text-sm">
                  إنشاء أسئلة ذكية بناءً على الوظيفة
                </p>
              </div>
            </div>
            <button
              onClick={onCreateInterview}
              disabled={loading || !interviewData.jobTitle.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {loading ? "جاري الإنشاء..." : "إنشاء أسئلة"}
            </button>
          </div>
          {!interviewData.jobTitle.trim() && (
            <p className="text-red-400 text-sm mt-2">
              يرجى إدخال المسمى الوظيفي أولاً
            </p>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={onCreateInterview}
            disabled={loading || !interviewData.jobTitle.trim()}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center mx-auto"
          >
            <Video className="h-5 w-5 mr-2" />
            {loading ? "جاري الإنشاء..." : "بدء المقابلة"}
          </button>
        </div>
      </div>
    </div>
  );
};
