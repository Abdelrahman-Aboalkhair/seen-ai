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
    console.log("Request method:", req.method);
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));

    const requestBody = await req.text();
    console.log("Raw request body:", requestBody);

    let bodyData;
    try {
      bodyData = JSON.parse(requestBody);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error("Invalid JSON in request body");
    }

    console.log("Parsed body data:", bodyData);

    const {
      jobTitle,
      jobDescription,
      skillsRequired,
      certifications,
      educationLevel,
      languages,
      numberOfCandidates,
      matchScoreType,
      userId,
    } = bodyData;

    // Validate required fields
    console.log("Received data:", {
      jobTitle,
      jobDescription,
      skillsRequired,
      certifications,
      educationLevel,
      languages,
      numberOfCandidates,
      matchScoreType,
      userId,
    });

    if (!jobTitle) {
      throw new Error("عنوان الوظيفة مطلوب");
    }
    if (!jobDescription) {
      throw new Error("وصف الوظيفة مطلوب");
    }
    if (!skillsRequired) {
      throw new Error("المهارات المطلوبة مطلوبة");
    }
    if (!numberOfCandidates) {
      throw new Error("عدد المرشحين مطلوب");
    }

    // Get environment variables
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    if (!serviceRoleKey || !supabaseUrl || !n8nWebhookUrl) {
      throw new Error("إعدادات Supabase غير متوفرة");
    }

    // Get user from auth header instead of relying on userId in body
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("رأس التفويض مفقود");
    }

    // Verify token and get user
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: authHeader,
        apikey: serviceRoleKey,
      },
    });

    if (!userResponse.ok) {
      throw new Error("رمز التفويض غير صالح");
    }

    const userData = await userResponse.json();
    const actualUserId = userData.id;

    // Get user profile and credits
    const userProfileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=id,credits,total_searches&id=eq.${actualUserId}`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );

    if (!userProfileResponse.ok) {
      throw new Error("فشل في التحقق من المستخدم");
    }

    const userProfiles = await userProfileResponse.json();
    if (!userProfiles || userProfiles.length === 0) {
      throw new Error("المستخدم غير موجود");
    }

    const currentCredits = userProfiles[0].credits;

    // Calculate cost based on match score type
    const costPerCandidate = {
      quick: 10,
      balanced: 15,
      detailed: 20,
      comprehensive: 25,
    };

    const baseCost =
      numberOfCandidates *
      (costPerCandidate[matchScoreType as keyof typeof costPerCandidate] || 15);

    if (currentCredits < baseCost) {
      throw new Error("رصيد الكريدت غير كافي لإجراء هذا البحث");
    }

    // Convert match score type to numeric value
    const matchScoreValues = {
      quick: 50,
      balanced: 60,
      detailed: 70,
      comprehensive: 80,
    };

    const matchScore =
      matchScoreValues[matchScoreType as keyof typeof matchScoreValues] || 60;

    // Prepare data for n8n webhook
    const n8nPayload = {
      sessionId: `session_${Date.now()}_${actualUserId}`,
      chatInput: jobTitle,
      jobDescription: jobDescription,
      skillsRequired: skillsRequired,
      certifications: certifications || "",
      education: educationLevel || "bachelor",
      languages: languages || "",
      location: "Riyadh", // Default location
      numberOfCandidates: numberOfCandidates,
      matchScore: matchScore,
    };

    console.log("Calling n8n webhook with payload:", n8nPayload);
    console.log("n8n webhook URL:", n8nWebhookUrl);

    let n8nResponse;
    try {
      // Call n8n webhook
      n8nResponse = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(n8nPayload),
      });

      console.log("n8nResponse status:", n8nResponse.status);
      console.log("n8nResponse statusText:", n8nResponse.statusText);
      console.log(
        "n8nResponse headers:",
        Object.fromEntries(n8nResponse.headers.entries())
      );

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        console.error(
          "n8n webhook error:",
          n8nResponse.status,
          n8nResponse.statusText,
          "Response body:",
          errorText
        );
        throw new Error(
          `فشل في الاتصال بخدمة البحث عن الكفاءات: ${n8nResponse.status} ${n8nResponse.statusText}`
        );
      }
    } catch (fetchError) {
      console.error("Fetch error calling n8n webhook:", fetchError);
      throw new Error(
        `فشل في الاتصال بخدمة البحث عن الكفاءات: ${fetchError.message}`
      );
    }

    // Check if response is empty
    const responseText = await n8nResponse.text();
    console.log("n8n response text:", responseText);

    if (!responseText || responseText.trim() === "") {
      throw new Error("استجابة فارغة من خدمة البحث عن الكفاءات");
    }

    let n8nData;
    try {
      n8nData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error("تنسيق استجابة غير صحيح من خدمة البحث");
    }

    console.log("n8n response:", n8nData);
    console.log("n8n response type:", typeof n8nData);
    console.log("n8n response is array:", Array.isArray(n8nData));
    console.log("n8n response keys:", n8nData ? Object.keys(n8nData) : "null");

    // Process n8n response
    if (!n8nData) {
      throw new Error("استجابة فارغة من خدمة البحث");
    }

    // Handle different response formats from n8n
    let candidatesArray;
    if (Array.isArray(n8nData)) {
      // Direct array format
      candidatesArray = n8nData;
    } else if (n8nData.data && Array.isArray(n8nData.data)) {
      // Wrapped in data object
      candidatesArray = n8nData.data;
    } else if (n8nData.candidates && Array.isArray(n8nData.candidates)) {
      // Wrapped in candidates object
      candidatesArray = n8nData.candidates;
    } else if (n8nData.results && Array.isArray(n8nData.results)) {
      // Wrapped in results object
      candidatesArray = n8nData.results;
    } else if (n8nData.candidate && n8nData.matchScore) {
      // Single candidate object format (your n8n service format)
      candidatesArray = [n8nData];
    } else {
      console.error("Invalid n8n response format:", n8nData);
      throw new Error("تنسيق استجابة غير صحيح من خدمة البحث");
    }

    if (candidatesArray.length === 0) {
      throw new Error("لم يتم العثور على مرشحين مطابقين للمعايير المحددة");
    }

    console.log(`Found ${candidatesArray.length} candidates from n8n service`);
    console.log("Requested candidates:", numberOfCandidates);

    // Transform n8n response to our expected format
    const candidates = candidatesArray.map((item, index) => {
      // Validate required fields from n8n response
      if (!item.candidate || !item.candidate.name) {
        console.error("Invalid candidate data from n8n:", item);
        throw new Error("بيانات المرشح غير صحيحة من خدمة البحث");
      }

      return {
        current_position: item.candidate.headline || "غير محدد",
        full_name: item.candidate.name,
        linkedin_url: item.candidate.profileUrl || "",
        contact: {
          phone: "",
          email: "",
        },
        match_score: item.matchScore || 0,
        skills_match:
          item.analysis?.skillsMatch
            ?.split("\n")[0]
            ?.replace("technicalSkills: ", "") || "غير محدد",
        experience_match:
          item.analysis?.experienceMatch
            ?.split("\n")[0]
            ?.replace("quality: ", "") || "غير محدد",
        summary: item.summary || "غير محدد",
        ranking: index + 1,
        education_match:
          item.analysis?.educationMatch
            ?.split("\n")[0]
            ?.replace("relevance: ", "") || "غير محدد",
        culture_fit:
          item.analysis?.cultureFit
            ?.split("\n")[0]
            ?.replace("evaluation: ", "") || "غير محدد",
        strengths: item.analysis?.strengths?.join(", ") || "غير محدد",
        gaps: item.analysis?.gaps?.join(", ") || "غير محدد",
      };
    });

    // Deduct credits from user account
    const updateCreditsResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${actualUserId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          credits: currentCredits - baseCost,
          total_searches: userProfiles[0].total_searches
            ? userProfiles[0].total_searches + 1
            : 1,
        }),
      }
    );

    if (!updateCreditsResponse.ok) {
      throw new Error("فشل في تحديث رصيد الكريدت");
    }

    // Record credit transaction
    await fetch(`${supabaseUrl}/rest/v1/credit_transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: actualUserId,
        transaction_type: "spend",
        credits_amount: -baseCost,
        description: `بحث عن الكفاءات - ${candidates.length} مرشح`,
      }),
    });

    // Save search results
    const searchData = {
      user_id: actualUserId,
      search_query: {
        jobTitle,
        jobDescription,
        skillsRequired,
        certifications,
        educationLevel,
        languages,
        numberOfCandidates,
        matchScoreType,
      },
      required_skills: skillsRequired.split(",").map((s) => s.trim()),
      certifications: certifications
        ? certifications.split(",").map((s) => s.trim())
        : [],
      education_level: educationLevel,
      languages: languages ? languages.split(",").map((s) => s.trim()) : [],
      candidate_count: candidates.length,
      match_threshold: matchScore,
      credits_cost: baseCost,
      status: "completed",
      results: candidates,
    };

    await fetch(`${supabaseUrl}/rest/v1/talent_searches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchData),
    });

    return new Response(
      JSON.stringify({
        data: {
          candidates: candidates,
          creditsUsed: baseCost,
          remainingCredits: currentCredits - baseCost,
          n8nResponse: n8nData, // Include raw n8n response for debugging
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("خطأ في البحث عن الكفاءات:", error);

    const errorResponse = {
      error: {
        code: "TALENT_SEARCH_FAILED",
        message: error.message,
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 200, // Always return 200 to avoid supabase.functions.invoke issue
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
