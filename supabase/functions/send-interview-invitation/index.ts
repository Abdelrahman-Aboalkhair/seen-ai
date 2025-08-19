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
      <title>دعوة للمقابلة - SEEN AI</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #e2e8f0;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: linear-gradient(145deg, #1e293b 0%, #334155 100%);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid #475569;
        }
        
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
          opacity: 0.3;
        }
        
        .logo {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #1e293b;
          font-weight: bold;
        }
        
        .logo-text {
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .header-title {
          position: relative;
          z-index: 2;
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .header-subtitle {
          position: relative;
          z-index: 2;
          font-size: 16px;
          color: #cbd5e1;
          opacity: 0.9;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .greeting {
          font-size: 18px;
          color: #f1f5f9;
          margin-bottom: 25px;
          font-weight: 600;
        }
        
        .description {
          font-size: 16px;
          color: #cbd5e1;
          margin-bottom: 30px;
          line-height: 1.7;
        }
        
        .job-card {
          background: linear-gradient(135deg, #475569 0%, #64748b 100%);
          border-radius: 16px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
          border: 1px solid #64748b;
          position: relative;
          overflow: hidden;
        }
        
        .job-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
        }
        
        .job-title {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 10px;
        }
        
        .job-subtitle {
          font-size: 14px;
          color: #cbd5e1;
          opacity: 0.8;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 30px 0;
        }
        
        .detail-item {
          background: linear-gradient(135deg, #334155 0%, #475569 100%);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          border: 1px solid #64748b;
          transition: transform 0.2s ease;
        }
        
        .detail-item:hover {
          transform: translateY(-2px);
        }
        
        .detail-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          font-size: 18px;
          color: #ffffff;
        }
        
        .detail-label {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .detail-value {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
        }
        
        .cta-section {
          text-align: center;
          margin: 35px 0;
        }
        
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
          color: #ffffff;
          padding: 18px 40px;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          text-align: center;
          transition: all 0.3s ease;
          box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
          border: none;
          position: relative;
          overflow: hidden;
        }
        
        .cta-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        
        .cta-button:hover::before {
          left: 100%;
        }
        
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px -5px rgba(16, 185, 129, 0.5);
        }
        
        .warning-section {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          border-radius: 16px;
          padding: 25px;
          margin: 30px 0;
          border: 1px solid #ef4444;
          position: relative;
          overflow: hidden;
        }
        
        .warning-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="warning" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23warning)"/></svg>');
          opacity: 0.2;
        }
        
        .warning-title {
          position: relative;
          z-index: 2;
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .warning-icon {
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: #ffffff;
        }
        
        .warning-list {
          position: relative;
          z-index: 2;
          list-style: none;
          padding: 0;
        }
        
        .warning-list li {
          color: #fecaca;
          margin-bottom: 8px;
          padding-right: 20px;
          position: relative;
          font-size: 14px;
        }
        
        .warning-list li::before {
          content: '⚠️';
          position: absolute;
          right: 0;
          top: 0;
        }
        
        .footer {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 30px;
          text-align: center;
          border-top: 1px solid #334155;
        }
        
        .footer-content {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .footer-divider {
          width: 50px;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          margin: 15px auto;
          border-radius: 1px;
        }
        
        .social-links {
          margin-top: 20px;
        }
        
        .social-link {
          display: inline-block;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #475569 0%, #64748b 100%);
          border-radius: 8px;
          margin: 0 5px;
          text-decoration: none;
          color: #cbd5e1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .social-link:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: #ffffff;
          transform: translateY(-2px);
        }
        
        @media (max-width: 600px) {
          .email-container {
            margin: 10px;
            border-radius: 15px;
          }
          
          .header {
            padding: 30px 20px;
          }
          
          .content {
            padding: 30px 20px;
          }
          
          .details-grid {
            grid-template-columns: 1fr;
          }
          
          .cta-button {
            padding: 16px 30px;
            font-size: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">
            <div class="logo-icon">🧠</div>
            <div class="logo-text">SEEN AI</div>
          </div>
          <div class="header-title">دعوة للمقابلة</div>
          <div class="header-subtitle">منصة ذكية لاكتشاف وتحليل المواهب</div>
        </div>
        
        <div class="content">
          <div class="greeting">مرحباً ${candidateName}،</div>
          
          <div class="description">
            نشكرك على اهتمامك بالانضمام إلى فريقنا. نود دعوتك لإجراء مقابلة ذكية عبر الإنترنت باستخدام أحدث تقنيات الذكاء الاصطناعي للوظيفة التالية:
          </div>
          
          <div class="job-card">
            <div class="job-title">${jobTitle}</div>
            <div class="job-subtitle">مقابلة ذكية باستخدام الذكاء الاصطناعي</div>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-icon">🎯</div>
              <div class="detail-label">نوع المقابلة</div>
              <div class="detail-value">ذكية</div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">⏱️</div>
              <div class="detail-label">المدة المتوقعة</div>
              <div class="detail-value">${durationMinutes} دقيقة</div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">🔗</div>
              <div class="detail-label">صحة الرابط</div>
              <div class="detail-value">7 أيام</div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">🤖</div>
              <div class="detail-label">تحليل ذكي</div>
              <div class="detail-value">AI</div>
            </div>
          </div>
          
          <div class="cta-section">
            <a href="${interviewLink}" class="cta-button">
              🚀 بدء المقابلة الذكية الآن
            </a>
          </div>
          
          <div class="warning-section">
            <div class="warning-title">
              <div class="warning-icon">⚠️</div>
              ملاحظات مهمة
            </div>
            <ul class="warning-list">
              <li>تأكد من وجود اتصال إنترنت مستقر</li>
              <li>احضر في بيئة هادئة ومناسبة</li>
              <li>الرابط صالح لمدة 7 أيام فقط</li>
              <li>لا يمكنك إعادة المحاولة بعد بدء المقابلة</li>
              <li>سيتم تحليل إجاباتك باستخدام الذكاء الاصطناعي</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <p style="color: #cbd5e1; font-size: 16px; margin-bottom: 15px;">
              إذا واجهت أي مشكلة في الوصول إلى الرابط، يرجى التواصل معنا فوراً.
            </p>
            <p style="color: #f1f5f9; font-size: 18px; font-weight: 600;">
              نتمنى لك التوفيق! 🎉
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 1px solid #475569;">
            <p style="color: #cbd5e1; font-size: 16px; font-weight: 600;">
              مع تحيات،<br>
              <span style="color: #3b82f6; font-weight: 700;">فريق SEEN AI</span>
            </p>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <p>هذا البريد الإلكتروني تم إرساله تلقائياً من منصة SEEN AI</p>
            <div class="footer-divider"></div>
            <p>منصة ذكية لاكتشاف وتحليل المواهب باستخدام الذكاء الاصطناعي</p>
            <p style="margin-top: 15px; font-size: 12px; color: #64748b;">
              لا ترد على هذا البريد الإلكتروني
            </p>
          </div>
          
          <div class="social-links">
            <a href="#" class="social-link">🌐</a>
            <a href="#" class="social-link">📧</a>
            <a href="#" class="social-link">📱</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    دعوة للمقابلة - SEEN AI
    منصة ذكية لاكتشاف وتحليل المواهب
    
    مرحباً ${candidateName}،
    
    نشكرك على اهتمامك بالانضمام إلى فريقنا. نود دعوتك لإجراء مقابلة ذكية عبر الإنترنت باستخدام أحدث تقنيات الذكاء الاصطناعي للوظيفة التالية:
    
    ${jobTitle}
    
    تفاصيل المقابلة:
    - نوع المقابلة: مقابلة ذكية باستخدام الذكاء الاصطناعي
    - المدة المتوقعة: ${durationMinutes} دقيقة
    - صحة الرابط: 7 أيام
    - التحليل: ذكي باستخدام AI
    
    رابط المقابلة: ${interviewLink}
    
    ملاحظات مهمة:
    - تأكد من وجود اتصال إنترنت مستقر
    - احضر في بيئة هادئة ومناسبة
    - الرابط صالح لمدة 7 أيام فقط
    - لا يمكنك إعادة المحاولة بعد بدء المقابلة
    - سيتم تحليل إجاباتك باستخدام الذكاء الاصطناعي
    
    إذا واجهت أي مشكلة في الوصول إلى الرابط، يرجى التواصل معنا فوراً.
    
    نتمنى لك التوفيق!
    
    مع تحيات،
    فريق SEEN AI
    
    ---
    منصة ذكية لاكتشاف وتحليل المواهب باستخدام الذكاء الاصطناعي
    هذا البريد الإلكتروني تم إرساله تلقائياً من منصة SEEN AI
    لا ترد على هذا البريد الإلكتروني
  `;

  return { html, text };
}
