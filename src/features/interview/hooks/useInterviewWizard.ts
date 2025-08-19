import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { InterviewData, Question, Candidate } from "../types";
import toast from "react-hot-toast";

export const useInterviewWizard = () => {
  const [loading, setLoading] = useState(false);
  const [interviewData, setInterviewData] = useState<InterviewData>({
    jobTitle: "",
    jobDescription: "",
    numQuestions: 5,
    interviewType: "comprehensive",
    durationMinutes: 30,
    interviewMode: "biometric_with_questions",
    questions: [],
    candidates: [],
    currentStep: 1,
  });

  // Step 1: Create Interview
  const createInterview = async () => {
    if (!interviewData.jobTitle.trim()) {
      toast.error("يرجى إدخال المسمى الوظيفي");
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-interview",
        {
          body: {
            jobTitle: interviewData.jobTitle,
            jobDescription: interviewData.jobDescription,
            numQuestions: interviewData.numQuestions,
            interviewType: interviewData.interviewType,
            durationMinutes: interviewData.durationMinutes,
            interviewMode: interviewData.interviewMode,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        setInterviewData((prev) => ({
          ...prev,
          id: data.data.interview.id,
          currentStep: 2,
        }));
        toast.success("تم إنشاء المقابلة بنجاح");
        return true;
      }
    } catch (error: any) {
      console.error("Error creating interview:", error);
      toast.error(error.message || "حدث خطأ أثناء إنشاء المقابلة");
    } finally {
      setLoading(false);
    }
    return false;
  };

  // Step 2: Generate Questions
  const generateQuestions = async () => {
    if (!interviewData.id) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-questions",
        {
          body: {
            interviewId: interviewData.id,
            numQuestions: interviewData.numQuestions,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        setInterviewData((prev) => ({
          ...prev,
          questions: data.data.questions,
          currentStep: 3,
        }));
        toast.success(`تم إنشاء ${data.data.count} سؤال بنجاح`);
        return true;
      }
    } catch (error: any) {
      console.error("Error generating questions:", error);
      toast.error(error.message || "حدث خطأ أثناء إنشاء الأسئلة");
    } finally {
      setLoading(false);
    }
    return false;
  };

  // Add manual question
  const addQuestion = (questionText: string) => {
    if (!questionText.trim()) {
      toast.error("يرجى إدخال نص السؤال");
      return;
    }

    const question: Question = {
      questionText,
      questionType: "general",
      isAiGenerated: false,
      orderIndex: interviewData.questions.length + 1,
    };

    setInterviewData((prev) => ({
      ...prev,
      questions: [...prev.questions, question],
    }));

    toast.success("تم إضافة السؤال بنجاح");
  };

  // Remove question
  const removeQuestion = (index: number) => {
    setInterviewData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
    toast.success("تم حذف السؤال بنجاح");
  };

  // Add candidate
  const addCandidate = (candidate: Candidate) => {
    setInterviewData((prev) => ({
      ...prev,
      candidates: [...prev.candidates, candidate],
    }));
    toast.success("تم إضافة المرشح بنجاح");
  };

  // Remove candidate
  const removeCandidate = (index: number) => {
    setInterviewData((prev) => ({
      ...prev,
      candidates: prev.candidates.filter((_, i) => i !== index),
    }));
    toast.success("تم حذف المرشح بنجاح");
  };

  // Simulate interview
  const simulateInterview = async (candidateIndex: number) => {
    if (!interviewData.id) return false;

    const candidate = interviewData.candidates[candidateIndex];
    if (!candidate.id) {
      toast.error("لا يمكن إجراء المقابلة للمرشح اليدوي");
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "simulate-interview",
        {
          body: {
            interviewId: interviewData.id,
            candidateId: candidate.id,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        // Update candidate status
        setInterviewData((prev) => ({
          ...prev,
          candidates: prev.candidates.map((c, i) =>
            i === candidateIndex ? { ...c, status: "completed" } : c
          ),
        }));

        toast.success(
          `تم إجراء المقابلة بنجاح. النتيجة: ${data.data.score}/100`
        );
        return true;
      }
    } catch (error: any) {
      console.error("Error simulating interview:", error);
      toast.error(error.message || "حدث خطأ أثناء إجراء المقابلة");
    } finally {
      setLoading(false);
    }
    return false;
  };

  // Update interview data
  const updateInterviewData = (updates: Partial<InterviewData>) => {
    setInterviewData((prev) => ({ ...prev, ...updates }));
  };

  // Navigate to step
  const goToStep = (step: number) => {
    setInterviewData((prev) => ({ ...prev, currentStep: step }));
  };

  return {
    interviewData,
    loading,
    createInterview,
    generateQuestions,
    addQuestion,
    removeQuestion,
    addCandidate,
    removeCandidate,
    simulateInterview,
    updateInterviewData,
    goToStep,
  };
};
