import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body
    const bodyData = await req.json();
    const { interviewId, answers } = bodyData;

    // Validate required fields
    if (!interviewId) {
      throw new Error("Interview ID is required");
    }

    if (!answers || typeof answers !== "object") {
      throw new Error("Answers are required");
    }

    console.log("Saving answers for interview:", interviewId);
    console.log("Answers:", answers);

    // Get current timestamp
    const now = new Date().toISOString();

    // Save answers to database
    const answersToSave = Object.entries(answers).map(
      ([questionId, answer]) => ({
        interview_id: interviewId,
        question_id: questionId,
        answer_text: answer as string,
        submitted_at: now,
      })
    );

    const { error: saveError } = await supabase
      .from("interview_answers")
      .insert(answersToSave);

    if (saveError) {
      console.error("Error saving answers:", saveError);
      throw new Error("Failed to save answers");
    }

    // Update interview status to completed
    const { error: updateError } = await supabase
      .from("interviews")
      .update({
        status: "completed",
        updated_at: now,
      })
      .eq("id", interviewId);

    if (updateError) {
      console.error("Error updating interview status:", updateError);
      // Don't throw error here as answers were saved successfully
    }

    console.log("✅ Answers saved successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Answers saved successfully",
        data: {
          savedAnswers: answersToSave.length,
          interviewId,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Save Interview Answers error:", error);

    const errorResponse = {
      success: false,
      error: {
        code: "SAVE_ANSWERS_ERROR",
        message:
          error.message || "An unexpected error occurred while saving answers",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
