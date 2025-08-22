export interface EmailContentParams {
  candidateName: string;
  interviewLink: string;
  jobTitle: string;
  durationMinutes: number;
}

export interface EmailContent {
  html: string;
  text: string;
}

export function createEmailContent({
  candidateName,
  interviewLink,
  jobTitle,
  durationMinutes,
}: EmailContentParams): EmailContent {
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: #1f2937;
            background-color: #f9fafb;
            padding: 20px;
          }
          
          .container {
            max-width: 560px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: #2563eb;
            padding: 32px 24px;
            text-align: center;
          }
          
          .logo {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
          }
          
          .logo-icon {
            width: 32px;
            height: 32px;
            background: #ffffff;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
          }
          
          .logo-text {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
          }
          
          .header-title {
            font-size: 24px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 8px;
          }
          
          .header-subtitle {
            font-size: 16px;
            color: #dbeafe;
          }
          
          .content {
            padding: 32px 24px;
          }
          
          .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
          }
          
          .description {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 24px;
          }
          
          .job-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
          }
          
          .job-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
          }
          
          .job-subtitle {
            font-size: 14px;
            color: #6b7280;
          }
          
          .details {
            display: flex;
            justify-content: space-between;
            margin: 24px 0;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
          }
          
          .detail-item {
            text-align: center;
            flex: 1;
          }
          
          .detail-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .detail-value {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
          }
          
          .cta-button {
            display: block;
            width: 100%;
            background: #10b981;
            color: #ffffff;
            padding: 16px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 32px 0;
            transition: background-color 0.2s;
          }
          
          .cta-button:hover {
            background: #059669;
          }
          
          .warning {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
          }
          
          .warning-title {
            font-size: 14px;
            font-weight: 600;
            color: #dc2626;
            margin-bottom: 8px;
          }
          
          .warning-list {
            font-size: 14px;
            color: #7f1d1d;
            list-style: none;
            padding: 0;
          }
          
          .warning-list li {
            margin-bottom: 4px;
            padding-right: 16px;
            position: relative;
          }
          
          .warning-list li::before {
            content: '•';
            position: absolute;
            right: 0;
            color: #dc2626;
            font-weight: 600;
          }
          
          .support-text {
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            margin: 24px 0;
          }
          
          .footer {
            background: #f8fafc;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          
          .footer-text {
            font-size: 14px;
            color: #6b7280;
          }
          
          .brand {
            color: #2563eb;
            font-weight: 600;
          }
          
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            
            .container {
              border-radius: 8px;
            }
            
            .header {
              padding: 24px 16px;
            }
            
            .content {
              padding: 24px 16px;
            }
            
            .details {
              flex-direction: column;
              gap: 12px;
            }
            
            .detail-item {
              padding: 8px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .detail-item:last-child {
              border-bottom: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div class="logo-icon">🧠</div>
              <div class="logo-text">SEEN AI</div>
            </div>
            <div class="header-title">دعوة للمقابلة</div>
            <div class="header-subtitle">منصة ذكية لتحليل المواهب</div>
          </div>
          
          <div class="content">
            <div class="greeting">مرحباً ${candidateName}</div>
            
            <div class="description">
              نشكرك على اهتمامك بالانضمام إلى فريقنا. نود دعوتك لإجراء مقابلة ذكية عبر الإنترنت للوظيفة التالية:
            </div>
            
            <div class="job-card">
              <div class="job-title">${jobTitle}</div>
              <div class="job-subtitle">مقابلة ذكية بالذكاء الاصطناعي</div>
            </div>
            
            <div class="details">
              <div class="detail-item">
                <div class="detail-label">المدة</div>
                <div class="detail-value">${durationMinutes} دقيقة</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">النوع</div>
                <div class="detail-value">ذكية</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">الصالحية</div>
                <div class="detail-value">7 أيام</div>
              </div>
            </div>
            
            <a href="${interviewLink}" class="cta-button">
              بدء المقابلة الآن
            </a>
            
            <div class="warning">
              <div class="warning-title">ملاحظات مهمة:</div>
              <ul class="warning-list">
                <li>تأكد من اتصال إنترنت مستقر</li>
                <li>الرابط صالح لمدة 7 أيام فقط</li>
                <li>لا يمكن إعادة المحاولة بعد البدء</li>
              </ul>
            </div>
            
            <div class="support-text">
              إذا واجهت أي مشكلة، تواصل معنا فوراً<br>
              نتمنى لك التوفيق! 🎉
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-text">
              مع تحيات فريق <span class="brand">SEEN AI</span><br>
              <small>لا ترد على هذا البريد الإلكتروني</small>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

  const text = `
  دعوة للمقابلة - SEEN AI
  
  مرحباً ${candidateName}،
  
  نشكرك على اهتمامك بالانضمام إلى فريقنا. نود دعوتك لإجراء مقابلة ذكية عبر الإنترنت للوظيفة التالية:
  
  ${jobTitle}
  مقابلة ذكية بالذكاء الاصطناعي
  
  تفاصيل المقابلة:
  • المدة: ${durationMinutes} دقيقة
  • النوع: مقابلة ذكية
  • صالحية الرابط: 7 أيام
  
  رابط المقابلة: ${interviewLink}
  
  ملاحظات مهمة:
  • تأكد من اتصال إنترنت مستقر
  • الرابط صالح لمدة 7 أيام فقط
  • لا يمكن إعادة المحاولة بعد البدء
  
  إذا واجهت أي مشكلة، تواصل معنا فوراً.
  نتمنى لك التوفيق!
  
  مع تحيات فريق SEEN AI
  لا ترد على هذا البريد الإلكتروني
    `;

  return { html, text };
}
