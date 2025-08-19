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
    const {
      jobTitle,
      jobDescription,
      requiredSkills,
      testLevel,
      testType,
      languageProficiency,
      numberOfQuestions,
      durationMinutes,
    } = await req.json();

    // Validate input
    if (!jobTitle || !testType || !numberOfQuestions) {
      throw new Error(
        "Job title, test type, and number of questions are required"
      );
    }

    if (numberOfQuestions < 1 || numberOfQuestions > 30) {
      throw new Error("Number of questions must be between 1 and 30");
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get("OPENAI_API");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Create prompt based on test type
    const prompt = createPromptForTestType({
      jobTitle,
      jobDescription,
      requiredSkills,
      testLevel,
      testType,
      languageProficiency,
      numberOfQuestions,
    });

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert HR interviewer and assessment specialist. Generate high-quality interview questions based on the provided specifications.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the response to extract questions
    const questions = parseQuestionsFromResponse(content, testType);

    return new Response(
      JSON.stringify({
        success: true,
        questions: questions,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating questions:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function createPromptForTestType({
  jobTitle,
  jobDescription,
  requiredSkills,
  testLevel,
  testType,
  languageProficiency,
  numberOfQuestions,
}: {
  jobTitle: string;
  jobDescription?: string;
  requiredSkills?: string[];
  testLevel: string;
  testType: string;
  languageProficiency?: string;
  numberOfQuestions: number;
}) {
  const basePrompt = `Generate ${numberOfQuestions} interview questions for a ${testLevel} level ${testType} test for the position: ${jobTitle}`;

  let specificPrompt = "";

  switch (testType) {
    case "iq":
      specificPrompt = `
        Generate logical, mathematical, and verbal reasoning multiple-choice questions.
        Each question should have:
        - Question text
        - 4 multiple choice options (A, B, C, D)
        - Correct answer
        - Brief explanation
        - Skill being measured (logical reasoning, mathematical ability, verbal comprehension)
        
        Make questions appropriate for ${testLevel} level and relevant to ${jobTitle} role.
      `;
      break;

    case "psychometric":
      specificPrompt = `
        Generate personality assessment questions based on Big 5 personality traits.
        Each question should have:
        - Question text (situational or behavioral)
        - Expected response pattern
        - Personality trait being measured (openness, conscientiousness, extraversion, agreeableness, neuroticism)
        - Interpretation guidelines
        
        Focus on workplace scenarios relevant to ${jobTitle}.
      `;
      break;

    case "competency":
      specificPrompt = `
        Generate job-related skill assessment questions.
        Each question should have:
        - Question text (situational or practical)
        - Expected ideal answer
        - Competency being measured
        - Scoring criteria
        
        Focus on skills: ${requiredSkills?.join(", ") || "general job skills"}.
      `;
      break;

    case "eq":
      specificPrompt = `
        Generate emotional intelligence assessment questions.
        Each question should have:
        - Situational question text
        - Expected response showing high EQ
        - EQ component being measured (self-awareness, self-regulation, motivation, empathy, social skills)
        - Behavioral indicators
        
        Focus on workplace scenarios relevant to ${jobTitle}.
      `;
      break;

    case "sjt":
      specificPrompt = `
        Generate situational judgment test questions.
        Each question should have:
        - Workplace scenario description
        - 4 response options
        - Best and worst options identified
        - Explanation for each option
        - Decision-making skill being measured
        
        Scenarios should be relevant to ${jobTitle} role.
      `;
      break;

    case "technical":
      specificPrompt = `
        Generate technical skills assessment questions.
        Each question should have:
        - Technical question or problem
        - Expected solution or answer
        - Technical skill being measured
        - Difficulty level appropriate for ${testLevel}
        
        Focus on technical skills relevant to ${jobTitle}.
      `;
      break;

    case "language":
      specificPrompt = `
        Generate language proficiency questions in ${
          languageProficiency || "English"
        }.
        Each question should have:
        - Question text in ${languageProficiency || "English"}
        - Correct answer
        - Language skill being measured (grammar, vocabulary, comprehension, business communication)
        - Difficulty level appropriate for ${testLevel}
        
        Questions should be business/professional context relevant to ${jobTitle}.
      `;
      break;

    case "biometric":
      specificPrompt = `
        Generate open-ended behavioral questions for biometric analysis.
        Each question should have:
        - Open-ended question text
        - Expected response patterns
        - Behavioral traits to analyze (confidence, stress, honesty, focus)
        - Analysis guidelines
        
        Questions should elicit detailed responses for behavioral analysis.
      `;
      break;

    default:
      specificPrompt = `
        Generate general interview questions.
        Each question should have:
        - Question text
        - Expected answer
        - Skill being measured
        - Relevance to ${jobTitle}
      `;
  }

  return `${basePrompt}

${specificPrompt}

${jobDescription ? `Job Description: ${jobDescription}` : ""}
${requiredSkills?.length ? `Required Skills: ${requiredSkills.join(", ")}` : ""}

Please format your response as a JSON array of objects with the following structure:
[
  {
    "questionText": "Question text here",
    "modelAnswer": "Expected answer or explanation",
    "skillMeasured": "Skill or trait being measured"
  }
]`;
}

function parseQuestionsFromResponse(content: string, testType: string) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      return questions.map((q: any, index: number) => ({
        questionText: q.questionText || q.question || `Question ${index + 1}`,
        modelAnswer: q.modelAnswer || q.answer || q.expectedAnswer || "",
        skillMeasured: q.skillMeasured || q.skill || q.trait || "general",
      }));
    }

    // Fallback: parse manually if JSON extraction fails
    const lines = content.split("\n").filter((line) => line.trim());
    const questions = [];

    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 < lines.length) {
        questions.push({
          questionText: lines[i].replace(/^\d+\.\s*/, ""),
          modelAnswer: lines[i + 1].replace(/^Answer:\s*/, ""),
          skillMeasured: lines[i + 2].replace(/^Skill:\s*/, "") || "general",
        });
      }
    }

    return questions;
  } catch (error) {
    console.error("Error parsing questions:", error);
    // Return a fallback question
    return [
      {
        questionText: `Please describe your experience with ${testType} in the context of this role.`,
        modelAnswer:
          "A comprehensive response showing relevant experience and skills.",
        skillMeasured: testType,
      },
    ];
  }
}
