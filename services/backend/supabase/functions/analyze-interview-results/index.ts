import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API")!;

    // Create Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body
    const bodyData = await req.json();
    const { sessionId } = bodyData;

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    console.log("Analyzing interview results for session:", sessionId);

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions")
      .select(
        `
        *,
        interview_candidates!inner(name, email),
        interviews!inner(job_title, job_description, test_types, test_level, required_skills)
      `
      )
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found");
    }

    // Get questions and answers
    const { data: questions, error: questionsError } = await supabase
      .from("interview_questions")
      .select("*")
      .eq("interview_id", session.interview_id)
      .order("question_order");

    if (questionsError) {
      throw new Error("Failed to fetch questions");
    }

    const { data: answers, error: answersError } = await supabase
      .from("interview_answers")
      .select("*")
      .eq("session_id", sessionId);

    if (answersError) {
      throw new Error("Failed to fetch answers");
    }

    // Group questions by test type
    const questionsByType = questions.reduce((acc, question) => {
      const testType = question.test_type || "general";
      if (!acc[testType]) {
        acc[testType] = [];
      }
      acc[testType].push(question);
      return acc;
    }, {} as Record<string, any[]>);

    // Analyze each test type
    const analysisResults = [];

    for (const [testType, typeQuestions] of Object.entries(questionsByType)) {
      console.log(`Analyzing ${testType} questions...`);

      // Get answers for this test type
      const typeAnswers = answers.filter((answer) =>
        typeQuestions.some((q) => q.id === answer.question_id)
      );

      if (typeAnswers.length === 0) continue;

      // Prepare data for AI analysis
      const analysisData = {
        candidateName: session.interview_candidates.name,
        jobTitle: session.interviews.job_title,
        jobDescription: session.interviews.job_description,
        testType: testType,
        testLevel: session.interviews.test_level,
        requiredSkills: session.interviews.required_skills || [],
        questions: typeQuestions.map((q) => ({
          question: q.question_text,
          modelAnswer: q.model_answer,
          skillMeasured: q.skill_measured,
          candidateAnswer:
            typeAnswers.find((a) => a.question_id === q.id)?.answer_text || "",
        })),
      };

      // Generate AI analysis
      const analysis = await generateAIAnalysis(analysisData, openaiApiKey);

      // Save analysis to database
      const { error: saveError } = await supabase
        .from("interview_analyses")
        .insert({
          session_id: sessionId,
          test_type: testType,
          score: analysis.score,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          analysis_data: analysis.detailedAnalysis,
        });

      if (saveError) {
        console.error("Error saving analysis:", saveError);
      }

      analysisResults.push({
        testType,
        score: analysis.score,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        detailedAnalysis: analysis.detailedAnalysis,
      });
    }

    // Generate overall summary
    const overallAnalysis = await generateOverallAnalysis(
      analysisResults,
      openaiApiKey
    );

    // Save overall analysis
    const { error: overallSaveError } = await supabase
      .from("interview_analyses")
      .insert({
        session_id: sessionId,
        test_type: "overall",
        score: overallAnalysis.overallScore,
        strengths: overallAnalysis.overallStrengths,
        weaknesses: overallAnalysis.overallWeaknesses,
        analysis_data: {
          recommendation: overallAnalysis.recommendation,
          detailedSummary: overallAnalysis.detailedSummary,
          testBreakdown: analysisResults,
        },
      });

    if (overallSaveError) {
      console.error("Error saving overall analysis:", overallSaveError);
    }

    // Also create a record in the interview_results table for compatibility
    const { error: resultSaveError } = await supabase
      .from("interview_results")
      .insert({
        interview_id: session.interview_id,
        candidate_id: session.candidate_id,
        score: overallAnalysis.overallScore,
        feedback: overallAnalysis.detailedSummary,
        completed_at: new Date().toISOString(),
      });

    if (resultSaveError) {
      console.error("Error saving interview result:", resultSaveError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          analysisResults,
          overallAnalysis,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error analyzing interview results:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message || "Failed to analyze interview results",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function generateAIAnalysis(data: any, openaiApiKey: string) {
  const prompt = `
You are an expert HR interviewer analyzing a candidate's responses for a ${
    data.testType
  } test.

Candidate: ${data.candidateName}
Job Title: ${data.jobTitle}
Job Description: ${data.jobDescription}
Test Level: ${data.testLevel}
Required Skills: ${data.requiredSkills.join(", ")}

Analyze the following questions and answers:

${data.questions
  .map(
    (q, i) => `
Question ${i + 1}: ${q.question}
Model Answer: ${q.modelAnswer}
Skill Measured: ${q.skillMeasured}
Candidate Answer: ${q.candidateAnswer}
`
  )
  .join("\n")}

Provide a comprehensive analysis in the following JSON format:
{
  "score": <0-100>,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "detailedAnalysis": {
    "questionAnalysis": [
      {
        "questionNumber": 1,
        "score": <0-100>,
        "strengths": ["strength"],
        "weaknesses": ["weakness"],
        "comments": "detailed comments"
      }
    ],
    "overallComments": "comprehensive analysis of the candidate's performance"
  }
}

Focus on:
- Content quality and relevance
- Skill demonstration
- Communication clarity
- Alignment with job requirements
- Areas for improvement
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert HR interviewer. Provide detailed, professional analysis in JSON format only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const result = await response.json();
  const analysisText = result.choices[0].message.content;

  try {
    // Clean the response text - remove markdown code blocks if present
    let cleanAnalysisText = analysisText.trim();

    // Remove markdown code blocks if present
    if (cleanAnalysisText.startsWith("```json")) {
      cleanAnalysisText = cleanAnalysisText.replace(/^```json\s*/, "");
    }
    if (cleanAnalysisText.startsWith("```")) {
      cleanAnalysisText = cleanAnalysisText.replace(/^```\s*/, "");
    }
    if (cleanAnalysisText.endsWith("```")) {
      cleanAnalysisText = cleanAnalysisText.replace(/\s*```$/, "");
    }

    console.log(
      "🧹 Cleaned analysis text:",
      cleanAnalysisText.substring(0, 200) + "..."
    );

    return JSON.parse(cleanAnalysisText);
  } catch (error) {
    console.error("Failed to parse AI analysis:", analysisText);
    // Fallback analysis
    return {
      score: 70,
      strengths: ["Good effort shown"],
      weaknesses: ["Analysis incomplete"],
      detailedAnalysis: {
        questionAnalysis: [],
        overallComments:
          "Analysis could not be completed due to technical issues.",
      },
    };
  }
}

async function generateOverallAnalysis(
  analysisResults: any[],
  openaiApiKey: string
) {
  const prompt = `
You are an expert HR manager providing an overall assessment of a candidate's interview performance.

Test Results:
${analysisResults
  .map(
    (result) => `
${result.testType}: ${result.score}/100
Strengths: ${result.strengths.join(", ")}
Weaknesses: ${result.weaknesses.join(", ")}
`
  )
  .join("\n")}

Provide an overall assessment in the following JSON format:
{
  "overallScore": <0-100>,
  "overallStrengths": ["strength1", "strength2"],
  "overallWeaknesses": ["weakness1", "weakness2"],
  "recommendation": "Hire" | "Consider" | "Reject",
  "detailedSummary": "comprehensive summary of the candidate's overall performance"
}

Consider:
- Overall performance across all tests
- Consistency in responses
- Alignment with job requirements
- Potential for growth and development
- Cultural fit indicators
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert HR manager. Provide detailed, professional analysis in JSON format only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const result = await response.json();
  const analysisText = result.choices[0].message.content;

  try {
    // Clean the response text - remove markdown code blocks if present
    let cleanAnalysisText = analysisText.trim();

    // Remove markdown code blocks if present
    if (cleanAnalysisText.startsWith("```json")) {
      cleanAnalysisText = cleanAnalysisText.replace(/^```json\s*/, "");
    }
    if (cleanAnalysisText.startsWith("```")) {
      cleanAnalysisText = cleanAnalysisText.replace(/^```\s*/, "");
    }
    if (cleanAnalysisText.endsWith("```")) {
      cleanAnalysisText = cleanAnalysisText.replace(/\s*```$/, "");
    }

    console.log(
      "🧹 Cleaned overall analysis text:",
      cleanAnalysisText.substring(0, 200) + "..."
    );

    return JSON.parse(cleanAnalysisText);
  } catch (error) {
    console.error("Failed to parse overall analysis:", analysisText);
    // Fallback analysis
    return {
      overallScore: 70,
      overallStrengths: ["Good overall performance"],
      overallWeaknesses: ["Analysis incomplete"],
      recommendation: "Consider",
      detailedSummary:
        "Overall analysis could not be completed due to technical issues.",
    };
  }
}
