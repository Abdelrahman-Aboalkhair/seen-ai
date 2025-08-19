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
    console.log("=== Fetch Candidates Started ===");

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

    // Get query parameters
    const url = new URL(req.url);
    const limit = url.searchParams.get("limit") || "50";
    const offset = url.searchParams.get("offset") || "0";
    const search = url.searchParams.get("search") || "";

    // Build query URL
    let queryUrl = `${supabaseUrl}/rest/v1/talent_searches?user_id=eq.${actualUserId}&select=id,name,email,resume_url,created_at&order=created_at.desc&limit=${limit}&offset=${offset}`;

    if (search) {
      queryUrl += `&or=(name.ilike.%${search}%,email.ilike.%${search}%)`;
    }

    console.log("Fetching candidates with query:", queryUrl);

    const candidatesResponse = await fetch(queryUrl, {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    });

    if (!candidatesResponse.ok) {
      const errorText = await candidatesResponse.text();
      console.error("Failed to fetch candidates:", errorText);
      throw new Error("Failed to fetch candidates");
    }

    const candidates = await candidatesResponse.json();
    console.log(`✅ Fetched ${candidates.length} candidates`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          candidates,
          count: candidates.length,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Fetch Candidates error:", error);

    const errorResponse = {
      success: false,
      error: {
        code: "FETCH_CANDIDATES_ERROR",
        message:
          error.message ||
          "An unexpected error occurred while fetching candidates",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
