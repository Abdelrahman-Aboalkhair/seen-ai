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
    console.log("=== Bulk CV Analysis Started ===");
    console.log("Request method:", req.method);

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
      cvFiles, // Array of base64 files
      cvTexts, // Array of text CVs
      jobTitle,
      jobDescription,
      skillsRequired,
      userId,
    } = bodyData;

    // Validate required fields
    if (
      (!cvFiles || cvFiles.length === 0) &&
      (!cvTexts || cvTexts.length === 0)
    ) {
      throw new Error("CV files or texts are required");
    }
    if (!jobTitle) {
      throw new Error("Job title is required");
    }
    if (!skillsRequired) {
      throw new Error("Required skills are required");
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

    // Get user profile and credits
    const userProfileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=id,credits,total_analyses&id=eq.${actualUserId}`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );

    if (!userProfileResponse.ok) {
      throw new Error("Failed to verify user");
    }

    const userProfiles = await userProfileResponse.json();
    if (!userProfiles || userProfiles.length === 0) {
      throw new Error("User not found");
    }

    const currentCredits = userProfiles[0].credits;
    const cvAnalysisCost = 5; // Cost per CV analysis

    // Calculate total CVs to process
    const totalCvs = (cvFiles?.length || 0) + (cvTexts?.length || 0);
    const totalCost = totalCvs * cvAnalysisCost;

    if (currentCredits < totalCost) {
      throw new Error(
        `Insufficient credits. Need ${totalCost} credits for ${totalCvs} CVs, but only have ${currentCredits}`
      );
    }

    console.log(
      `✅ Sufficient credits available. Processing ${totalCvs} CVs for ${totalCost} credits`
    );

    // Create bulk analysis record
    const bulkAnalysisId = crypto.randomUUID();
    const bulkAnalysisRecord = {
      id: bulkAnalysisId,
      user_id: actualUserId,
      job_title: jobTitle,
      job_description: jobDescription || "",
      skills_required: skillsRequired,
      total_cvs: totalCvs,
      processed_cvs: 0,
      status: "processing",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert bulk analysis record
    const bulkInsertResponse = await fetch(
      `${supabaseUrl}/rest/v1/bulk_cv_analyses`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bulkAnalysisRecord),
      }
    );

    if (!bulkInsertResponse.ok) {
      throw new Error("Failed to create bulk analysis record");
    }

    // Process CVs in parallel with concurrency limit
    const concurrencyLimit = 3; // Process 3 CVs at a time to avoid rate limits
    const allCvs = [];

    // Add file CVs
    if (cvFiles && cvFiles.length > 0) {
      cvFiles.forEach((file, index) => {
        allCvs.push({
          type: "file",
          data: file,
          index: index,
          originalIndex: index,
        });
      });
    }

    // Add text CVs
    if (cvTexts && cvTexts.length > 0) {
      cvTexts.forEach((text, index) => {
        allCvs.push({
          type: "text",
          data: text,
          index: cvFiles?.length + index,
          originalIndex: index,
        });
      });
    }

    const results = [];
    const errors = [];

    // Process CVs in batches
    for (let i = 0; i < allCvs.length; i += concurrencyLimit) {
      const batch = allCvs.slice(i, i + concurrencyLimit);

      const batchPromises = batch.map(async (cv) => {
        try {
          console.log(`Processing CV ${cv.index + 1}/${totalCvs}`);

          // Extract text from CV
          let extractedText;
          if (cv.type === "text") {
            extractedText = cv.data;
          } else {
            // Extract text from file using the same logic as single CV analysis
            extractedText = await extractTextFromFile(cv.data, openaiApiKey);
          }

          // Analyze CV using OpenAI
          const analysis = await analyzeCVWithOpenAI(
            extractedText,
            jobTitle,
            jobDescription || "",
            skillsRequired,
            openaiApiKey
          );

          // Create individual CV analysis record
          const cvAnalysisRecord = {
            id: crypto.randomUUID(),
            bulk_analysis_id: bulkAnalysisId,
            user_id: actualUserId,
            cv_index: cv.index,
            cv_type: cv.type,
            job_title: jobTitle,
            job_description: jobDescription || "",
            skills_required: skillsRequired,
            cv_text: extractedText,
            analysis_result: analysis,
            status: "completed",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Insert CV analysis record
          await fetch(`${supabaseUrl}/rest/v1/cv_analyses`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              apikey: serviceRoleKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(cvAnalysisRecord),
          });

          return {
            index: cv.index,
            analysis: analysis,
            status: "success",
          };
        } catch (error) {
          console.error(`Error processing CV ${cv.index + 1}:`, error);

          // Create error record
          const errorRecord = {
            id: crypto.randomUUID(),
            bulk_analysis_id: bulkAnalysisId,
            user_id: actualUserId,
            cv_index: cv.index,
            cv_type: cv.type,
            job_title: jobTitle,
            job_description: jobDescription || "",
            skills_required: skillsRequired,
            error_message: error.message,
            status: "failed",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await fetch(`${supabaseUrl}/rest/v1/cv_analyses`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              apikey: serviceRoleKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(errorRecord),
          });

          return {
            index: cv.index,
            error: error.message,
            status: "error",
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      // Update processed count
      const processedCount = i + batch.length;
      await fetch(
        `${supabaseUrl}/rest/v1/bulk_cv_analyses?id=eq.${bulkAnalysisId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            processed_cvs: processedCount,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      results.push(...batchResults);
    }

    // Deduct credits
    const newCredits = currentCredits - totalCost;
    await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${actualUserId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credits: newCredits,
        total_analyses: (userProfiles[0].total_analyses || 0) + totalCvs,
      }),
    });

    // Update bulk analysis status
    const successCount = results.filter((r) => r.status === "success").length;
    const finalStatus =
      successCount === totalCvs ? "completed" : "completed_with_errors";

    await fetch(
      `${supabaseUrl}/rest/v1/bulk_cv_analyses?id=eq.${bulkAnalysisId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: finalStatus,
          processed_cvs: totalCvs,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    // Return results
    const responseData = {
      success: true,
      data: {
        bulkAnalysisId,
        totalCvs,
        processedCvs: successCount,
        failedCvs: totalCvs - successCount,
        results: results.sort((a, b) => a.index - b.index),
        remainingCredits: newCredits,
      },
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Bulk CV Analysis error:", error);

    const errorResponse = {
      success: false,
      error: {
        code: "BULK_CV_ANALYSIS_ERROR",
        message:
          error.message ||
          "An unexpected error occurred during bulk CV analysis",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper function to extract text from file (same logic as single CV analysis)
async function extractTextFromFile(
  cvFile: string,
  openaiApiKey: string
): Promise<string> {
  try {
    // Determine file type from base64 data
    const fileHeader = cvFile.substring(0, 20);
    let fileType = "unknown";

    if (fileHeader.includes("JVBERi0")) {
      fileType = "pdf";
    } else if (fileHeader.includes("iVBORw0KGgo")) {
      fileType = "png";
    } else if (fileHeader.includes("/9j/4AAQ")) {
      fileType = "jpeg";
    } else if (fileHeader.includes("UklGR")) {
      fileType = "webp";
    }

    console.log("Detected file type:", fileType);

    if (fileType === "pdf") {
      // Try OpenAI Vision API for PDF
      try {
        const visionResponse = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openaiApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Extract all text from this PDF resume/CV. Include all personal information, work experience, education, skills, and other relevant details. Format the output as clean, readable text preserving the logical structure.`,
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:application/pdf;base64,${cvFile}`,
                        detail: "high",
                      },
                    },
                  ],
                },
              ],
              max_tokens: 4000,
            }),
          }
        );

        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          const visionText = visionData.choices[0]?.message?.content;

          if (visionText && visionText.trim().length > 50) {
            return visionText;
          }
        }
      } catch (error) {
        console.log("Vision API failed, trying alternative methods...");
      }

      // Try alternative PDF extraction methods
      try {
        const { extractText } = await import("https://esm.sh/unpdf@0.11.0");
        const text = await extractText(cvFile);
        if (text && text.trim().length > 50) {
          return text;
        }
      } catch (error) {
        console.log("unpdf failed, trying pdf_parser...");
      }

      try {
        const { default: pdfParser } = await import(
          "https://deno.land/x/pdf_parser@v1.1.2/mod.ts"
        );
        const base64Data = cvFile.replace(/^data:application\/pdf;base64,/, "");
        const binaryString = atob(base64Data);
        const uint8Array = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }
        const pdfData = await pdfParser(uint8Array);
        if (pdfData && pdfData.length > 0) {
          const extractedText = pdfData
            .map((page) => page.text || page.content || "")
            .join("\n");
          if (extractedText && extractedText.trim().length > 50) {
            return extractedText;
          }
        }
      } catch (error) {
        console.log("pdf_parser failed");
      }

      throw new Error("Failed to extract text from PDF");
    } else {
      // For images, use OpenAI Vision API
      const visionResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Extract all text from this resume/CV image. Include all personal information, work experience, education, skills, and other relevant details. Format the output as clean, readable text preserving the logical structure.`,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/${fileType};base64,${cvFile}`,
                      detail: "high",
                    },
                  },
                ],
              },
            ],
            max_tokens: 4000,
          }),
        }
      );

      if (visionResponse.ok) {
        const visionData = await visionResponse.json();
        const visionText = visionData.choices[0]?.message?.content;

        if (visionText && visionText.trim().length > 50) {
          return visionText;
        }
      }

      throw new Error("Failed to extract text from image");
    }
  } catch (error) {
    console.error("Text extraction error:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

// Helper function to analyze CV with OpenAI (same logic as single CV analysis)
async function analyzeCVWithOpenAI(
  cvText: string,
  jobTitle: string,
  jobDescription: string,
  skillsRequired: string,
  openaiApiKey: string
): Promise<any> {
  const prompt = `تحليل السيرة الذاتية للمقارنة مع الوظيفة المطلوبة

معلومات الوظيفة:
- المسمى الوظيفي: ${jobTitle}
- وصف الوظيفة: ${jobDescription}
- المهارات المطلوبة: ${skillsRequired}

نص السيرة الذاتية:
${cvText}

يرجى تحليل السيرة الذاتية وتقديم النتائج بالشكل التالي (JSON format):

{
  "name": "اسم المرشح",
  "email": "البريد الإلكتروني",
  "phone": "رقم الهاتف",
  "city": "المدينة",
  "dateOfBirth": "تاريخ الميلاد",
  "skills": "المهارات المكتسبة (مفصولة بفواصل)",
  "summary": "ملخص مختصر عن المرشح",
  "education": "المؤهلات التعليمية",
  "jobHistory": "الخبرة العملية",
  "consideration": "التقييم العام للمرشح",
  "strengths": "نقاط القوة (مفصولة بفواصل)",
  "gaps": "نقاط التحسين (مفصولة بفواصل)",
  "vote": "التقييم من 1-10",
  "analysisDate": "تاريخ التحليل"
}

يرجى التأكد من أن جميع الحقول مملوءة. إذا لم يتم العثور على معلومات معينة، استخدم "غير محدد".`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error("OpenAI API request failed");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content received from OpenAI");
  }

  try {
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON found in response");
    }
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    console.error("Raw content:", content);
    throw new Error("Failed to parse analysis result");
  }
}
