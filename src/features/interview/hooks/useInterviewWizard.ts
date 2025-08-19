import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import {
  InterviewData,
  TestType,
  Question,
  Candidate,
  TEST_TYPES,
  DURATION_OPTIONS,
} from "../types";
import { useCreditBalance } from "../../../hooks/useCreditBalance";
import toast from "react-hot-toast";

const STORAGE_KEY = "interview_wizard_data";

export const useInterviewWizard = () => {
  const [loading, setLoading] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const { balance, deductCredits } = useCreditBalance();

  const [interviewData, setInterviewData] = useState<InterviewData>(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error("Failed to parse saved interview data:", error);
      }
    }

    return {
      jobTitle: "",
      jobDescription: "",
      requiredSkills: [],
      testLevel: "intermediate",
      selectedTestTypes: [],
      languageProficiency: undefined,
      durationMinutes: 30,
      totalQuestions: 0,
      creditsUsed: 0,
      status: "setup",
      currentStep: 1,
    };
  });

  // Save to localStorage whenever interviewData changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interviewData));
  }, [interviewData]);

  // Calculate total questions and credits based on selected test types and duration
  const calculateInterviewDetails = useCallback(
    (selectedTypes: TestType[], duration: number) => {
      const durationOption = DURATION_OPTIONS.find(
        (opt) => opt.value === duration
      );
      if (!durationOption) return { totalQuestions: 0, creditsUsed: 0 };

      const maxTestTypes = durationOption.maxTestTypes;
      const actualTestTypes = selectedTypes.slice(0, maxTestTypes);

      let totalQuestions = 0;
      let creditsUsed = 0;

      actualTestTypes.forEach((testType) => {
        const questionsPerType = Math.floor(
          durationOption.questionCount / actualTestTypes.length
        );
        totalQuestions += questionsPerType;
        creditsUsed += questionsPerType * testType.creditsPerQuestion;
      });

      return { totalQuestions, creditsUsed };
    },
    []
  );

  // Update interview data
  const updateInterviewData = useCallback(
    (updates: Partial<InterviewData>) => {
      setInterviewData((prev) => {
        const updated = { ...prev, ...updates };

        // Recalculate questions and credits if test types or duration changed
        if (updates.selectedTestTypes || updates.durationMinutes) {
          const { totalQuestions, creditsUsed } = calculateInterviewDetails(
            updates.selectedTestTypes || prev.selectedTestTypes,
            updates.durationMinutes || prev.durationMinutes
          );
          updated.totalQuestions = totalQuestions;
          updated.creditsUsed = creditsUsed;
        }

        return updated;
      });
    },
    [calculateInterviewDetails]
  );

  // Toggle test type selection
  const toggleTestType = useCallback(
    (testType: TestType) => {
      setInterviewData((prev) => {
        const isSelected = prev.selectedTestTypes.some(
          (t) => t.id === testType.id
        );
        let newSelectedTypes: TestType[];

        if (isSelected) {
          newSelectedTypes = prev.selectedTestTypes.filter(
            (t) => t.id !== testType.id
          );
        } else {
          // Check if we can add more test types based on duration
          const durationOption = DURATION_OPTIONS.find(
            (opt) => opt.value === prev.durationMinutes
          );
          if (
            durationOption &&
            prev.selectedTestTypes.length >= durationOption.maxTestTypes
          ) {
            toast.error(
              `يمكنك اختيار ${durationOption.maxTestTypes} أنواع اختبار كحد أقصى لمدة ${prev.durationMinutes} دقيقة`
            );
            return prev;
          }
          newSelectedTypes = [...prev.selectedTestTypes, testType];
        }

        const { totalQuestions, creditsUsed } = calculateInterviewDetails(
          newSelectedTypes,
          prev.durationMinutes
        );

        return {
          ...prev,
          selectedTestTypes: newSelectedTypes,
          totalQuestions,
          creditsUsed,
        };
      });
    },
    [calculateInterviewDetails]
  );

  // Generate questions using AI
  const generateQuestions = useCallback(async () => {
    if (interviewData.selectedTestTypes.length === 0) {
      toast.error("يرجى اختيار نوع اختبار واحد على الأقل");
      return;
    }

    if (interviewData.jobTitle.trim() === "") {
      toast.error("يرجى إدخال عنوان الوظيفة");
      return;
    }

    // Check if user has enough credits
    if (balance < interviewData.creditsUsed) {
      toast.error(
        `رصيد الكريدت غير كافي. المطلوب: ${interviewData.creditsUsed}، المتوفر: ${balance}`
      );
      return;
    }

    setGeneratingQuestions(true);

    try {
      // Deduct credits first
      await deductCredits(
        interviewData.creditsUsed,
        `إنشاء أسئلة مقابلة - ${interviewData.jobTitle}`
      );

      // Generate questions for each test type
      const allQuestions: Question[] = [];
      let questionOrder = 1;

      for (const testType of interviewData.selectedTestTypes) {
        const questionsPerType = Math.floor(
          interviewData.totalQuestions / interviewData.selectedTestTypes.length
        );

        const { data, error } = await supabase.functions.invoke(
          "generate-interview-questions",
          {
            body: {
              jobTitle: interviewData.jobTitle,
              jobDescription: interviewData.jobDescription,
              requiredSkills: interviewData.requiredSkills,
              testLevel: interviewData.testLevel,
              testType: testType.name,
              languageProficiency: interviewData.languageProficiency,
              numberOfQuestions: questionsPerType,
              durationMinutes: interviewData.durationMinutes,
            },
          }
        );

        if (error) {
          throw new Error(
            `فشل في إنشاء أسئلة ${testType.label}: ${error.message}`
          );
        }

        if (data?.questions) {
          const testQuestions: Question[] = data.questions.map(
            (q: any, index: number) => ({
              questionText: q.questionText,
              testType: testType.name,
              modelAnswer: q.modelAnswer,
              skillMeasured: q.skillMeasured,
              questionDurationSeconds: 120, // 2 minutes per question
              questionOrder: questionOrder + index,
              isAiGenerated: true,
            })
          );

          allQuestions.push(...testQuestions);
          questionOrder += testQuestions.length;
        }
      }

      setQuestions(allQuestions);
      updateInterviewData({ status: "questions_ready" });
      toast.success(`تم إنشاء ${allQuestions.length} سؤال بنجاح`);
    } catch (error: any) {
      console.error("Error generating questions:", error);
      toast.error(error.message || "فشل في إنشاء الأسئلة");
    } finally {
      setGeneratingQuestions(false);
    }
  }, [interviewData, balance, deductCredits, updateInterviewData]);

  // Fetch candidates from talent_searches
  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("يرجى تسجيل الدخول أولاً");
        return;
      }

      const { data, error } = await supabase
        .from("talent_searches")
        .select("id, results, created_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Extract candidates from the results field
      const allCandidates: Candidate[] = [];
      data.forEach((search) => {
        if (search.results && Array.isArray(search.results)) {
          search.results.forEach((candidate: any, index: number) => {
            allCandidates.push({
              candidateId: `${search.id}_${index}`, // Create unique ID
              name: candidate.full_name || candidate.name || "مرشح غير محدد",
              email: candidate.email || "",
              resumeUrl: candidate.resume_url || candidate.resumeUrl || null,
              status: "pending",
            });
          });
        }
      });

      // Add test candidate for development/testing
      allCandidates.unshift({
        candidateId: "00000000-0000-0000-0000-000000000001", // Use a valid UUID format
        name: "Abdelrahman Aboalkhair (Test)",
        email: "bgbody5@gmail.com",
        resumeUrl: null,
        status: "pending",
      });

      setCandidates(allCandidates);
    } catch (error: any) {
      console.error("Error fetching candidates:", error);
      toast.error("فشل في جلب المرشحين");
    } finally {
      setLoading(false);
    }
  }, []);

  // Create interview in database
  const createInterview = useCallback(async () => {
    if (questions.length === 0) {
      toast.error("يرجى إنشاء الأسئلة أولاً");
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("يرجى تسجيل الدخول أولاً");
        throw new Error("User not authenticated");
      }

      // Create interview record
      const { data: interview, error: interviewError } = await supabase
        .from("interviews")
        .insert({
          user_id: user.id,
          job_title: interviewData.jobTitle,
          job_description: interviewData.jobDescription,
          test_types: interviewData.selectedTestTypes.map((t) => t.name),
          language_proficiency: interviewData.languageProficiency,
          test_level: interviewData.testLevel,
          required_skills: interviewData.requiredSkills,
          duration_minutes: interviewData.durationMinutes,
          credits_used: interviewData.creditsUsed,
          status: "questions_ready",
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // 7 days
        })
        .select()
        .single();

      if (interviewError) throw interviewError;

      // Create questions
      const questionsToInsert = questions.map((q) => ({
        interview_id: interview.id,
        question_text: q.questionText,
        test_type: q.testType,
        model_answer: q.modelAnswer,
        skill_measured: q.skillMeasured,
        question_duration_seconds: q.questionDurationSeconds,
        question_order: q.questionOrder,
        is_ai_generated: q.isAiGenerated,
      }));

      const { error: questionsError } = await supabase
        .from("interview_questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      updateInterviewData({
        id: interview.id,
        status: "questions_ready",
        currentStep: 2,
      });

      toast.success("تم إنشاء المقابلة بنجاح");
      return interview.id;
    } catch (error: any) {
      console.error("Error creating interview:", error);
      toast.error("فشل في إنشاء المقابلة");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [interviewData, questions, updateInterviewData]);

  // Add candidates to interview
  const addCandidatesToInterview = useCallback(
    async (selectedCandidateIds: string[]) => {
      if (!interviewData.id) {
        toast.error("يرجى إنشاء المقابلة أولاً");
        return;
      }

      setLoading(true);
      try {
        const selectedCandidates = candidates.filter((c) =>
          selectedCandidateIds.includes(c.candidateId!)
        );

        const candidatesToInsert = selectedCandidates.map((candidate) => {
          // Handle test candidates differently
          if (
            candidate.candidateId === "00000000-0000-0000-0000-000000000001"
          ) {
            // For test candidates, don't set candidate_id (let it be null)
            return {
              interview_id: interviewData.id,
              name: candidate.name,
              email: candidate.email,
              resume_url: candidate.resumeUrl,
              status: "pending",
            };
          } else {
            // For real candidates, use the candidate_id
            return {
              interview_id: interviewData.id,
              candidate_id: candidate.candidateId,
              name: candidate.name,
              email: candidate.email,
              resume_url: candidate.resumeUrl,
              status: "pending",
            };
          }
        });

        const { error } = await supabase
          .from("interview_candidates")
          .insert(candidatesToInsert);

        if (error) throw error;

        updateInterviewData({
          status: "candidates_added",
          currentStep: 3,
        });

        toast.success(`تم إضافة ${selectedCandidates.length} مرشح بنجاح`);
        return selectedCandidates;
      } catch (error: any) {
        console.error("Error adding candidates:", error);
        toast.error("فشل في إضافة المرشحين");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [interviewData.id, candidates, updateInterviewData]
  );

  // Generate interview links and send emails
  const generateInterviewLinks = useCallback(async () => {
    if (!interviewData.id) {
      toast.error("يرجى إنشاء المقابلة أولاً");
      return;
    }

    setLoading(true);
    try {
      // Get interview candidates
      const { data: interviewCandidates, error: fetchError } = await supabase
        .from("interview_candidates")
        .select("*")
        .eq("interview_id", interviewData.id);

      if (fetchError) throw fetchError;

      // Generate session for each candidate
      for (const candidate of interviewCandidates) {
        // Create interview session
        const { data: session, error: sessionError } = await supabase
          .from("interview_sessions")
          .insert({
            interview_id: interviewData.id,
            candidate_id: candidate.id,
            session_token: btoa(
              Math.random().toString(36) + Date.now().toString(36)
            ),
            expires_at: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(), // 7 days
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        // Send email with interview link
        const { error: emailError } = await supabase.functions.invoke(
          "send-interview-invitation",
          {
            body: {
              candidateEmail: candidate.email,
              candidateName: candidate.name,
              interviewLink: `${window.location.origin}/interview/${session.session_token}`,
              jobTitle: interviewData.jobTitle,
              durationMinutes: interviewData.durationMinutes,
            },
          }
        );

        if (emailError) {
          console.warn(
            `Failed to send email to ${candidate.email}:`,
            emailError
          );
        }
      }

      updateInterviewData({ status: "completed" });
      toast.success("تم إرسال روابط المقابلة بنجاح");
    } catch (error: any) {
      console.error("Error generating interview links:", error);
      toast.error("فشل في إنشاء روابط المقابلة");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [interviewData, updateInterviewData]);

  // Update questions
  const updateQuestions = useCallback((updatedQuestions: any[]) => {
    setQuestions(updatedQuestions);
  }, []);

  // Reset interview data
  const resetInterview = useCallback(() => {
    setInterviewData({
      jobTitle: "",
      jobDescription: "",
      requiredSkills: [],
      testLevel: "intermediate",
      selectedTestTypes: [],
      languageProficiency: undefined,
      durationMinutes: 30,
      totalQuestions: 0,
      creditsUsed: 0,
      status: "setup",
      currentStep: 1,
    });
    setQuestions([]);
    setCandidates([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    interviewData,
    questions,
    candidates,
    loading,
    generatingQuestions,
    balance,
    updateInterviewData,
    toggleTestType,
    generateQuestions,
    updateQuestions,
    fetchCandidates,
    createInterview,
    addCandidatesToInterview,
    generateInterviewLinks,
    resetInterview,
    TEST_TYPES,
    DURATION_OPTIONS,
  };
};
