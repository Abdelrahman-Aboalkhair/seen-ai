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
    console.log("=== Get Interviews Started ===");

    // Get environment variables
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error("Environment settings not available");
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

    // Fetch all interviews for the user with session counts
    const interviewsResponse = await fetch(
      `${supabaseUrl}/rest/v1/interviews?user_id=eq.${actualUserId}&select=*,interview_sessions(id,status),interview_candidates(id)`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );

    if (!interviewsResponse.ok) {
      throw new Error("Failed to fetch interviews");
    }

    const interviews = await interviewsResponse.json();

    // Process interviews to add session counts and determine status
    const processedInterviews = interviews.map((interview: any) => {
      const sessions = interview.interview_sessions || [];
      const candidates = interview.interview_candidates || [];

      const completedSessions = sessions.filter(
        (s: any) => s.status === "completed"
      );
      const pendingSessions = sessions.filter(
        (s: any) => s.status === "pending"
      );
      const startedSessions = sessions.filter(
        (s: any) => s.status === "started"
      );

      // Determine the actual status based on sessions
      let actualStatus = interview.status;
      if (sessions.length > 0) {
        if (completedSessions.length === sessions.length) {
          actualStatus = "completed";
        } else if (startedSessions.length > 0 || pendingSessions.length > 0) {
          actualStatus = "in_progress";
        }
      } else {
        actualStatus = "questions_ready";
      }

      return {
        ...interview,
        status: actualStatus,
        _count: {
          interview_sessions: sessions.length,
          interview_candidates: candidates.length,
        },
        // Remove the nested arrays to keep the response clean
        interview_sessions: undefined,
        interview_candidates: undefined,
      };
    });

    console.log(
      `✅ Fetched ${processedInterviews.length} interviews for user ${actualUserId}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: processedInterviews,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get Interviews error:", error);

    const errorResponse = {
      success: false,
      error: {
        code: "GET_INTERVIEWS_ERROR",
        message:
          error.message ||
          "An unexpected error occurred while fetching interviews",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
