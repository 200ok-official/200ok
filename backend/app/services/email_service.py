"""
Email Service using Resend
處理所有郵件發送相關功能
"""
import resend
from typing import Optional
from ..config import settings


# 設定 Resend API Key
resend.api_key = settings.RESEND_API_KEY


async def send_email(
    to: str,
    subject: str,
    html: str,
    from_email: Optional[str] = None
) -> dict:
    """
    發送郵件
    
    Args:
        to: 收件人 email
        subject: 郵件主旨
        html: 郵件 HTML 內容
        from_email: 寄件人 email（選填，預設使用設定檔中的值）
    
    Returns:
        Resend 回傳的結果
    
    Raises:
        Exception: 發送失敗時拋出例外
    """
    try:
        params = {
            "from": from_email or settings.RESEND_FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        }
        
        result = resend.Emails.send(params)
        return result
    except Exception as e:
        raise Exception(f"發送郵件失敗: {str(e)}")


async def send_verification_email(
    user_id: str,
    email: str,
    name: str,
    token: str
) -> dict:
    """
    發送 Email 驗證郵件
    
    Args:
        user_id: 使用者 ID
        email: 使用者 email
        name: 使用者名稱
        token: 驗證 token
    
    Returns:
        發送結果
    """
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #20263e 0%, #3a4158 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">200ok</h1>
            <p style="color: #c5ae8c; margin: 10px 0 0 0; font-size: 16px;">工程師接案平台</p>
        </div>
        
        <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #20263e; margin-top: 0;">👋 嗨，{name}！</h2>
            
            <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
                感謝您註冊 200ok！請點擊下方按鈕驗證您的電子郵件地址：
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="{verification_link}" 
                   style="background: linear-gradient(135deg, #20263e 0%, #3a4158 100%); 
                          color: #ffffff; 
                          padding: 15px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    ✓ 驗證我的 Email
                </a>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                    如果按鈕無法點擊，請複製以下連結到瀏覽器：
                </p>
                <p style="color: #3b82f6; font-size: 13px; word-break: break-all; margin: 0;">
                    {verification_link}
                </p>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; margin: 30px 0 0 0;">
                此驗證連結將在 <strong>24 小時</strong>後失效。
            </p>
            
            <p style="color: #9ca3af; font-size: 14px; margin: 20px 0 0 0;">
                如果您沒有註冊 200ok，請忽略此郵件。
            </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 5px 0;">© 2025 200ok. All rights reserved.</p>
            <p style="margin: 5px 0;">這是一封自動發送的郵件，請勿直接回覆。</p>
        </div>
    </body>
    </html>
    """
    
    return await send_email(
        to=email,
        subject="✉️ 請驗證您的 Email - 200ok",
        html=html
    )


async def send_test_email(to: str) -> dict:
    """
    發送測試郵件
    
    Args:
        to: 收件人 email
    
    Returns:
        發送結果
    """
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #20263e;">✅ Email 測試成功！</h1>
        <p>如果您收到這封郵件，表示 Resend 設定正確。</p>
        <p>您現在可以正常發送郵件了！</p>
        <hr>
        <p style="color: #9ca3af; font-size: 12px;">200ok Backend Email Service</p>
    </body>
    </html>
    """
    
    return await send_email(
        to=to,
        subject="🧪 200ok Email 測試",
        html=html
    )

