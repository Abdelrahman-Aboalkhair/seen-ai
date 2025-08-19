import React, { useState } from "react";
import { MessageSquare, Brain, Plus, Trash2 } from "lucide-react";
import { Question } from "../types";

interface QuestionsStepProps {
  questions: Question[];
  loading: boolean;
  onAddQuestion: (questionText: string) => void;
  onRemoveQuestion: (index: number) => void;
  onGenerateQuestions: () => void;
  onNext: () => void;
}

export const QuestionsStep: React.FC<QuestionsStepProps> = ({
  questions,
  loading,
  onAddQuestion,
  onRemoveQuestion,
  onGenerateQuestions,
  onNext,
}) => {
  const [newQuestion, setNewQuestion] = useState("");

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      onAddQuestion(newQuestion);
      setNewQuestion("");
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
          <MessageSquare className="h-8 w-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          خطوة 3: إدارة الأسئلة
        </h2>
        <p className="text-gray-400">أضف أو اختر الأسئلة للمقابلة</p>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            إدارة أسئلة المقابلة
          </h3>
          <p className="text-gray-400 mb-6">
            أضف أو اختر الأسئلة التي تريد طرحها خلال المقابلة. يمكنك استخدام
            الذكاء الاصطناعي لإنشاء أسئلة ذكية بناءً على الوظيفة
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 text-center">
              <MessageSquare className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <h4 className="text-white font-medium mb-1">أسئلة المقابلة</h4>
              <p className="text-gray-400 text-sm">
                تم اختيار {questions.length} سؤال للمقابلة
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 text-center">
              <Brain className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <h4 className="text-white font-medium mb-1">إنشاء أسئلة ذكية</h4>
              <p className="text-gray-400 text-sm">
                استخدم الذكاء الاصطناعي لإنشاء أسئلة
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 text-center">
              <Plus className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <h4 className="text-white font-medium mb-1">
                إدارة الأسئلة يدوياً
              </h4>
              <p className="text-gray-400 text-sm">أضف أو اختر الأسئلة بنفسك</p>
            </div>
          </div>

          {/* Add Manual Question */}
          <div className="mb-6">
            <h4 className="text-white font-medium mb-3">إضافة سؤال يدوياً</h4>
            <div className="flex gap-3">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="أدخل نص السؤال..."
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddQuestion}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                إضافة
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-3">
            {questions.map((question, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-slate-900 border border-slate-600 rounded-lg p-4"
              >
                <div className="flex items-center">
                  <span className="text-gray-400 text-sm mr-3">
                    {index + 1}.
                  </span>
                  <span className="text-white">{question.questionText}</span>
                  {question.isAiGenerated && (
                    <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      AI
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onRemoveQuestion(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {questions.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">لا توجد أسئلة مختارة</p>
              <p className="text-gray-500 text-sm">
                أضف بعض الأسئلة للمقابلة أو استخدم الذكاء الاصطناعي لإنشاء أسئلة
                ذكية
              </p>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={onGenerateQuestions}
            disabled={loading}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed mr-4"
          >
            <Brain className="h-4 w-4 inline mr-2" />
            إنشاء ذكي
          </button>
          <button
            onClick={onNext}
            disabled={questions.length === 0}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            حفظ والمتابعة
          </button>
        </div>
      </div>
    </div>
  );
};
