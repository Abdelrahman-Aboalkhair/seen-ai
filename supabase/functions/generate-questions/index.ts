Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATCH",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "false",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("=== Generate Questions Started ===");

    // Parse request body
    const requestBody = await req.text();
    let bodyData;
    try {
      bodyData = JSON.parse(requestBody);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error("Invalid JSON in request body");
    }

    // Get environment variables
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const openaiApiKey = Deno.env.get("OPENAI_API");

    if (!serviceRoleKey || !supabaseUrl || !openaiApiKey) {
      throw new Error("Environment settings not available");
    }

    // Extract data from request
    const {
      interviewId,
      numQuestions = 5,
      questionType = "general",
      jobTitle,
      jobDescription,
      interviewType,
    } = bodyData;

    // Validate required fields
    if (!jobTitle) {
      throw new Error("Job title is required");
    }

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    // Verify token and get user
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: authHeader,
        apikey: serviceRoleKey,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Invalid authorization token");
    }

    const userData = await userResponse.json();
    const actualUserId = userData.id;

    // Use passed data or fetch interview details if needed
    let interview = {
      job_title: jobTitle,
      job_description: jobDescription,
      interview_type: interviewType,
    };

    // If we have an interviewId and it's not "temp", try to fetch from database
    if (interviewId && interviewId !== "temp") {
      const interviewResponse = await fetch(
        `${supabaseUrl}/rest/v1/interviews?id=eq.${interviewId}&user_id=eq.${actualUserId}`,
        {
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
        }
      );

      if (interviewResponse.ok) {
        const interviews = await interviewResponse.json();
        if (interviews && interviews.length > 0) {
          interview = interviews[0];
        }
      }
    }

    console.log("Generating questions for interview:", interview);

    // Generate questions using OpenAI based on question type
    const getQuestionTypePrompt = (type: string) => {
      const typePrompts: Record<string, string> = {
        technical: `Generate ${numQuestions} technical interview questions for a ${
          interviewType || interview.interview_type
        } interview for the position of "${jobTitle || interview.job_title}".

Job Description: ${
          jobDescription || interview.job_description || "Not provided"
        }

Requirements:
1. Questions should focus on technical skills and knowledge
2. Include coding problems, system design, and technical concepts
3. Questions should be appropriate for the job level
4. Mix of easy, medium, and hard difficulty questions`,

        behavioral: `Generate ${numQuestions} behavioral interview questions for a ${
          interviewType || interview.interview_type
        } interview for the position of "${jobTitle || interview.job_title}".

Job Description: ${
          jobDescription || interview.job_description || "Not provided"
        }

Requirements:
1. Questions should focus on past behavior and experiences
2. Use STAR method (Situation, Task, Action, Result) format
3. Questions should assess soft skills and work ethic
4. Include questions about teamwork, leadership, and problem-solving`,

        situational: `Generate ${numQuestions} situational interview questions for a ${
          interviewType || interview.interview_type
        } interview for the position of "${jobTitle || interview.job_title}".

Job Description: ${
          jobDescription || interview.job_description || "Not provided"
        }

Requirements:
1. Questions should present hypothetical work scenarios
2. Focus on how the candidate would handle specific situations
3. Include questions about conflict resolution and decision-making
4. Questions should be relevant to the job role`,

        problem_solving: `Generate ${numQuestions} problem-solving interview questions for a ${
          interviewType || interview.interview_type
        } interview for the position of "${jobTitle || interview.job_title}".

Job Description: ${
          jobDescription || interview.job_description || "Not provided"
        }

Requirements:
1. Questions should test analytical and problem-solving skills
2. Include both technical and business problem scenarios
3. Questions should assess logical thinking and creativity
4. Mix of structured and open-ended problems`,

        leadership: `Generate ${numQuestions} leadership interview questions for a ${
          interviewType || interview.interview_type
        } interview for the position of "${jobTitle || interview.job_title}".

Job Description: ${
          jobDescription || interview.job_description || "Not provided"
        }

Requirements:
1. Questions should focus on leadership and management skills
2. Include questions about team management and motivation
3. Questions should assess strategic thinking and vision
4. Include scenarios about leading change and innovation`,

        culture_fit: `Generate ${numQuestions} culture fit interview questions for a ${
          interviewType || interview.interview_type
        } interview for the position of "${jobTitle || interview.job_title}".

Job Description: ${
          jobDescription || interview.job_description || "Not provided"
        }

Requirements:
1. Questions should assess alignment with company values
2. Include questions about work style and preferences
3. Questions should evaluate adaptability and growth mindset
4. Focus on long-term career goals and motivations`,

        general: `Generate ${numQuestions} professional interview questions for a ${
          interviewType || interview.interview_type
        } interview for the position of "${jobTitle || interview.job_title}".

Job Description: ${
          jobDescription || interview.job_description || "Not provided"
        }

Requirements:
1. Questions should be relevant to the job title and description
2. Mix of technical, behavioral, and situational questions
3. Questions should be clear and professional
4. Include questions appropriate for the interview type`,
      };

      return typePrompts[type] || typePrompts.general;
    };

    const prompt =
      getQuestionTypePrompt(questionType) +
      `

4. Each question should be on a separate line
5. Number each question (1, 2, 3, etc.)

Please provide only the questions, one per line, without any additional text or formatting.`;

    console.log("Sending prompt to OpenAI:", prompt);

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );
    console.log("openaiResponse", openaiResponse);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      throw new Error("Failed to generate questions with AI");
    }

    const openaiData = await openaiResponse.json();
    const generatedText = openaiData.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error("No questions generated by AI");
    }

    // Parse the generated questions
    const questions = generatedText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^\d+\.\s*/, "")) // Remove numbering
      .slice(0, numQuestions); // Limit to requested number

    console.log("Generated questions:", questions);

    // Format questions for response
    const formattedQuestions = questions.map((question, index) => ({
      id: `temp_${Date.now()}_${index}`,
      questionText: question,
      questionType: questionType,
      isAiGenerated: true,
      orderIndex: index + 1,
      category: questionType,
    }));

    // Only save to database if we have a real interviewId
    if (interviewId && interviewId !== "temp") {
      const questionsToSave = questions.map((question, index) => ({
        interview_id: interviewId,
        question_text: question,
        question_type: questionType,
        is_ai_generated: true,
        order_index: index + 1,
      }));

      // Delete existing AI-generated questions for this interview
      await fetch(
        `${supabaseUrl}/rest/v1/interview_questions?interview_id=eq.${interviewId}&is_ai_generated=eq.true`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
        }
      );

      // Insert new questions
      const saveResponse = await fetch(
        `${supabaseUrl}/rest/v1/interview_questions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(questionsToSave),
        }
      );

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error("Failed to save questions:", errorText);
        // Don't throw error, just log it and continue
      }
    }
    console.log("✅ Questions generated successfully:", formattedQuestions);

    // Update interview status only if we have a real interviewId
    if (interviewId && interviewId !== "temp") {
      await fetch(`${supabaseUrl}/rest/v1/interviews?id=eq.${interviewId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "questions_ready",
          updated_at: new Date().toISOString(),
        }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          questions: formattedQuestions,
          count: formattedQuestions.length,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Generate Questions error:", error);

    const errorResponse = {
      success: false,
      error: {
        code: "GENERATE_QUESTIONS_ERROR",
        message:
          error.message ||
          "An unexpected error occurred while generating questions",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
