import { Resend } from "resend";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

// 懶加載 Resend Client（避免冷啟動問題）
let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not defined");
    }
    console.log("[EMAIL] 🔧 初始化 Resend Client...");
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * 發送郵件的通用函式
 */
/**
 * 發送郵件的通用函式（帶重試機制）
 */
export async function sendEmail(
  { to, subject, html }: SendEmailOptions,
  retries = 2
): Promise<{ success: boolean; data?: any; error?: string }> {
  const fromAddress = process.env.EMAIL_FROM || "200 OK <noreply@200ok.com>";
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[EMAIL] 🚀 正在發送郵件... (嘗試 ${attempt}/${retries})`);
      console.log(`[EMAIL]    From: ${fromAddress}`);
      console.log(`[EMAIL]    To: ${to}`);
      console.log(`[EMAIL]    Subject: ${subject}`);
      
      const resend = getResendClient();
      const data = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject,
        html,
      });

      console.log(`[EMAIL] ✅ 郵件發送成功！Email ID: ${data.id}`);
      return { success: true, data };
      
    } catch (error: any) {
      console.error(`[SEND_EMAIL_ERROR] ❌ 郵件發送失敗 (嘗試 ${attempt}/${retries}):`, error.message);
      
      // 如果是最後一次嘗試，返回錯誤
      if (attempt === retries) {
        console.error("[SEND_EMAIL_ERROR] 完整錯誤:", error);
        return { success: false, error: error.message };
      }
      
      // 否則等待後重試
      console.log(`[EMAIL] ⏳ 等待 1 秒後重試...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return { success: false, error: "發送失敗" };
}

/**
 * 生成驗證郵件 HTML
 */
export function generateVerificationEmailHTML(
  name: string,
  verificationUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>驗證您的 200 OK 帳號</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f3ed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f3ed; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #20263e; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">200 OK</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #20263e; font-size: 24px;">歡迎加入 200 OK！</h2>
              <p style="margin: 0 0 15px; color: #333333; font-size: 16px; line-height: 1.6;">
                嗨 <strong>${name}</strong>，
              </p>
              <p style="margin: 0 0 15px; color: #333333; font-size: 16px; line-height: 1.6;">
                感謝您註冊 200 OK 接案平台！為了確保您的帳號安全，請點擊下方按鈕驗證您的電子郵件地址。
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background-color: #20263e; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      驗證我的信箱
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 15px; color: #666666; font-size: 14px; line-height: 1.6;">
                或者，您也可以複製以下連結貼到瀏覽器中：
              </p>
              <p style="margin: 0 0 15px; padding: 15px; background-color: #f5f3ed; border-radius: 4px; color: #20263e; font-size: 14px; word-break: break-all;">
                ${verificationUrl}
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ 重要提醒：</strong><br>
                  此驗證連結將在 24 小時後失效。如果您沒有註冊 200 OK 帳號，請忽略此郵件。
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f3ed; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                需要幫助？請聯繫我們的客服團隊
              </p>
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                <a href="mailto:support@200ok.com" style="color: #20263e; text-decoration: none;">support@200ok.com</a>
              </p>
              <p style="margin: 15px 0 0; color: #999999; font-size: 12px;">
                © 2024 200 OK. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * 發送驗證郵件
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationUrl: string
) {
  const html = generateVerificationEmailHTML(name, verificationUrl);

  return await sendEmail({
    to: email,
    subject: "請驗證您的 200 OK 帳號",
    html,
  });
}

/**
 * 生成密碼重設郵件 HTML（預留功能）
 */
export function generatePasswordResetEmailHTML(
  name: string,
  resetUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>重設您的密碼</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f3ed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f3ed; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #20263e; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">200 OK</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #20263e; font-size: 24px;">重設您的密碼</h2>
              <p style="margin: 0 0 15px; color: #333333; font-size: 16px; line-height: 1.6;">
                嗨 <strong>${name}</strong>，
              </p>
              <p style="margin: 0 0 15px; color: #333333; font-size: 16px; line-height: 1.6;">
                我們收到了您的密碼重設請求。請點擊下方按鈕來重設您的密碼。
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background-color: #dc3545; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      重設密碼
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ 重要提醒：</strong><br>
                  此連結將在 1 小時後失效。如果您沒有要求重設密碼，請忽略此郵件，您的密碼將保持不變。
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f3ed; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                需要幫助？請聯繫我們的客服團隊
              </p>
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                <a href="mailto:support@200ok.com" style="color: #20263e; text-decoration: none;">support@200ok.com</a>
              </p>
              <p style="margin: 15px 0 0; color: #999999; font-size: 12px;">
                © 2024 200 OK. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

