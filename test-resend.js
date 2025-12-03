#!/usr/bin/env node

/**
 * Resend 郵件發送測試腳本
 * 
 * 使用方法：
 * 1. 確保已安裝 resend 套件：npm install resend
 * 2. 設定環境變數：RESEND_API_KEY 和 EMAIL_FROM
 * 3. 執行：node test-resend.js
 */

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testResend() {
  log(colors.bright, '\n🔍 Resend 郵件發送測試\n');
  log(colors.blue, '='.repeat(50));

  // 1. 檢查環境變數
  log(colors.yellow, '\n📋 步驟 1：檢查環境變數');
  
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || '200 OK <onboarding@resend.dev>';
  
  if (!apiKey) {
    log(colors.red, '❌ 錯誤：未找到 RESEND_API_KEY');
    log(colors.yellow, '\n請在 .env.local 中設定：');
    log(colors.blue, 'RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx');
    process.exit(1);
  }

  log(colors.green, `✅ RESEND_API_KEY: ${apiKey.substring(0, 10)}...`);
  log(colors.green, `✅ EMAIL_FROM: ${emailFrom}`);

  // 2. 初始化 Resend
  log(colors.yellow, '\n📋 步驟 2：初始化 Resend Client');
  const resend = new Resend(apiKey);
  log(colors.green, '✅ Resend Client 初始化成功');

  // 3. 提示輸入測試信箱
  log(colors.yellow, '\n📋 步驟 3：準備發送測試郵件');
  log(colors.blue, '\n⚠️  重要提醒：');
  log(colors.blue, '   在測試模式下，只能發送到註冊 Resend 帳號的信箱');
  log(colors.blue, '   請修改此腳本中的 TEST_EMAIL 變數為您的信箱\n');

  // ⚠️ 請修改這裡的信箱為您註冊 Resend 的信箱
  const TEST_EMAIL = 'your-email@example.com'; // 👈 修改這裡！

  if (TEST_EMAIL === 'your-email@example.com') {
    log(colors.red, '❌ 請先修改腳本中的 TEST_EMAIL 變數！');
    log(colors.yellow, '\n在 test-resend.js 第 60 行修改為您的信箱');
    process.exit(1);
  }

  // 4. 發送測試郵件
  log(colors.yellow, `\n📋 步驟 4：發送測試郵件到 ${TEST_EMAIL}`);
  
  try {
    const data = await resend.emails.send({
      from: emailFrom,
      to: [TEST_EMAIL],
      subject: '✅ Resend 測試郵件 - 200 OK',
      html: `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
              <h2 style="margin: 0 0 20px; color: #20263e; font-size: 24px;">✅ 測試成功！</h2>
              <p style="margin: 0 0 15px; color: #333333; font-size: 16px; line-height: 1.6;">
                恭喜！您的 Resend 郵件服務已經正確設定。
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
                <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.6;">
                  <strong>✨ 設定資訊：</strong><br>
                  <strong>發件人：</strong> ${emailFrom}<br>
                  <strong>測試時間：</strong> ${new Date().toLocaleString('zh-TW')}<br>
                  <strong>API Key：</strong> ${apiKey.substring(0, 15)}...
                </p>
              </div>

              <p style="margin: 0 0 15px; color: #333333; font-size: 16px; line-height: 1.6;">
                您現在可以：
              </p>
              <ul style="color: #333333; font-size: 16px; line-height: 1.8;">
                <li>✅ 接收註冊驗證郵件</li>
                <li>✅ 重設密碼郵件</li>
                <li>✅ 所有系統通知郵件</li>
              </ul>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f3ed; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                這是一封自動測試郵件，來自 200 OK 平台
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    log(colors.green, '\n✅ 郵件發送成功！');
    log(colors.blue, '\n📧 郵件詳情：');
    log(colors.blue, `   Email ID: ${data.id}`);
    log(colors.blue, `   收件人: ${TEST_EMAIL}`);
    log(colors.blue, `   發件人: ${emailFrom}`);
    
    log(colors.yellow, '\n💡 下一步：');
    log(colors.blue, '   1. 檢查您的收件匣（可能在垃圾郵件）');
    log(colors.blue, '   2. 如果收到郵件，表示設定完全正確！');
    log(colors.blue, '   3. 前往 Resend Dashboard 查看詳細日誌：');
    log(colors.blue, '      https://resend.com/emails/' + data.id);
    
  } catch (error) {
    log(colors.red, '\n❌ 郵件發送失敗！');
    log(colors.red, '\n錯誤訊息：');
    log(colors.red, error.message);
    
    log(colors.yellow, '\n🔍 可能的原因：');
    
    if (error.message.includes('domain')) {
      log(colors.blue, '   1. 域名未驗證 - 請前往 Resend Dashboard 驗證域名');
      log(colors.blue, '      https://resend.com/domains');
      log(colors.blue, '   2. 或改用測試信箱：onboarding@resend.dev');
    } else if (error.message.includes('API key') || error.message.includes('unauthorized')) {
      log(colors.blue, '   1. API Key 無效或權限不足');
      log(colors.blue, '   2. 請重新建立 API Key：https://resend.com/api-keys');
      log(colors.blue, '   3. 確保選擇「Sending access」權限');
    } else if (error.message.includes('recipient')) {
      log(colors.blue, '   1. 在測試模式下，只能發送到註冊 Resend 的信箱');
      log(colors.blue, '   2. 請使用您註冊 Resend 帳號的信箱進行測試');
    } else {
      log(colors.blue, '   請查看完整錯誤訊息，並參考 Resend 文件');
      log(colors.blue, '   https://resend.com/docs');
    }
    
    log(colors.yellow, '\n📋 檢查清單：');
    log(colors.blue, '   [ ] RESEND_API_KEY 正確且有效');
    log(colors.blue, '   [ ] EMAIL_FROM 格式正確');
    log(colors.blue, '   [ ] 自定義域名已在 Resend 驗證（如有使用）');
    log(colors.blue, '   [ ] 測試信箱是註冊 Resend 的信箱');
    
    process.exit(1);
  }

  log(colors.blue, '\n' + '='.repeat(50));
  log(colors.green, '\n✨ 測試完成！\n');
}

// 執行測試
testResend().catch((error) => {
  log(colors.red, '\n❌ 測試腳本執行錯誤：');
  log(colors.red, error.message);
  log(colors.red, error.stack);
  process.exit(1);
});

