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
    console.log("=== Get Interview Data Started ===");

    // Get environment variables
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error("Environment settings not available");
    }

    // Get interview ID from query parameters
    const url = new URL(req.url);
    const interviewId = url.searchParams.get("interviewId");

    if (!interviewId) {
      throw new Error("Interview ID is required");
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

    // Fetch interview details
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
      throw new Error("Failed to fetch interview details");
    }

    const interviews = await interviewResponse.json();
    if (!interviews || interviews.length === 0) {
      throw new Error("Interview not found or access denied");
    }

    const interview = interviews[0];

    // Fetch questions
    const questionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/interview_questions?interview_id=eq.${interviewId}&order=order_index.asc`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );

    const questions = questionsResponse.ok
      ? await questionsResponse.json()
      : [];

    // Fetch candidates
    const candidatesResponse = await fetch(
      `${supabaseUrl}/rest/v1/interview_candidates?interview_id=eq.${interviewId}&order=created_at.asc`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );

    const candidates = candidatesResponse.ok
      ? await candidatesResponse.json()
      : [];

    // Fetch results for each candidate
    const results = [];
    for (const candidate of candidates) {
      const resultResponse = await fetch(
        `${supabaseUrl}/rest/v1/interview_results?candidate_id=eq.${candidate.id}`,
        {
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
        }
      );

      if (resultResponse.ok) {
        const candidateResults = await resultResponse.json();
        if (candidateResults && candidateResults.length > 0) {
          results.push({
            candidate_id: candidate.id,
            result: candidateResults[0],
          });
        }
      }
    }

    console.log(
      `✅ Fetched interview data: ${questions.length} questions, ${candidates.length} candidates, ${results.length} results`
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          interview,
          questions,
          candidates,
          results,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get Interview Data error:", error);

    const errorResponse = {
      success: false,
      error: {
        code: "GET_INTERVIEW_DATA_ERROR",
        message:
          error.message ||
          "An unexpected error occurred while fetching interview data",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
