Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { n8nWebhookUrl } = await req.json();

    if (!n8nWebhookUrl) {
      throw new Error("n8nWebhookUrl is required");
    }

    // Test payload
    const testPayload = {
      sessionId: `test_${Date.now()}`,
      chatInput: "Software Engineer",
      jobDescription: "We are looking for a software engineer",
      skillsRequired: "JavaScript, React, Node.js",
      certifications: "",
      education: "bachelor",
      languages: "Arabic, English",
      location: "Riyadh",
      numberOfCandidates: 3,
      matchScore: 60,
    };

    console.log("Testing n8n webhook with payload:", testPayload);
    console.log("n8n webhook URL:", n8nWebhookUrl);

    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    console.log("n8nResponse status:", response.status);
    console.log("n8nResponse statusText:", response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `n8n webhook error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const n8nData = await response.json();

    // Detailed analysis of the response
    const analysis = {
      responseType: typeof n8nData,
      isArray: Array.isArray(n8nData),
      keys: n8nData ? Object.keys(n8nData) : null,
      hasData: n8nData?.data ? true : false,
      hasCandidates: n8nData?.candidates ? true : false,
      hasResults: n8nData?.results ? true : false,
      dataType: n8nData?.data ? typeof n8nData.data : null,
      dataIsArray: n8nData?.data ? Array.isArray(n8nData.data) : null,
      candidatesType: n8nData?.candidates ? typeof n8nData.candidates : null,
      candidatesIsArray: n8nData?.candidates
        ? Array.isArray(n8nData.candidates)
        : null,
      resultsType: n8nData?.results ? typeof n8nData.results : null,
      resultsIsArray: n8nData?.results ? Array.isArray(n8nData.results) : null,
      sampleItem:
        n8nData && Array.isArray(n8nData) && n8nData.length > 0
          ? n8nData[0]
          : n8nData?.data &&
            Array.isArray(n8nData.data) &&
            n8nData.data.length > 0
          ? n8nData.data[0]
          : n8nData?.candidates &&
            Array.isArray(n8nData.candidates) &&
            n8nData.candidates.length > 0
          ? n8nData.candidates[0]
          : n8nData?.results &&
            Array.isArray(n8nData.results) &&
            n8nData.results.length > 0
          ? n8nData.results[0]
          : null,
      fullResponse: n8nData,
    };

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysis,
        message: "n8n response format analysis completed",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Test n8n format error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "TEST_N8N_FORMAT_FAILED",
          message: error.message,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
