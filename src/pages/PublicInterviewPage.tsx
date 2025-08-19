import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface InterviewQuestion {
  id: string;
  question_text: string;
  question_type: string;
  order_index: number;
}

interface Interview {
  id: string;
  job_title: string;
  job_description: string;
  interview_type: string;
  duration_minutes: number;
  status: string;
}

export const PublicInterviewPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (interviewId) {
      fetchInterviewData();
    }
  }, [interviewId]);

  useEffect(() => {
    if (interview && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [interview, timeLeft]);

  const fetchInterviewData = async () => {
    try {
      setLoading(true);

      // Fetch interview details
      const { data: interviewData, error: interviewError } = await supabase
        .from("interviews")
        .select("*")
        .eq("id", interviewId)
        .single();

      if (interviewError) throw interviewError;

      setInterview(interviewData);
      setTimeLeft(interviewData.duration_minutes * 60);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("interview_questions")
        .select("*")
        .eq("interview_id", interviewId)
        .order("order_index");

      if (questionsError) throw questionsError;

      setQuestions(questionsData || []);
    } catch (error: any) {
      console.error("Error fetching interview data:", error);
      toast.error("فشل في تحميل بيانات المقابلة");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Save answers to database
      const { error } = await supabase.functions.invoke(
        "save-interview-answers",
        {
          body: {
            interviewId,
            answers,
          },
        }
      );

      if (error) throw error;

      setCompleted(true);
      toast.success("تم إرسال إجاباتك بنجاح!");
    } catch (error: any) {
      console.error("Error submitting answers:", error);
      toast.error("فشل في إرسال الإجابات");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">جاري تحميل المقابلة...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            المقابلة غير موجودة
          </h2>
          <p className="text-gray-400">الرابط غير صحيح أو تم حذف المقابلة</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            تم إكمال المقابلة بنجاح! 🎉
          </h2>
          <p className="text-gray-400 mb-4">
            شكراً لك على المشاركة في مقابلة {interview.job_title}
          </p>
          <p className="text-gray-500 text-sm">
            سيتم التواصل معك قريباً بشأن النتائج
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">
              {interview.job_title}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-yellow-400">
                <Clock className="h-5 w-5 mr-2" />
                <span className="font-mono text-lg">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="text-gray-400">
                السؤال {currentQuestionIndex + 1} من {questions.length}
              </div>
            </div>
          </div>

          {interview.job_description && (
            <p className="text-gray-300 text-sm">{interview.job_description}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>التقدم</span>
            <span>
              {Math.round(
                ((currentQuestionIndex + 1) / questions.length) * 100
              )}
              %
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((currentQuestionIndex + 1) / questions.length) * 100
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question */}
        {currentQuestion && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                السؤال {currentQuestionIndex + 1}
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                {currentQuestion.question_text}
              </p>
            </div>

            <div className="mb-8">
              <label className="block text-gray-400 text-sm mb-3">
                إجابتك:
              </label>
              <textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, e.target.value)
                }
                placeholder="اكتب إجابتك هنا..."
                className="w-full h-32 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                السابق
              </button>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      جاري الإرسال...
                    </>
                  ) : (
                    "إرسال الإجابات"
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  التالي
                </button>
              )}
            </div>
          </div>
        )}

        {/* Time Warning */}
        {timeLeft <= 300 && timeLeft > 0 && (
          <div className="mt-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center text-red-400">
              <Clock className="h-5 w-5 mr-2" />
              <span>تحذير: الوقت المتبقي {formatTime(timeLeft)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
