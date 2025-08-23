import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { QuestionGenerationRequest, Question } from "../types";
import toast from "react-hot-toast";

export const useQuestionGeneration = () => {
  const [generating, setGenerating] = useState(false);
  const [generatingCategory, setGeneratingCategory] = useState<string | null>(
    null
  );

  // Generate questions for a specific category
  const generateQuestions = async (
    request: QuestionGenerationRequest
  ): Promise<Question[]> => {
    setGenerating(true);
    setGeneratingCategory(request.questionType);

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-questions",
        {
          body: {
            interviewId: request.interviewId || "temp",
            questionType: request.questionType,
            numQuestions: request.numQuestions,
            jobTitle: request.jobTitle,
            jobDescription: request.jobDescription,
            interviewType: request.interviewType,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast.success(
          `تم إنشاء ${data.data.questions.length} سؤال ${request.questionType}`
        );
        return data.data.questions;
      } else {
        throw new Error(data?.error?.message || "فشل في إنشاء الأسئلة");
      }
    } catch (error: any) {
      console.error("Error generating questions:", error);
      toast.error(error.message || "حدث خطأ أثناء إنشاء الأسئلة");
      return [];
    } finally {
      setGenerating(false);
      setGeneratingCategory(null);
    }
  };

  // Generate questions for multiple categories
  const generateQuestionsForCategories = async (
    request: Omit<QuestionGenerationRequest, "questionType">,
    categories: string[]
  ): Promise<Question[]> => {
    setGenerating(true);
    const allQuestions: Question[] = [];

    try {
      for (const category of categories) {
        setGeneratingCategory(category);

        const questions = await generateQuestions({
          ...request,
          questionType: category,
        });

        allQuestions.push(...questions);

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      toast.success(`تم إنشاء ${allQuestions.length} سؤال بنجاح`);
      return allQuestions;
    } catch (error: any) {
      console.error("Error generating questions for categories:", error);
      toast.error("حدث خطأ أثناء إنشاء الأسئلة");
      return allQuestions;
    } finally {
      setGenerating(false);
      setGeneratingCategory(null);
    }
  };

  return {
    generating,
    generatingCategory,
    generateQuestions,
    generateQuestionsForCategories,
  };
};
