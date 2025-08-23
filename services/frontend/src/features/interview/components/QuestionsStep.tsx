import React, { useState } from "react";
import {
  MessageSquare,
  Brain,
  Plus,
  Trash2,
  Zap,
  CheckCircle,
} from "lucide-react";
import {
  Question,
  QUESTION_CATEGORIES,
  QUESTION_COUNT_OPTIONS,
} from "../types";
import { QuestionCategorySelector } from "./QuestionCategorySelector";
import { useQuestionGeneration } from "../hooks/useQuestionGeneration";

interface QuestionsStepProps {
  questions: Question[];
  loading: boolean;
  onAddQuestion: (questionText: string) => void;
  onRemoveQuestion: (questionId: string) => void;
  onGenerateQuestions: (questions: Question[]) => void;
  onNext: () => void;
  interviewData: {
    id?: string;
    jobTitle: string;
    jobDescription: string;
    interviewType: string;
  };
}

export const QuestionsStep: React.FC<QuestionsStepProps> = ({
  questions,
  loading,
  onAddQuestion,
  onRemoveQuestion,
  onGenerateQuestions,
  onNext,
  interviewData,
}) => {
  const [newQuestion, setNewQuestion] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [questionsPerCategory, setQuestionsPerCategory] = useState(3);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const { generating, generatingCategory, generateQuestionsForCategories } =
    useQuestionGeneration();

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      onAddQuestion(newQuestion.trim());
      setNewQuestion("");
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleGenerateQuestions = async () => {
    if (selectedCategories.length === 0) {
      return;
    }

    const generatedQuestions = await generateQuestionsForCategories(
      {
        interviewId: interviewData.id!,
        jobTitle: interviewData.jobTitle,
        jobDescription: interviewData.jobDescription,
        numQuestions: questionsPerCategory,
        interviewType: interviewData.interviewType,
      },
      selectedCategories
    );

    if (generatedQuestions.length > 0) {
      onGenerateQuestions(generatedQuestions);
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = QUESTION_CATEGORIES.find((c) => c.value === category);
    return cat?.label || category;
  };

  const getCategoryIcon = (category: string) => {
    const cat = QUESTION_CATEGORIES.find((c) => c.value === category);
    return cat?.icon || "❓";
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
        {/* AI Question Generation */}
        <div className="bg-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            إنشاء أسئلة ذكية
          </h3>
          <p className="text-gray-400 mb-6">
            استخدم الذكاء الاصطناعي لإنشاء أسئلة احترافية بناءً على الوظيفة
          </p>

          {!showCategorySelector ? (
            <div className="text-center">
              <button
                onClick={() => setShowCategorySelector(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 flex items-center mx-auto"
              >
                <Brain className="h-5 w-5 mr-2" />
                إنشاء أسئلة ذكية
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <QuestionCategorySelector
                selectedCategories={selectedCategories}
                onCategoryToggle={handleCategoryToggle}
                disabled={generating}
              />

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    عدد الأسئلة لكل نوع
                  </label>
                  <select
                    value={questionsPerCategory}
                    onChange={(e) =>
                      setQuestionsPerCategory(parseInt(e.target.value))
                    }
                    className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={generating}
                  >
                    {QUESTION_COUNT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCategorySelector(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    disabled={generating}
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleGenerateQuestions}
                    disabled={generating || selectedCategories.length === 0}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center"
                  >
                    {generating ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-pulse" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        إنشاء الأسئلة
                      </>
                    )}
                  </button>
                </div>
              </div>

              {generating && generatingCategory && (
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 text-blue-400 mr-2 animate-pulse" />
                    <span className="text-blue-400">
                      جاري إنشاء أسئلة {getCategoryLabel(generatingCategory)}...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Question Addition */}
        <div className="bg-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            إضافة أسئلة يدوياً
          </h3>
          <div className="flex space-x-3">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddQuestion()}
              placeholder="اكتب سؤالاً جديداً..."
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddQuestion}
              disabled={!newQuestion.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            أسئلة المقابلة ({questions.length})
          </h3>

          {questions.length > 0 ? (
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div
                  key={question.id || index}
                  className="flex items-start justify-between bg-slate-900 border border-slate-600 rounded-lg p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-gray-400 text-sm mr-3">
                        {index + 1}.
                      </span>
                      <span className="text-white">
                        {question.questionText}
                      </span>
                      {question.isAiGenerated && (
                        <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                          {getCategoryIcon(question.category || "general")}{" "}
                          {getCategoryLabel(question.category || "general")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onRemoveQuestion(question.id || index.toString())
                    }
                    className="ml-3 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">لا توجد أسئلة مختارة</p>
              <p className="text-gray-500 text-sm">
                أضف بعض الأسئلة للمقابلة أو استخدم الذكاء الاصطناعي لإنشاء أسئلة
                ذكية
              </p>
            </div>
          )}
        </div>

        {/* Next Button */}
        <div className="text-center">
          <button
            onClick={onNext}
            disabled={questions.length === 0}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center mx-auto"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            التالي
          </button>
          {questions.length === 0 && (
            <p className="text-red-400 text-sm mt-2">
              يرجى إضافة أسئلة للمتابعة
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
