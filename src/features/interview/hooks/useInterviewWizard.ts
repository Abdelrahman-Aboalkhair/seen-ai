import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import {
  InterviewData,
  TestType,
  DurationOption,
  Question,
  Candidate,
  TEST_TYPES,
  DURATION_OPTIONS,
} from "../types";
import { useCreditBalance } from "../../../hooks/useCreditBalance";
import toast from "react-hot-toast";

export const useInterviewWizard = () => {
  const [loading, setLoading] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const { balance, deductCredits } = useCreditBalance();

  const [interviewData, setInterviewData] = useState<InterviewData>({
    jobTitle: "",
    jobDescription: "",
    requiredSkills: [],
    testLevel: "intermediate",
    selectedTestTypes: [],
    languageProficiency: undefined,
    durationMinutes: 30,
    totalQuestions: 0,
    creditsUsed: 0,
    status: "pending",
    currentStep: 1,
  });

  // Calculate total questions and credits based on selected test types and their plans
  const calculateInterviewDetails = useCallback((selectedTypes: TestType[]) => {
    let totalQuestions = 0;
    let creditsUsed = 0;

    selectedTypes.forEach((testType) => {
      if (testType.selectedPlan) {
        totalQuestions += testType.selectedPlan.questionCount;
        creditsUsed += testType.selectedPlan.credits;
      } else {
        // Fallback to default plan if none selected
        const defaultPlan = testType.durationOptions[0];
        totalQuestions += defaultPlan.questionCount;
        creditsUsed += defaultPlan.credits;
      }
    });

    return { totalQuestions, creditsUsed };
  }, []);

  // Update interview data
  const updateInterviewData = useCallback(
    (updates: Partial<InterviewData>) => {
      setInterviewData((prev) => {
        const updated = { ...prev, ...updates };

        // Recalculate questions and credits if test types changed
        if (updates.selectedTestTypes) {
          const { totalQuestions, creditsUsed } = calculateInterviewDetails(
            updates.selectedTestTypes
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
    (testType: TestType, selectedPlan?: DurationOption) => {
      setInterviewData((prev) => {
        const isSelected = prev.selectedTestTypes.some(
          (t) => t.id === testType.id
        );
        let newSelectedTypes: TestType[];

        if (isSelected) {
          if (selectedPlan) {
            // Update the plan for existing test type
            newSelectedTypes = prev.selectedTestTypes.map((t) =>
              t.id === testType.id ? { ...t, selectedPlan } : t
            );
          } else {
            // Remove test type
            newSelectedTypes = prev.selectedTestTypes.filter(
              (t) => t.id !== testType.id
            );
          }
        } else {
          // Add new test type with selected plan
          if (!selectedPlan) {
            // If no plan selected, use the first available plan
            selectedPlan = testType.durationOptions[0];
          }

          const testTypeWithPlan = { ...testType, selectedPlan };
          newSelectedTypes = [...prev.selectedTestTypes, testTypeWithPlan];
        }

        const { totalQuestions, creditsUsed } =
          calculateInterviewDetails(newSelectedTypes);

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
        const selectedPlan =
          testType.selectedPlan || testType.durationOptions[0];
        const questionsPerType = selectedPlan.questionCount;

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
              durationMinutes: selectedPlan.duration,
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
              questionDurationSeconds: Math.round(
                (selectedPlan.duration * 60) / questionsPerType
              ), // Calculate based on plan duration
              questionOrder: questionOrder + index,
              isAiGenerated: true,
              options: q.options || [],
              correctAnswer: q.correctAnswer || "",
              questionType: q.questionType || "multiple_choice",
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

      // Extract candidates from the results field with deduplication
      const candidateMap = new Map<string, Candidate>();

      data.forEach((search) => {
        if (search.results && Array.isArray(search.results)) {
          search.results.forEach((candidate: any, index: number) => {
            const email = candidate.email || "";
            const name =
              candidate.full_name || candidate.name || "مرشح غير محدد";

            // Use email as unique identifier to prevent duplicates
            if (email && !candidateMap.has(email)) {
              candidateMap.set(email, {
                candidateId: `${search.id}_${index}`, // Create unique ID
                name: name,
                email: email,
                resumeUrl: candidate.resume_url || candidate.resumeUrl || null,
                status: "pending",
              });
            }
          });
        }
      });

      // Convert map to array
      const allCandidates = Array.from(candidateMap.values());

      // Add test candidate for development/testing (only if not already present)
      const testCandidateEmail = "abdelrahman.aboalkhair1@gmail.com";
      if (!candidateMap.has(testCandidateEmail)) {
        allCandidates.unshift({
          candidateId: "00000000-0000-0000-0000-000000000001", // Use a valid UUID format
          name: "Abdelrahman Aboalkhair (Test)",
          email: testCandidateEmail,
          resumeUrl: null,
          status: "pending",
        });
      }

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
        question_options: q.options || [],
        correct_answer: q.correctAnswer || "",
        question_type: q.questionType || "multiple_choice",
      }));

      const { error: questionsError } = await supabase
        .from("interview_questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      updateInterviewData({
        id: interview.id,
        status: "questions_ready",
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
          // All candidates are inserted the same way since interview_candidates table doesn't have candidate_id
          return {
            interview_id: interviewData.id,
            name: candidate.name,
            email: candidate.email,
            resume_url: candidate.resumeUrl,
            status: "pending",
          };
        });

        const { error } = await supabase
          .from("interview_candidates")
          .insert(candidatesToInsert);

        if (error) throw error;

        updateInterviewData({
          status: "candidates_added",
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
      return false;
    }

    setLoading(true);
    try {
      // Get interview candidates
      const { data: interviewCandidates, error: fetchError } = await supabase
        .from("interview_candidates")
        .select("*")
        .eq("interview_id", interviewData.id);

      if (fetchError) throw fetchError;

      if (!interviewCandidates || interviewCandidates.length === 0) {
        toast.error("لا توجد مرشحين لإرسال الدعوات إليهم");
        return false;
      }

      // Generate session for each candidate
      for (const candidate of interviewCandidates) {
        // Create interview session using database function for session token
        console.log("Creating session for candidate:", candidate.email);
        console.log("Interview ID:", interviewData.id);

        // Generate session token using database function
        const { data: tokenData, error: tokenError } = await supabase.rpc(
          "generate_session_token"
        );

        if (tokenError) throw tokenError;

        const sessionToken = tokenData;
        console.log("Generated session token:", sessionToken);

        const { data: session, error: sessionError } = await supabase
          .from("interview_sessions")
          .insert({
            interview_id: interviewData.id,
            candidate_id: candidate.id,
            session_token: sessionToken,
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
              interviewLink: `${
                window.location.origin
              }/interview/${encodeURIComponent(session.session_token)}`,
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
      return true;
    } catch (error: any) {
      console.error("Error generating interview links:", error);
      toast.error("فشل في إنشاء روابط المقابلة");
      return false;
    } finally {
      setLoading(false);
    }
  }, [interviewData, updateInterviewData]);

  // Start interview as candidate (for HR to test the interview)
  const startInterviewAsCandidate = useCallback(async () => {
    if (!interviewData.id) {
      toast.error("يرجى إنشاء المقابلة أولاً");
      return;
    }

    setLoading(true);
    try {
      // Create a temporary candidate record for HR testing
      const { data: tempCandidate, error: candidateError } = await supabase
        .from("interview_candidates")
        .insert({
          interview_id: interviewData.id,
          name: "HR Test Candidate",
          email: "hr-test@example.com",
          status: "pending",
        })
        .select()
        .single();

      if (candidateError) throw candidateError;

      // Generate session token for HR to start the interview
      const { data: tokenData, error: tokenError } = await supabase.rpc(
        "generate_session_token"
      );

      if (tokenError) throw tokenError;

      const sessionToken = tokenData;
      console.log("Generated session token for HR:", sessionToken);

      // Create a temporary session for HR
      const { data: session, error: sessionError } = await supabase
        .from("interview_sessions")
        .insert({
          interview_id: interviewData.id,
          candidate_id: tempCandidate.id, // Use the temporary candidate ID
          session_token: sessionToken,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours for HR testing
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Open the interview in a new tab
      const baseUrl = window.location.origin;
      const interviewUrl = `${baseUrl}/interview/${encodeURIComponent(
        sessionToken
      )}`;
      window.open(interviewUrl, "_blank");

      toast.success("تم فتح المقابلة في نافذة جديدة");
    } catch (error: any) {
      console.error("Error starting interview as candidate:", error);
      toast.error("فشل في بدء المقابلة");
    } finally {
      setLoading(false);
    }
  }, [interviewData.id]);

  // Update questions
  const updateQuestions = useCallback((updatedQuestions: any[]) => {
    setQuestions(updatedQuestions);
  }, []);

  // Regenerate questions for existing interview
  const regenerateQuestions = useCallback(async () => {
    if (!interviewData.id) {
      toast.error("يرجى إنشاء المقابلة أولاً");
      return;
    }

    setGeneratingQuestions(true);
    try {
      // Generate new questions
      await generateQuestions();

      // Update existing questions in database
      if (questions.length > 0) {
        const questionsToUpdate = questions.map((q) => ({
          id: q.id, // We need the question ID to update
          question_options: q.options || [],
          correct_answer: q.correctAnswer || "",
          question_type: q.questionType || "multiple_choice",
        }));

        // Update each question individually since we need to match by ID
        for (const questionUpdate of questionsToUpdate) {
          if (questionUpdate.id) {
            const { error } = await supabase
              .from("interview_questions")
              .update({
                question_options: questionUpdate.question_options,
                correct_answer: questionUpdate.correct_answer,
                question_type: questionUpdate.question_type,
              })
              .eq("id", questionUpdate.id);

            if (error) {
              console.error("Error updating question:", error);
            }
          }
        }

        toast.success("تم إعادة إنشاء الأسئلة بنجاح");
      }
    } catch (error: any) {
      console.error("Error regenerating questions:", error);
      toast.error("فشل في إعادة إنشاء الأسئلة");
    } finally {
      setGeneratingQuestions(false);
    }
  }, [interviewData.id, questions, generateQuestions]);

  // Finish interview setup and activate it
  const finishInterviewSetup = useCallback(async () => {
    if (!interviewData.id) {
      toast.error("يرجى إنشاء المقابلة أولاً");
      return;
    }

    setLoading(true);
    try {
      // Update interview status to active
      const { error } = await supabase
        .from("interviews")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", interviewData.id);

      if (error) throw error;

      updateInterviewData({ status: "active" });
      toast.success("تم تفعيل المقابلة بنجاح!");
    } catch (error: any) {
      console.error("Error finishing interview setup:", error);
      toast.error("فشل في تفعيل المقابلة");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [interviewData.id, updateInterviewData]);

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
      status: "pending",
      currentStep: 1,
    });
    setQuestions([]);
    setCandidates([]);
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
    regenerateQuestions,
    fetchCandidates,
    createInterview,
    addCandidatesToInterview,
    generateInterviewLinks,
    startInterviewAsCandidate,
    finishInterviewSetup,
    resetInterview,
    TEST_TYPES,
    DURATION_OPTIONS,
  };
};
