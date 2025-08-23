import { createEmailContent } from "./email-template.ts";

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
      candidateEmail,
      candidateName,
      interviewLink,
      jobTitle,
      durationMinutes,
    } = await req.json();

    // Validate input
    if (!candidateEmail || !candidateName || !interviewLink || !jobTitle) {
      throw new Error(
        "Candidate email, name, interview link, and job title are required"
      );
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      // For development/testing, log the email details instead of sending
      console.log("=== INTERVIEW INVITATION EMAIL (DEV MODE) ===");
      console.log("To:", candidateEmail);
      console.log("Name:", candidateName);
      console.log("Job Title:", jobTitle);
      console.log("Duration:", durationMinutes, "minutes");
      console.log("Interview Link:", interviewLink);
      console.log("=============================================");

      return new Response(
        JSON.stringify({
          success: true,
          messageId: "dev-mode-" + Date.now(),
          message:
            "Email logged in development mode (RESEND_API_KEY not configured)",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create email content
    const emailContent = createEmailContent({
      candidateName,
      interviewLink,
      jobTitle,
      durationMinutes,
    });

    // Send email using Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SmartRecruiter <onboarding@resend.dev>",
        to: candidateEmail,
        subject: `مقابلة جديدة - ${jobTitle}`,
        html: emailContent.html,
        text: emailContent.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending interview invitation:", error);
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
