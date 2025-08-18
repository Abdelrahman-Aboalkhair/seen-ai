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
    console.log("Job Requirements Generator - Request method:", req.method);

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

    const { jobInfo, userId } = bodyData;

    // Validate required fields
    if (!jobInfo) {
      throw new Error("معلومات الوظيفة مطلوبة");
    }

    // Get environment variables
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const openaiApiKey = Deno.env.get("OPENAI_API");
    const openaiModel = "gpt-4o-mini";

    if (!serviceRoleKey || !supabaseUrl || !openaiApiKey) {
      throw new Error("إعدادات API غير متوفرة");
    }

    // Get user from auth header
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
      `${supabaseUrl}/rest/v1/profiles?select=id,credits&id=eq.${actualUserId}`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );

    if (!userProfileResponse.ok) {
      throw new Error("فشل في جلب بيانات المستخدم");
    }

    const userProfiles = await userProfileResponse.json();
    if (!userProfiles || userProfiles.length === 0) {
      throw new Error("لم يتم العثور على ملف المستخدم");
    }

    const currentCredits = userProfiles[0].credits || 0;
    const requiredCredits = 10;

    if (currentCredits < requiredCredits) {
      throw new Error("رصيد كريديت غير كافي");
    }

    // Generate job requirements using OpenAI
    const prompt = `Generate professional job requirements for the following job information. Please provide a comprehensive response in JSON format with the following structure:

{
  "jobTitle": "Extracted job title",
  "requirements": "Detailed job requirements and responsibilities",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "certificates": ["certificate1", "certificate2", "certificate3"],
  "salaryRange": "Salary range in SAR",
  "educationLevel": "Required education level",
  "experience": "Required experience level"
}

Job Information: ${jobInfo}

Please ensure the response is valid JSON and includes all the required fields. The requirements should be professional and comprehensive. Skills should be specific and relevant. Certificates should be industry-standard. Salary range should be appropriate for the Saudi market. Education level should be specific (e.g., "Bachelor's Degree in Computer Science"). Experience should be specific (e.g., "3-5 years of experience").`;

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: openaiModel,
          messages: [
            {
              role: "system",
              content:
                "You are a professional HR consultant specializing in job requirements generation. Provide accurate, professional, and comprehensive job requirements in JSON format.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("OpenAI API error:", errorData);
      throw new Error("فشل في توليد المتطلبات باستخدام الذكاء الاصطناعي");
    }

    const openaiData = await openaiResponse.json();
    console.log("OpenAI response:", openaiData);

    if (
      !openaiData.choices ||
      !openaiData.choices[0] ||
      !openaiData.choices[0].message
    ) {
      throw new Error("استجابة غير صحيحة من خدمة الذكاء الاصطناعي");
    }

    const generatedContent = openaiData.choices[0].message.content;
    console.log("Generated content:", generatedContent);

    // Parse the JSON response
    let requirements;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("لم يتم العثور على JSON صحيح في الاستجابة");
      }
      requirements = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON parse error for requirements:", parseError);
      throw new Error("فشل في تحليل متطلبات الوظيفة المولدة");
    }

    // Validate the required fields
    const requiredFields = [
      "jobTitle",
      "requirements",
      "skills",
      "certificates",
      "salaryRange",
      "educationLevel",
      "experience",
    ];
    for (const field of requiredFields) {
      if (!requirements[field]) {
        throw new Error(`الحقل المطلوب مفقود: ${field}`);
      }
    }

    // Deduct credits
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
          credits: currentCredits - requiredCredits,
        }),
      }
    );

    if (!updateCreditsResponse.ok) {
      throw new Error("فشل في تحديث رصيد الكريديت");
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
        credits_amount: -requiredCredits,
        description: `توليد متطلبات الوظيفة - ${requirements.jobTitle}`,
      }),
    });

    return new Response(
      JSON.stringify({
        data: requirements,
        creditsUsed: requiredCredits,
        remainingCredits: currentCredits - requiredCredits,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("خطأ في توليد متطلبات الوظيفة:", error);

    const errorResponse = {
      error: {
        code: "JOB_REQUIREMENTS_GENERATION_FAILED",
        message: error.message,
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 200, // Always return 200 to avoid supabase.functions.invoke issue
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
