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
    console.log("=== Simulate Interview Started ===");

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

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error("Environment settings not available");
    }

    // Extract data from request
    const { interviewId, candidateId } = bodyData;

    // Validate required fields
    if (!interviewId || !candidateId) {
      throw new Error("Interview ID and Candidate ID are required");
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

    // Verify interview belongs to user
    const interviewResponse = await fetch(
      `${supabaseUrl}/rest/v1/interviews?id=eq.${interviewId}&user_id=eq.${actualUserId}`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );

    if (!interviewResponse.ok) {
      throw new Error("Failed to verify interview");
    }

    const interviews = await interviewResponse.json();
    if (!interviews || interviews.length === 0) {
      throw new Error("Interview not found or access denied");
    }

    const interview = interviews[0];

    // Verify candidate belongs to interview
    const candidateResponse = await fetch(
      `${supabaseUrl}/rest/v1/interview_candidates?id=eq.${candidateId}&interview_id=eq.${interviewId}`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );

    if (!candidateResponse.ok) {
      throw new Error("Failed to verify candidate");
    }

    const candidates = await candidateResponse.json();
    if (!candidates || candidates.length === 0) {
      throw new Error(
        "Candidate not found or not associated with this interview"
      );
    }

    const candidate = candidates[0];

    // Generate dummy interview results
    const score = Math.floor(Math.random() * 40) + 60; // Score between 60-100
    const durationMinutes = Math.floor(Math.random() * 20) + 15; // Duration between 15-35 minutes
    const questionsAnswered = Math.floor(Math.random() * 3) + 3; // 3-5 questions answered

    // Generate dummy notes based on score
    let notes = "";
    if (score >= 90) {
      notes =
        "Excellent performance. Candidate demonstrated strong technical skills and excellent communication. Highly recommended for the position.";
    } else if (score >= 80) {
      notes =
        "Very good performance. Candidate showed solid technical knowledge and good problem-solving abilities. Recommended for consideration.";
    } else if (score >= 70) {
      notes =
        "Good performance. Candidate has adequate skills but may need some training. Consider for the position with proper onboarding.";
    } else {
      notes =
        "Average performance. Candidate struggled with some technical questions. May not be the best fit for this role.";
    }

    // Generate dummy biometric analysis (placeholder for future implementation)
    const biometricAnalysis = {
      confidence_level: Math.floor(Math.random() * 30) + 70, // 70-100%
      engagement_score: Math.floor(Math.random() * 40) + 60, // 60-100%
      stress_level: Math.floor(Math.random() * 30) + 10, // 10-40%
      eye_contact: Math.floor(Math.random() * 40) + 60, // 60-100%
      body_language: Math.floor(Math.random() * 40) + 60, // 60-100%
      voice_clarity: Math.floor(Math.random() * 40) + 60, // 60-100%
      notes:
        "Biometric analysis completed. Overall candidate showed good engagement and confidence during the interview.",
    };

    // Create interview result
    const resultData = {
      interview_id: interviewId,
      candidate_id: candidateId,
      score,
      notes,
      duration_minutes: durationMinutes,
      questions_answered: questionsAnswered,
      total_questions: interview.num_questions,
      biometric_analysis: biometricAnalysis,
    };

    console.log("Creating interview result:", resultData);

    const resultResponse = await fetch(
      `${supabaseUrl}/rest/v1/interview_results`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resultData),
      }
    );

    if (!resultResponse.ok) {
      const errorText = await resultResponse.text();
      console.error("Failed to save interview result:", errorText);
      throw new Error("Failed to save interview result");
    }

    const savedResult = await resultResponse.json();

    // Update candidate status to completed
    await fetch(
      `${supabaseUrl}/rest/v1/interview_candidates?id=eq.${candidateId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "completed",
          updated_at: new Date().toISOString(),
        }),
      }
    );

    console.log("✅ Interview simulation completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          result: savedResult,
          score,
          notes,
          durationMinutes,
          questionsAnswered,
          biometricAnalysis,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Simulate Interview error:", error);

    const errorResponse = {
      success: false,
      error: {
        code: "SIMULATE_INTERVIEW_ERROR",
        message:
          error.message ||
          "An unexpected error occurred while simulating the interview",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
