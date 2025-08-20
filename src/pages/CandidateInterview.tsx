import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Textarea";
import { Badge } from "../components/ui/Badge";
import { Progress } from "../components/ui/Progress";
import {
  Clock,
  Play,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Timer,
  Brain,
  Target,
  Zap,
  Trophy,
  Sparkles,
  Eye,
  FileText,
  Users,
  Globe,
  Shield,
  Wifi,
  Volume2,
  Calendar,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

interface InterviewSession {
  id: string;
  interview_id: string;
  candidate_id: string;
  session_token: string;
  status: "pending" | "started" | "completed" | "expired";
  started_at?: string;
  completed_at?: string;
  expires_at: string;
}

interface InterviewQuestion {
  id: string;
  question_text: string;
  test_type: string;
  question_duration_seconds: number;
  question_order: number;
  question_options?: Array<{ id: string; text: string }>;
  correct_answer?: string;
  question_type?: string;
}

interface InterviewData {
  job_title: string;
  duration_minutes: number;
  test_types: string[];
}

export const CandidateInterview: React.FC = () => {
  const { sessionToken: encodedSessionToken } = useParams<{
    sessionToken: string;
  }>();
  const navigate = useNavigate();

  // Decode the session token from URL
  const sessionToken = encodedSessionToken
    ? decodeURIComponent(encodedSessionToken)
    : null;

  console.log(
    "CandidateInterview component loaded with sessionToken:",
    sessionToken
  );
  console.log("Encoded sessionToken from URL:", encodedSessionToken);
  console.log("Current URL:", window.location.href);
  console.log("Component is rendering...");

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [interviewData, setInterviewData] = useState<InterviewData | null>(
    null
  );
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInterviewSession = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Loading session with token:", sessionToken);

      // Get session data
      console.log("Querying for session with token:", sessionToken);
      const { data: sessionData, error: sessionError } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("session_token", sessionToken)
        .single();

      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }

      if (!sessionData) {
        setError("Session not found");
        return;
      }

      console.log("Session data:", sessionData);
      console.log(
        "Session interview_id type:",
        typeof sessionData.interview_id
      );
      console.log("Session interview_id value:", sessionData.interview_id);

      // Check if session is expired
      if (new Date(sessionData.expires_at) < new Date()) {
        setError("Interview session has expired");
        return;
      }

      setSession(sessionData);

      // Get interview data
      console.log("Fetching interview with ID:", sessionData.interview_id);
      console.log(
        "Is interview_id a valid UUID?",
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          sessionData.interview_id
        )
      );
      const { data: interviewData, error: interviewError } = await supabase
        .from("interviews")
        .select("job_title, duration_minutes, test_types")
        .eq("id", sessionData.interview_id)
        .single();

      if (interviewError) {
        console.error("Interview error:", interviewError);
        throw interviewError;
      }
      console.log("Interview data:", interviewData);
      setInterviewData(interviewData);

      // Get questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("interview_questions")
        .select(
          "id, question_text, test_type, question_duration_seconds, question_order, question_options, correct_answer, question_type"
        )
        .eq("interview_id", sessionData.interview_id)
        .order("question_order");

      if (questionsError) throw questionsError;
      setQuestions(questionsData);

      // Check if interview is already completed
      if (sessionData.status === "completed") {
        setIsCompleted(true);
      }
    } catch (error: any) {
      console.error("Error loading interview session:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  const startInterview = async () => {
    if (!session) return;

    try {
      // Update session status
      const { error } = await supabase
        .from("interview_sessions")
        .update({
          status: "started",
          started_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      if (error) throw error;

      setSession((prev) =>
        prev
          ? { ...prev, status: "started", started_at: new Date().toISOString() }
          : null
      );
      setIsStarted(true);
      toast.success("تم بدء المقابلة بنجاح");
    } catch (error: any) {
      console.error("Error starting interview:", error);
      toast.error("فشل في بدء المقابلة");
    }
  };

  const saveAnswer = useCallback(
    async (questionId: string, answer: string) => {
      if (!session) return;

      try {
        const { error } = await supabase.from("interview_answers").upsert({
          session_id: session.id,
          question_id: questionId,
          answer_text: answer,
          time_taken_seconds:
            questions[currentQuestionIndex]?.question_duration_seconds -
              timeRemaining || 0,
        });

        if (error) throw error;
      } catch (error: any) {
        console.error("Error saving answer:", error);
      }
    },
    [session, questions, currentQuestionIndex, timeRemaining]
  );

  const completeInterview = useCallback(async () => {
    if (!session) return;

    try {
      // Save final answer
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion) {
        await saveAnswer(currentQuestion.id, answers[currentQuestion.id] || "");
      }

      // Update session status
      const { error } = await supabase
        .from("interview_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      if (error) throw error;

      // Trigger AI analysis
      try {
        console.log("Triggering AI analysis for session:", session.id);
        const { data: analysisData, error: analysisError } =
          await supabase.functions.invoke("analyze-interview-results", {
            body: { sessionId: session.id },
          });

        if (analysisError) {
          console.error("Analysis error:", analysisError);
          toast.error("تم إكمال المقابلة ولكن فشل في تحليل النتائج");
        } else {
          console.log("Analysis completed successfully:", analysisData);
          toast.success("تم إكمال المقابلة وتحليل النتائج بنجاح");
        }
      } catch (analysisError) {
        console.error("Error triggering analysis:", analysisError);
        toast.error("تم إكمال المقابلة ولكن فشل في تحليل النتائج");
      }

      setIsCompleted(true);
    } catch (error: any) {
      console.error("Error completing interview:", error);
      toast.error("فشل في إكمال المقابلة");
    }
  }, [session, questions, currentQuestionIndex, answers, saveAnswer]);

  const handleAnswerChange = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: answer,
      }));
    }
  };

  const handleNextQuestion = useCallback(async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      // Save current answer
      await saveAnswer(currentQuestion.id, answers[currentQuestion.id] || "");
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Interview completed
      await completeInterview();
    }
  }, [questions, currentQuestionIndex, answers, saveAnswer, completeInterview]);

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getCurrentQuestion = () => {
    return questions[currentQuestionIndex];
  };

  useEffect(() => {
    if (sessionToken && sessionToken.trim() !== "") {
      console.log("Loading interview session with token:", sessionToken);
      loadInterviewSession();
    } else {
      console.error("Invalid session token:", sessionToken);
      setError("Invalid interview link");
    }
  }, [sessionToken, loadInterviewSession]);

  useEffect(() => {
    if (isStarted && questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion) {
        setTimeRemaining(currentQuestion.question_duration_seconds);
      }
    }
  }, [isStarted, questions, currentQuestionIndex]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isStarted && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Auto-submit current answer and move to next question
            handleNextQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [isStarted, timeRemaining, handleNextQuestion]);

  // Debug: Always show this first to confirm component is rendering
  console.log("CandidateInterview render state:", {
    loading,
    error,
    session,
    interviewData,
    questions,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            جاري تحميل المقابلة
          </h3>
          <p className="text-gray-400">
            يرجى الانتظار بينما نقوم بإعداد المقابلة الذكية...
          </p>
          <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
            <p className="text-xs text-gray-500">
              Session Token: {sessionToken}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full mb-6">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            خطأ في المقابلة
          </h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            العودة للصفحة الرئيسية
          </Button>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            تم إكمال المقابلة بنجاح! 🎉
          </h3>
          <p className="text-gray-400 mb-6">
            شكراً لك على إكمال المقابلة الذكية. سيتم تحليل إجاباتك باستخدام
            الذكاء الاصطناعي وسنتواصل معك قريباً.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            العودة للصفحة الرئيسية
          </Button>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl p-8 border border-blue-500/20 mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">
                مرحباً بك في المقابلة الذكية
              </h1>
              <p className="text-gray-400 text-lg mb-6">
                مقابلة{" "}
                <span className="text-blue-400 font-semibold">
                  {interviewData?.job_title}
                </span>{" "}
                باستخدام الذكاء الاصطناعي
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {interviewData?.duration_minutes}
                </p>
                <p className="text-gray-400 text-sm">دقيقة</p>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {questions.length}
                </p>
                <p className="text-gray-400 text-sm">سؤال</p>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Timer className="h-6 w-6 text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-white">2</p>
                <p className="text-gray-400 text-sm">دقيقة/سؤال</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-amber-600/10 to-orange-600/10 rounded-2xl p-8 border border-amber-500/20 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">تعليمات مهمة</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Wifi className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-gray-300">
                  تأكد من وجود اتصال إنترنت مستقر
                </span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Volume2 className="h-4 w-4 text-green-400" />
                </div>
                <span className="text-gray-300">
                  احضر في بيئة هادئة ومناسبة
                </span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Timer className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-gray-300">
                  كل سؤال له وقت محدد (2 دقيقة)
                </span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                </div>
                <span className="text-gray-300">
                  لا يمكنك العودة للسؤال السابق
                </span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg md:col-span-2">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Brain className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="text-gray-300">
                  سيتم تحليل إجاباتك باستخدام الذكاء الاصطناعي
                </span>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <Button
              onClick={startInterview}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-12 py-4 text-lg h-auto"
            >
              <Play className="h-6 w-6 mr-3" />
              بدء المقابلة الذكية
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {interviewData?.job_title}
                </h1>
                <p className="text-gray-400">
                  السؤال {currentQuestionIndex + 1} من {questions.length}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-400 font-mono">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-sm text-gray-400">الوقت المتبقي</div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>التقدم</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 p-6 border-b border-slate-600">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-400" />
                </div>
                السؤال الحالي
              </h2>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                {currentQuestion?.test_type}
              </Badge>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-8">
              <p className="text-lg leading-relaxed text-gray-200">
                {currentQuestion?.question_text}
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="block text-sm font-medium mb-3 text-gray-300 flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-500/20 rounded flex items-center justify-center">
                    <Zap className="h-3 w-3 text-green-400" />
                  </div>
                  اختر إجابتك:
                </span>
                <div className="space-y-3">
                  {currentQuestion?.question_options?.map((option: any) => (
                    <label
                      key={option.id}
                      className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        answers[currentQuestion?.id || ""] === option.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-slate-600 bg-slate-700/50 hover:border-slate-500"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion?.id}`}
                        value={option.id}
                        checked={
                          answers[currentQuestion?.id || ""] === option.id
                        }
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          answers[currentQuestion?.id || ""] === option.id
                            ? "border-blue-500 bg-blue-500"
                            : "border-slate-400"
                        }`}
                      >
                        {answers[currentQuestion?.id || ""] === option.id && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white mb-1">
                          {option.id}. {option.text}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <Button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              السؤال السابق
            </Button>

            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">التقدم</div>
              <div className="text-lg font-semibold text-white">
                {currentQuestionIndex + 1} من {questions.length}
              </div>
            </div>

            <Button
              onClick={handleNextQuestion}
              disabled={!answers[currentQuestion?.id || ""]}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex === questions.length - 1 ? (
                <>
                  إنهاء المقابلة
                  <Trophy className="h-4 w-4 mr-2" />
                </>
              ) : (
                <>
                  السؤال التالي
                  <ArrowRight className="h-4 w-4 mr-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
