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

    // Build query URL - fetch talent searches and extract candidates from results
    const queryUrl = `${supabaseUrl}/rest/v1/talent_searches?user_id=eq.${actualUserId}&select=id,results,created_at&order=created_at.desc&limit=${limit}&offset=${offset}`;

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

    const talentSearches = await candidatesResponse.json();

    // Extract candidates from all talent searches
    const allCandidates: any[] = [];
    talentSearches.forEach((search: any) => {
      if (search.results && Array.isArray(search.results)) {
        // Add search_id to each candidate for reference
        const candidatesWithSearchId = search.results.map((candidate: any) => ({
          ...candidate,
          search_id: search.id,
          search_created_at: search.created_at,
        }));
        allCandidates.push(...candidatesWithSearchId);
      }
    });

    // Apply search filter if provided
    let filteredCandidates = allCandidates;
    if (search) {
      filteredCandidates = allCandidates.filter(
        (candidate: any) =>
          candidate.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          candidate.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    console.log(
      `✅ Fetched ${filteredCandidates.length} candidates from ${talentSearches.length} searches`
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          candidates: filteredCandidates,
          count: filteredCandidates.length,
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
