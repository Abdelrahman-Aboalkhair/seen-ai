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
        from: "SmartRecruiter <noreply@smartrecruiter.com>",
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

function createEmailContent({
  candidateName,
  interviewLink,
  jobTitle,
  durationMinutes,
}: {
  candidateName: string;
  interviewLink: string;
  jobTitle: string;
  durationMinutes: number;
}) {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>دعوة للمقابلة</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .title {
          font-size: 20px;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .content {
          margin-bottom: 30px;
        }
        .job-title {
          background-color: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
          font-weight: bold;
          color: #374151;
        }
        .details {
          background-color: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-item:last-child {
          border-bottom: none;
        }
        .cta-button {
          display: inline-block;
          background-color: #2563eb;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          transition: background-color 0.3s;
        }
        .cta-button:hover {
          background-color: #1d4ed8;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          color: #6b7280;
          font-size: 14px;
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">SmartRecruiter</div>
          <div class="title">دعوة للمقابلة</div>
        </div>
        
        <div class="content">
          <p>مرحباً ${candidateName}،</p>
          
          <p>نشكرك على اهتمامك بالانضمام إلى فريقنا. نود دعوتك لإجراء مقابلة عبر الإنترنت للوظيفة التالية:</p>
          
          <div class="job-title">
            ${jobTitle}
          </div>
          
          <div class="details">
            <div class="detail-item">
              <span>نوع المقابلة:</span>
              <span>مقابلة عبر الإنترنت</span>
            </div>
            <div class="detail-item">
              <span>المدة المتوقعة:</span>
              <span>${durationMinutes} دقيقة</span>
            </div>
            <div class="detail-item">
              <span>صحة الرابط:</span>
              <span>7 أيام</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${interviewLink}" class="cta-button">
              بدء المقابلة الآن
            </a>
          </div>
          
          <div class="warning">
            <strong>ملاحظة مهمة:</strong>
            <ul style="margin: 10px 0; padding-right: 20px;">
              <li>تأكد من وجود اتصال إنترنت مستقر</li>
              <li>احضر في بيئة هادئة ومناسبة</li>
              <li>الرابط صالح لمدة 7 أيام فقط</li>
              <li>لا يمكنك إعادة المحاولة بعد بدء المقابلة</li>
            </ul>
          </div>
          
          <p>إذا واجهت أي مشكلة في الوصول إلى الرابط، يرجى التواصل معنا فوراً.</p>
          
          <p>نتمنى لك التوفيق!</p>
          
          <p>مع تحيات،<br>فريق الموارد البشرية</p>
        </div>
        
        <div class="footer">
          <p>هذا البريد الإلكتروني تم إرساله تلقائياً من نظام SmartRecruiter</p>
          <p>لا ترد على هذا البريد الإلكتروني</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    دعوة للمقابلة - SmartRecruiter
    
    مرحباً ${candidateName}،
    
    نشكرك على اهتمامك بالانضمام إلى فريقنا. نود دعوتك لإجراء مقابلة عبر الإنترنت للوظيفة التالية:
    
    ${jobTitle}
    
    تفاصيل المقابلة:
    - نوع المقابلة: مقابلة عبر الإنترنت
    - المدة المتوقعة: ${durationMinutes} دقيقة
    - صحة الرابط: 7 أيام
    
    رابط المقابلة: ${interviewLink}
    
    ملاحظات مهمة:
    - تأكد من وجود اتصال إنترنت مستقر
    - احضر في بيئة هادئة ومناسبة
    - الرابط صالح لمدة 7 أيام فقط
    - لا يمكنك إعادة المحاولة بعد بدء المقابلة
    
    إذا واجهت أي مشكلة في الوصول إلى الرابط، يرجى التواصل معنا فوراً.
    
    نتمنى لك التوفيق!
    
    مع تحيات،
    فريق الموارد البشرية
    
    ---
    هذا البريد الإلكتروني تم إرساله تلقائياً من نظام SmartRecruiter
    لا ترد على هذا البريد الإلكتروني
  `;

  return { html, text };
}
