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
          "id, question_text, test_type, question_duration_seconds, question_order"
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

      setIsCompleted(true);
      toast.success("تم إكمال المقابلة بنجاح");
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل المقابلة...</p>
          <p className="text-sm text-gray-500 mt-2">
            Session Token: {sessionToken}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">خطأ في المقابلة</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate("/")}>
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">تم إكمال المقابلة</h2>
            <p className="text-muted-foreground mb-4">
              شكراً لك على إكمال المقابلة. سنتواصل معك قريباً.
            </p>
            <Button onClick={() => navigate("/")}>
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">
              مرحباً بك في المقابلة
            </CardTitle>
            <p className="text-muted-foreground">{interviewData?.job_title}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="font-bold">
                  {interviewData?.duration_minutes}
                </div>
                <div className="text-sm text-muted-foreground">دقيقة</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="font-bold">{questions.length}</div>
                <div className="text-sm text-muted-foreground">سؤال</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Timer className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <div className="font-bold">2</div>
                <div className="text-sm text-muted-foreground">دقيقة/سؤال</div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">تعليمات مهمة:</h3>
              <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-200">
                <li>• تأكد من وجود اتصال إنترنت مستقر</li>
                <li>• احضر في بيئة هادئة ومناسبة</li>
                <li>• كل سؤال له وقت محدد (2 دقيقة)</li>
                <li>• لا يمكنك العودة للسؤال السابق</li>
                <li>• لا يمكنك إعادة المقابلة بعد البدء</li>
              </ul>
            </div>

            <Button onClick={startInterview} size="lg" className="w-full">
              <Play className="h-4 w-4 mr-2" />
              بدء المقابلة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-semibold">
                  {interviewData?.job_title}
                </h1>
                <p className="text-muted-foreground">
                  السؤال {currentQuestionIndex + 1} من {questions.length}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-muted-foreground">
                  الوقت المتبقي
                </div>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>السؤال الحالي</CardTitle>
              <Badge variant="outline">{currentQuestion?.test_type}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <p className="text-lg leading-relaxed">
                {currentQuestion?.question_text}
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="block text-sm font-medium mb-2">إجابتك:</span>
                <Textarea
                  value={answers[currentQuestion?.id || ""] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="اكتب إجابتك هنا..."
                  rows={6}
                  className="w-full"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                السؤال السابق
              </Button>

              <div className="text-sm text-muted-foreground">
                {currentQuestionIndex + 1} من {questions.length}
              </div>

              <Button
                onClick={handleNextQuestion}
                disabled={!answers[currentQuestion?.id || ""]?.trim()}
              >
                {currentQuestionIndex === questions.length - 1 ? (
                  <>
                    إنهاء المقابلة
                    <CheckCircle className="h-4 w-4 mr-2" />
                  </>
                ) : (
                  <>
                    السؤال التالي
                    <ArrowRight className="h-4 w-4 mr-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
