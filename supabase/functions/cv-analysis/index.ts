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

    // Debug: Log the raw request body
    console.log(
      "🔍 Raw request body received:",
      requestBody.substring(0, 500) + "..."
    );
    console.log("🔍 Parsed bodyData keys:", Object.keys(bodyData));
    console.log("🔍 bodyData type:", typeof bodyData);

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

    // Extract data from request - support both single and multiple CVs
    const {
      cvFile,
      cvText,
      cvFiles,
      cvTexts,
      jobTitle,
      jobDescription,
      skillsRequired,
      userId,
    } = bodyData;

    // Debug logging
    console.log("🔍 Backend received data:");
    console.log("- cvFile:", cvFile ? "present" : "not present");
    console.log("- cvText:", cvText ? "present" : "not present");
    console.log(
      "- cvFiles:",
      cvFiles ? `array with ${cvFiles.length} items` : "not present"
    );
    console.log(
      "- cvTexts:",
      cvTexts ? `array with ${cvTexts.length} items` : "not present"
    );
    console.log("- jobTitle:", jobTitle);
    console.log("- skillsRequired:", skillsRequired);

    // Normalize CV inputs to arrays for consistent processing
    let cvFilesArray: string[] = [];
    let cvTextsArray: string[] = [];

    // Handle single CV inputs (backward compatibility)
    if (cvFile) {
      cvFilesArray = [cvFile];
      console.log("✅ Added single cvFile to cvFilesArray");
    }
    if (cvText) {
      cvTextsArray = [cvText];
      console.log("✅ Added single cvText to cvTextsArray");
    }

    // Handle multiple CV inputs
    if (cvFiles && Array.isArray(cvFiles)) {
      cvFilesArray = cvFiles;
      console.log(
        "✅ Added cvFiles array to cvFilesArray:",
        cvFiles.length,
        "files"
      );
    }
    if (cvTexts && Array.isArray(cvTexts)) {
      cvTextsArray = cvTexts;
      console.log(
        "✅ Added cvTexts array to cvTextsArray:",
        cvTexts.length,
        "texts"
      );
    }

    // Combine all CV inputs
    const totalCvs = cvFilesArray.length + cvTextsArray.length;
    console.log("📊 Total CVs calculated:", totalCvs);
    console.log("- cvFilesArray length:", cvFilesArray.length);
    console.log("- cvTextsArray length:", cvTextsArray.length);

    // Validate required fields - at least one CV must be provided
    if (totalCvs === 0) {
      console.log("❌ Validation failed: No CVs found");
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

    console.log(`📊 Processing ${totalCvs} CV(s)...`);

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
    const cvAnalysisCost = 5; // Cost per CV analysis
    const totalCost = cvAnalysisCost * totalCvs;

    if (currentCredits < totalCost) {
      throw new Error(
        `رصيد الكريدت غير كافي لتحليل ${totalCvs} سيرة ذاتية. المطلوب: ${totalCost}، المتوفر: ${currentCredits}`
      );
    }

    console.log(`✅ Sufficient credits available for ${totalCvs} CV(s)`);

    // Process all CVs
    const allCvAnalyses: any[] = [];
    let processedCount = 0;

    // Process CV files
    for (let i = 0; i < cvFilesArray.length; i++) {
      const cvFile = cvFilesArray[i];
      console.log(`📄 Processing CV file ${i + 1}/${cvFilesArray.length}...`);

      try {
        const cvAnalysis = await processSingleCV(
          cvFile,
          null,
          jobTitle,
          jobDescription,
          skillsRequired,
          openaiApiKey,
          i + 1
        );
        allCvAnalyses.push(cvAnalysis);
        processedCount++;
        console.log(`✅ CV file ${i + 1} processed successfully`);
      } catch (error) {
        console.error(`❌ Failed to process CV file ${i + 1}:`, error);
        // Continue with other CVs even if one fails
        allCvAnalyses.push({
          name: `CV File ${i + 1}`,
          email: "",
          phone: "",
          city: "",
          dateOfBirth: "",
          skills: "",
          summary: `فشل في معالجة الملف: ${error.message}`,
          education: "",
          jobHistory: "",
          consideration: "فشل في التحليل",
          strengths: "",
          gaps: "",
          vote: "0",
          analysisDate: new Date().toISOString(),
          ranking: i + 1,
        });
      }
    }

    // Process CV texts
    for (let i = 0; i < cvTextsArray.length; i++) {
      const cvText = cvTextsArray[i];
      console.log(`📝 Processing CV text ${i + 1}/${cvTextsArray.length}...`);

      try {
        const cvAnalysis = await processSingleCV(
          null,
          cvText,
          jobTitle,
          jobDescription,
          skillsRequired,
          openaiApiKey,
          cvFilesArray.length + i + 1
        );
        allCvAnalyses.push(cvAnalysis);
        processedCount++;
        console.log(`✅ CV text ${i + 1} processed successfully`);
      } catch (error) {
        console.error(`❌ Failed to process CV text ${i + 1}:`, error);
        // Continue with other CVs even if one fails
        allCvAnalyses.push({
          name: `CV Text ${i + 1}`,
          email: "",
          phone: "",
          city: "",
          dateOfBirth: "",
          skills: "",
          summary: `فشل في معالجة النص: ${error.message}`,
          education: "",
          jobHistory: "",
          consideration: "فشل في التحليل",
          strengths: "",
          gaps: "",
          vote: "0",
          analysisDate: new Date().toISOString(),
          ranking: cvFilesArray.length + i + 1,
        });
      }
    }

    console.log(
      `✅ Successfully processed ${processedCount}/${totalCvs} CV(s)`
    );

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
          credits: currentCredits - totalCost,
          total_analyses: userProfiles[0].total_analyses
            ? userProfiles[0].total_analyses + totalCvs
            : totalCvs,
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
        credits_amount: -totalCost,
        description: `تحليل ${totalCvs} سيرة ذاتية - ${jobTitle}`,
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
      file_count: totalCvs,
      results: allCvAnalyses,
      credits_cost: totalCost,
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
          cvAnalysis: allCvAnalyses,
          creditsUsed: totalCost,
          remainingCredits: currentCredits - totalCost,
          totalCvsProcessed: totalCvs,
          successfulCvs: processedCount,
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

// Helper function to process a single CV
async function processSingleCV(
  cvFile,
  cvText,
  jobTitle,
  jobDescription,
  skillsRequired,
  openaiApiKey,
  ranking
) {
  // Step 1: Extract text from document
  console.log(`📄 Extracting text from CV ${ranking}...`);
  let extractedText;

  // Check if the input is already text (user might have pasted CV text directly)
  if (cvText) {
    console.log(`Using provided CV text directly for CV ${ranking}`);
    extractedText = cvText;
  } else if (cvFile) {
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

      console.log(`Detected file type for CV ${ranking}:`, fileType);

      if (fileType === "pdf") {
        console.log(`Processing PDF file for CV ${ranking}...`);

        // Method 1: Try OpenAI Vision API first (works with many PDFs)
        try {
          console.log(`Trying OpenAI Vision API for PDF CV ${ranking}...`);
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
                `✅ PDF text extraction successful using OpenAI Vision (gpt-4o) for CV ${ranking}`
              );
              console.log(
                `Extracted text length for CV ${ranking}:`,
                extractedText.length
              );
            } else {
              throw new Error("Vision API returned insufficient text");
            }
          } else {
            throw new Error("Vision API failed");
          }
        } catch (visionError) {
          console.log(
            `OpenAI Vision failed for CV ${ranking}, trying alternative methods...`
          );

          // Method 2: Try unpdf library (works well with Deno)
          try {
            console.log(`Trying unpdf library for CV ${ranking}...`);
            const { extractText } = await import("https://esm.sh/unpdf@0.11.0");

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
              console.log(
                `✅ PDF text extraction successful using unpdf for CV ${ranking}`
              );
              console.log(
                `Extracted text length for CV ${ranking}:`,
                extractedText.length
              );
            } else {
              throw new Error("unpdf returned empty text");
            }
          } catch (unpdfError) {
            console.log(`unpdf failed for CV ${ranking}, trying pdf_parser...`);

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
                    `✅ PDF text extraction successful using pdf_parser for CV ${ranking}`
                  );
                  console.log(
                    `Extracted text length for CV ${ranking}:`,
                    extractedText.length
                  );
                } else {
                  throw new Error("pdf_parser returned empty text");
                }
              } else {
                throw new Error("pdf_parser returned no data");
              }
            } catch (parserError) {
              console.log(
                `pdf_parser failed for CV ${ranking}, trying JSR pdftext...`
              );

              // Method 4: Try JSR @pdf/pdftext
              try {
                const { extractText } = await import("jsr:@pdf/pdftext@0.1.0");

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
                    `✅ PDF text extraction successful using JSR pdftext for CV ${ranking}`
                  );
                  console.log(
                    `Extracted text length for CV ${ranking}:`,
                    extractedText.length
                  );
                } else {
                  throw new Error("JSR pdftext returned empty text");
                }
              } catch (jsrError) {
                console.error(
                  `All PDF extraction methods failed for CV ${ranking}`
                );
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
        console.log(
          `Processing image file with OpenAI Vision API for CV ${ranking}...`
        );
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
          `✅ Image text extraction successful using OpenAI Vision for CV ${ranking}`
        );
        console.log(
          `Extracted text length for CV ${ranking}:`,
          extractedText.length
        );
      } else {
        throw new Error(
          "نوع الملف غير مدعوم. يرجى استخدام ملف PDF أو صورة (JPG/PNG) أو إدخال النص مباشرة."
        );
      }
    } catch (extractionError) {
      console.error(
        `Document extraction error for CV ${ranking}:`,
        extractionError
      );
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
  console.log(`🔍 Analyzing CV ${ranking}...`);
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
        `🧹 Cleaned analysis text for CV ${ranking}:`,
        cleanAnalysisText.substring(0, 200) + "..."
      );

      analysisResult = JSON.parse(cleanAnalysisText);
      console.log(`✅ JSON parsing successful for CV ${ranking}`);
      console.log(`📊 Analysis Result Structure for CV ${ranking}:`);
      console.log(
        `Full analysis result for CV ${ranking}:`,
        JSON.stringify(analysisResult, null, 2)
      );
      console.log(
        `Skills type for CV ${ranking}:`,
        typeof analysisResult.skills
      );
      console.log(`Skills value for CV ${ranking}:`, analysisResult.skills);
      console.log(
        `Skills is array for CV ${ranking}:`,
        Array.isArray(analysisResult.skills)
      );
      console.log(
        `Personal info for CV ${ranking}:`,
        analysisResult.personalInfo
      );
      console.log(`Evaluation for CV ${ranking}:`, analysisResult.evaluation);
    } catch (parseError) {
      console.error(
        `Failed to parse analysis result for CV ${ranking}:`,
        parseError
      );
      console.error(`Raw analysis text for CV ${ranking}:`, analysisText);
      throw new Error("تنسيق استجابة التحليل غير صحيح");
    }

    console.log(`✅ CV analysis successful for CV ${ranking}`);
  } catch (analysisError) {
    console.error(`CV analysis error for CV ${ranking}:`, analysisError);
    throw new Error(`فشل في تحليل السيرة الذاتية: ${analysisError.message}`);
  }

  // Step 3: Transform analysis to our expected format
  console.log(
    `🔄 Transforming analysis result to expected format for CV ${ranking}...`
  );
  const transformedSkills = Array.isArray(analysisResult.skills)
    ? analysisResult.skills.join(", ")
    : typeof analysisResult.skills === "object"
    ? JSON.stringify(analysisResult.skills).replace(/[{}"]/g, "")
    : analysisResult.skills || "";

  console.log(`📝 Transformed skills for CV ${ranking}:`, transformedSkills);
  console.log(
    `📝 Transformed skills type for CV ${ranking}:`,
    typeof transformedSkills
  );

  // Transform strengths and gaps to handle arrays
  const transformedStrengths = Array.isArray(
    analysisResult.evaluation?.strengths
  )
    ? analysisResult.evaluation.strengths.join(", ")
    : analysisResult.evaluation?.strengths || "";

  const transformedGaps = Array.isArray(analysisResult.evaluation?.gaps)
    ? analysisResult.evaluation.gaps.join(", ")
    : analysisResult.evaluation?.gaps || "";

  console.log(
    `📝 Transformed strengths for CV ${ranking}:`,
    transformedStrengths
  );
  console.log(`📝 Transformed gaps for CV ${ranking}:`, transformedGaps);

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
    ranking: ranking,
  };

  console.log(`✅ Transformed CV analysis structure for CV ${ranking}:`);
  console.log(
    `Final CV analysis for CV ${ranking}:`,
    JSON.stringify(cvAnalysis, null, 2)
  );

  return cvAnalysis;
}
