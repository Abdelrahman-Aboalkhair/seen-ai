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
    console.log("=== Create Interview Started ===");

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
    const {
      jobTitle,
      jobDescription,
      numQuestions = 5,
      interviewType = "comprehensive",
      durationMinutes = 30,
      interviewMode = "biometric_with_questions",
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

    // Create interview record
    const interviewData = {
      user_id: actualUserId,
      job_title: jobTitle,
      job_description: jobDescription || "",
      num_questions: numQuestions,
      interview_type: interviewType,
      duration_minutes: durationMinutes,
      interview_mode: interviewMode,
      status: "setup",
    };

    console.log("Creating interview with data:", interviewData);

    const createResponse = await fetch(`${supabaseUrl}/rest/v1/interviews`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(interviewData),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(
        "Failed to create interview:",
        createResponse.status,
        errorText
      );
      throw new Error(`Failed to create interview: ${createResponse.status}`);
    }

    const createdInterview = await createResponse.json();
    console.log("✅ Interview created successfully:", createdInterview);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          interview: createdInterview,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Create Interview error:", error);

    const errorResponse = {
      success: false,
      error: {
        code: "CREATE_INTERVIEW_ERROR",
        message:
          error.message ||
          "An unexpected error occurred while creating the interview",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
