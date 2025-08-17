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
    console.log("=== CV Analysis with OpenAI Started ===");
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

    // Check if this is a test request
    const isTest = bodyData.test === true;
    console.log("Is test request:", isTest);

    // Get environment variables
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const openaiApiKey = Deno.env.get("OPENAI_API");

    if (!serviceRoleKey || !supabaseUrl || !openaiApiKey) {
      throw new Error("إعدادات البيئة غير متوفرة");
    }

    // Extract data from request
    const { cvFile, cvText, jobTitle, jobDescription, skillsRequired, userId } =
      bodyData;

    // Validate required fields - either cvFile or cvText must be provided
    if (!cvFile && !cvText) {
      throw new Error("ملف السيرة الذاتية أو نص السيرة الذاتية مطلوب");
    }
    if (!jobTitle) {
      throw new Error("عنوان الوظيفة مطلوب");
    }
    if (!jobDescription) {
      throw new Error("وصف الوظيفة مطلوب");
    }
    if (!skillsRequired) {
      throw new Error("المهارات المطلوبة مطلوبة");
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
      `${supabaseUrl}/rest/v1/profiles?select=id,credits,total_analyses&id=eq.${actualUserId}`,
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
    const cvAnalysisCost = 5; // Cost for CV analysis

    if (currentCredits < cvAnalysisCost) {
      throw new Error("رصيد الكريدت غير كافي لتحليل السيرة الذاتية");
    }

    console.log("✅ Sufficient credits available");

    // Step 1: Extract text from document
    console.log("📄 Extracting text from document...");
    let extractedText;

    // Check if the input is already text (user might have pasted CV text directly)
    if (bodyData.cvText) {
      console.log("Using provided CV text directly");
      extractedText = bodyData.cvText;
    } else if (bodyData.cvFile) {
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
          console.log("Processing PDF file...");

          // Method 1: Try OpenAI Vision API first (works with many PDFs)
          try {
            console.log("Trying OpenAI Vision API for PDF...");
            const visionResponse = await fetch(
              "https://api.openai.com/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${openaiApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "gpt-4o", // Use gpt-4o for better PDF handling
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
                extractedText = visionText;
                console.log(
                  "✅ PDF text extraction successful using OpenAI Vision (gpt-4o)"
                );
                console.log("Extracted text length:", extractedText.length);
              } else {
                throw new Error("Vision API returned insufficient text");
              }
            } else {
              throw new Error("Vision API failed");
            }
          } catch (visionError) {
            console.log("OpenAI Vision failed, trying alternative methods...");

            // Method 2: Try unpdf library (works well with Deno)
            try {
              console.log("Trying unpdf library...");
              const { extractText } = await import(
                "https://esm.sh/unpdf@0.11.0"
              );

              // Convert base64 to ArrayBuffer
              const base64Data = cvFile.replace(
                /^data:application\/pdf;base64,/,
                ""
              );
              const binaryString = atob(base64Data);
              const arrayBuffer = new ArrayBuffer(binaryString.length);
              const uint8Array = new Uint8Array(arrayBuffer);

              for (let i = 0; i < binaryString.length; i++) {
                uint8Array[i] = binaryString.charCodeAt(i); // for loop to convert binary string to uint8Array
              }

              const result = await extractText(arrayBuffer, {
                mergePages: true,
                disableCombineTextItems: false,
              });

              if (result && result.text && result.text.trim().length > 0) {
                extractedText = result.text;
                console.log("✅ PDF text extraction successful using unpdf");
                console.log("Extracted text length:", extractedText.length);
              } else {
                throw new Error("unpdf returned empty text");
              }
            } catch (unpdfError) {
              console.log("unpdf failed, trying pdf_parser...");

              // Method 3: Try Deno pdf_parser
              try {
                const { default: pdfParser } = await import(
                  "https://deno.land/x/pdf_parser@v1.1.2/mod.ts"
                );

                // Convert base64 to Uint8Array
                const base64Data = cvFile.replace(
                  /^data:application\/pdf;base64,/,
                  ""
                );
                const binaryString = atob(base64Data);
                const uint8Array = new Uint8Array(binaryString.length);

                for (let i = 0; i < binaryString.length; i++) {
                  uint8Array[i] = binaryString.charCodeAt(i);
                }

                const pdfData = await pdfParser(uint8Array);

                if (pdfData && pdfData.length > 0) {
                  // Join all page texts
                  extractedText = pdfData
                    .map((page) => page.text || page.content || "")
                    .join("\n");

                  if (extractedText && extractedText.trim().length > 0) {
                    console.log(
                      "✅ PDF text extraction successful using pdf_parser"
                    );
                    console.log("Extracted text length:", extractedText.length);
                  } else {
                    throw new Error("pdf_parser returned empty text");
                  }
                } else {
                  throw new Error("pdf_parser returned no data");
                }
              } catch (parserError) {
                console.log("pdf_parser failed, trying JSR pdftext...");

                // Method 4: Try JSR @pdf/pdftext
                try {
                  const { extractText } = await import(
                    "jsr:@pdf/pdftext@0.1.0"
                  );

                  // Convert base64 to ArrayBuffer
                  const base64Data = cvFile.replace(
                    /^data:application\/pdf;base64,/,
                    ""
                  );
                  const binaryString = atob(base64Data);
                  const arrayBuffer = new ArrayBuffer(binaryString.length);
                  const uint8Array = new Uint8Array(arrayBuffer);

                  for (let i = 0; i < binaryString.length; i++) {
                    uint8Array[i] = binaryString.charCodeAt(i);
                  }

                  const result = await extractText(arrayBuffer);

                  if (result && result.trim().length > 0) {
                    extractedText = result;
                    console.log(
                      "✅ PDF text extraction successful using JSR pdftext"
                    );
                    console.log("Extracted text length:", extractedText.length);
                  } else {
                    throw new Error("JSR pdftext returned empty text");
                  }
                } catch (jsrError) {
                  console.error("All PDF extraction methods failed");
                  console.error("Vision error:", visionError.message);
                  console.error("unpdf error:", unpdfError.message);
                  console.error("pdf_parser error:", parserError.message);
                  console.error("JSR pdftext error:", jsrError.message);

                  throw new Error(
                    "فشل في استخراج النص من ملف PDF باستخدام جميع الطرق المتاحة. يرجى التأكد من أن الملف صالح وغير محمي بكلمة مرور أو قم بتحويل PDF إلى صورة أو استخدم خيار إدخال النص مباشرة."
                  );
                }
              }
            }
          }
        } else if (["png", "jpeg", "webp"].includes(fileType)) {
          // For image files, use OpenAI Vision API
          console.log("Processing image file with OpenAI Vision API...");
          const extractionResponse = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: `Please extract all the text content from this image. Return only the extracted text without any formatting or additional comments.`,
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

          if (!extractionResponse.ok) {
            const errorText = await extractionResponse.text();
            console.error("OpenAI API error response:", errorText);
            throw new Error(
              `فشل في استخراج النص من الصورة: ${extractionResponse.status} ${extractionResponse.statusText}`
            );
          }

          const extractionData = await extractionResponse.json();
          extractedText = extractionData.choices[0]?.message?.content;

          if (!extractedText) {
            throw new Error("فشل في استخراج النص من الصورة");
          }

          console.log(
            "✅ Image text extraction successful using OpenAI Vision"
          );
          console.log("Extracted text length:", extractedText.length);
        } else {
          throw new Error(
            "نوع الملف غير مدعوم. يرجى استخدام ملف PDF أو صورة (JPG/PNG) أو إدخال النص مباشرة."
          );
        }
      } catch (extractionError) {
        console.error("Document extraction error:", extractionError);
        throw new Error(`فشل في استخراج النص: ${extractionError.message}`);
      }
    } else {
      throw new Error("لم يتم توفير ملف أو نص للتحليل");
    }

    // Validate extracted text
    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error(
        "النص المستخرج قصير جداً أو فارغ. يرجى التأكد من جودة الملف."
      );
    }

    // Step 2: Analyze CV using OpenAI
    console.log("🔍 Analyzing CV...");
    const analysisPrompt = `
You are an expert HR analyst. Please analyze the following CV against the job requirements and provide a comprehensive evaluation.

CV Content:
${extractedText}

Job Title: ${jobTitle}
Job Description: ${jobDescription}
Required Skills: ${skillsRequired}

Please provide your analysis in the following JSON format:
{
  "personalInfo": {
    "name": "Full name",
    "email": "Email address", 
    "phone": "Phone number",
    "city": "City/Location",
    "dateOfBirth": "Date of birth if available"
  },
  "skills": "List of skills found in the CV",
  "summary": "Brief summary of the candidate's background",
  "education": "Educational background",
  "jobHistory": "Work experience and job history",
  "evaluation": {
    "vote": "Score from 1-10",
    "consideration": "Overall assessment and recommendation",
    "strengths": "Key strengths and positive aspects", 
    "gaps": "Areas of concern or missing requirements"
  }
}

IMPORTANT: Return ONLY the JSON object without any markdown formatting, code blocks, or additional text. Do not wrap the response in \`\`\`json or any other formatting.
`;

    let analysisResult;
    try {
      const analysisResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: analysisPrompt,
              },
            ],
            max_tokens: 2000,
            temperature: 0.3,
          }),
        }
      );

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        throw new Error(
          `CV analysis failed: ${analysisResponse.status} ${analysisResponse.statusText}`
        );
      }

      const analysisData = await analysisResponse.json();
      const analysisText = analysisData.choices[0]?.message?.content;

      if (!analysisText) {
        throw new Error("فشل في تحليل السيرة الذاتية");
      }

      // Parse the JSON response
      try {
        // Clean the response text - remove markdown code blocks if present
        let cleanAnalysisText = analysisText.trim();

        // Remove markdown code blocks if present
        if (cleanAnalysisText.startsWith("```json")) {
          cleanAnalysisText = cleanAnalysisText.replace(/^```json\s*/, "");
        }
        if (cleanAnalysisText.startsWith("```")) {
          cleanAnalysisText = cleanAnalysisText.replace(/^```\s*/, "");
        }
        if (cleanAnalysisText.endsWith("```")) {
          cleanAnalysisText = cleanAnalysisText.replace(/\s*```$/, "");
        }

        console.log(
          "🧹 Cleaned analysis text:",
          cleanAnalysisText.substring(0, 200) + "..."
        );

        analysisResult = JSON.parse(cleanAnalysisText);
        console.log("✅ JSON parsing successful");
        console.log("📊 Analysis Result Structure:");
        console.log(
          "Full analysis result:",
          JSON.stringify(analysisResult, null, 2)
        );
        console.log("Skills type:", typeof analysisResult.skills);
        console.log("Skills value:", analysisResult.skills);
        console.log("Skills is array:", Array.isArray(analysisResult.skills));
        console.log("Personal info:", analysisResult.personalInfo);
        console.log("Evaluation:", analysisResult.evaluation);
      } catch (parseError) {
        console.error("Failed to parse analysis result:", parseError);
        console.error("Raw analysis text:", analysisText);
        throw new Error("تنسيق استجابة التحليل غير صحيح");
      }

      console.log("✅ CV analysis successful");
    } catch (analysisError) {
      console.error("CV analysis error:", analysisError);
      throw new Error(`فشل في تحليل السيرة الذاتية: ${analysisError.message}`);
    }

    // Step 3: Transform analysis to our expected format
    console.log("🔄 Transforming analysis result to expected format...");
    const transformedSkills = Array.isArray(analysisResult.skills)
      ? analysisResult.skills.join(", ")
      : typeof analysisResult.skills === "object"
      ? JSON.stringify(analysisResult.skills).replace(/[{}"]/g, "")
      : analysisResult.skills || "";

    console.log("📝 Transformed skills:", transformedSkills);
    console.log("📝 Transformed skills type:", typeof transformedSkills);

    // Transform strengths and gaps to handle arrays
    const transformedStrengths = Array.isArray(
      analysisResult.evaluation?.strengths
    )
      ? analysisResult.evaluation.strengths.join(", ")
      : analysisResult.evaluation?.strengths || "";

    const transformedGaps = Array.isArray(analysisResult.evaluation?.gaps)
      ? analysisResult.evaluation.gaps.join(", ")
      : analysisResult.evaluation?.gaps || "";

    console.log("📝 Transformed strengths:", transformedStrengths);
    console.log("📝 Transformed gaps:", transformedGaps);

    const cvAnalysis = {
      name: analysisResult.personalInfo?.name || "غير محدد",
      email: analysisResult.personalInfo?.email || "",
      phone: analysisResult.personalInfo?.phone || "",
      city: analysisResult.personalInfo?.city || "",
      dateOfBirth: analysisResult.personalInfo?.dateOfBirth || "",
      skills: transformedSkills,
      summary: analysisResult.summary || "",
      education: analysisResult.education || "",
      jobHistory: analysisResult.jobHistory || "",
      consideration: analysisResult.evaluation?.consideration || "",
      strengths: transformedStrengths,
      gaps: transformedGaps,
      vote: analysisResult.evaluation?.vote || "0",
      analysisDate: new Date().toISOString(),
      ranking: 1,
    };

    console.log("✅ Transformed CV analysis structure:");
    console.log("Final CV analysis:", JSON.stringify(cvAnalysis, null, 2));

    // Step 4: Deduct credits from user account
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
          credits: currentCredits - cvAnalysisCost,
          total_analyses: userProfiles[0].total_analyses
            ? userProfiles[0].total_analyses + 1
            : 1,
        }),
      }
    );

    if (!updateCreditsResponse.ok) {
      throw new Error("فشل في تحديث رصيد الكريدت");
    }

    // Step 5: Record credit transaction
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
        credits_amount: -cvAnalysisCost,
        description: `تحليل السيرة الذاتية - ${jobTitle}`,
      }),
    });

    // Step 6: Save CV analysis results
    console.log("💾 Saving CV analysis to database...");
    const analysisData = {
      user_id: actualUserId,
      job_title: jobTitle,
      job_description: jobDescription,
      required_skills: skillsRequired
        ? skillsRequired.split(",").map((s) => s.trim())
        : [],
      file_count: cvFile ? 1 : 0,
      results: [cvAnalysis],
      credits_cost: cvAnalysisCost,
      status: "completed",
      created_at: new Date().toISOString(),
    };

    console.log(
      "📊 Analysis data to save:",
      JSON.stringify(analysisData, null, 2)
    );

    try {
      const saveResponse = await fetch(`${supabaseUrl}/rest/v1/cv_analyses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analysisData),
      });

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error(
          "❌ Failed to save CV analysis:",
          saveResponse.status,
          errorText
        );
        throw new Error(`فشل في حفظ نتائج التحليل: ${saveResponse.status}`);
      }

      const saveResult = await saveResponse.json();
      console.log("✅ CV analysis saved successfully:", saveResult);
    } catch (saveError) {
      console.error("❌ Error saving CV analysis:", saveError);
      // Don't throw error here, just log it so the analysis still returns
    }

    console.log("✅ CV analysis completed successfully");

    return new Response(
      JSON.stringify({
        data: {
          cvAnalysis: [cvAnalysis],
          creditsUsed: cvAnalysisCost,
          remainingCredits: currentCredits - cvAnalysisCost,
          rawAnalysis: analysisResult, // Include raw analysis for debugging
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("خطأ في تحليل السيرة الذاتية:", error);
    const errorResponse = {
      error: {
        code: "CV_ANALYSIS_FAILED",
        message: error.message,
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 200, // Always return 200 to avoid supabase.functions.invoke issue
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
