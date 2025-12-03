import { BaseService } from "./base.service";
import { hashPassword, comparePassword } from "@/utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
} from "@/middleware/auth.middleware";
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
} from "@/middleware/error.middleware";
import { sendVerificationEmail as sendVerificationEmailFn } from "@/lib/email";

// 型別定義
export type UserRole = 'freelancer' | 'client' | 'admin';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  roles: UserRole[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    roles: UserRole[];
  };
}

export class AuthService extends BaseService {
  /**
   * 註冊新使用者
   */
  async register(data: RegisterData): Promise<AuthTokens> {
    const { name, email, password, roles } = data;

    // 檢查 email 是否已存在
    const { data: existingUser } = await this.db
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      throw new ConflictError("此 Email 已被註冊");
    }

    // 雜湊密碼
    const password_hash = await hashPassword(password);

    // 建立使用者（email_verified 預設為 false）
    const { data: user, error } = await this.db
      .from("users")
      .insert({
        name,
        email,
        password_hash,
        roles,
        email_verified: false,
      })
      .select()
      .single();

    if (error || !user) {
      throw new BadRequestError(`註冊失敗: ${error?.message}`);
    }

    // 發送驗證郵件（真正的異步，不阻塞註冊流程）
    console.log(`[REGISTER] 準備異步發送驗證郵件到 ${user.email}...`);
    
    // 使用 setImmediate 確保在下一個 tick 執行，不阻塞當前響應
    setImmediate(() => {
      this.sendVerificationEmail(user.id, user.email, user.name)
        .then(result => {
          if (result.success) {
            console.log(`[REGISTER] ✅ 驗證郵件發送成功: ${user.email}`);
          } else {
            console.error(`[REGISTER] ❌ 驗證郵件發送失敗: ${result.message}`);
          }
        })
        .catch(error => {
          console.error("[REGISTER_SEND_EMAIL_ERROR]", error);
        });
    });

    // 生成 tokens
    const access_token = generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    });

    const refresh_token = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // 儲存 refresh token
    await this.db.from("refresh_tokens").insert({
      user_id: user.id,
      token: refresh_token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  /**
   * 登入
   */
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const { email, password } = credentials;

    // 尋找使用者
    const { data: user, error } = await this.db
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user || !user.password_hash) {
      throw new UnauthorizedError("Email 或密碼錯誤");
    }

    // 驗證密碼
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError("Email 或密碼錯誤");
    }

    // 檢查 email 是否已驗證
    if (!user.email_verified) {
      throw new UnauthorizedError("請先驗證您的電子郵件，檢查您的信箱以完成驗證");
    }

    // 生成 tokens
    const access_token = generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    });

    const refresh_token = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // 儲存 refresh token
    await this.db.from("refresh_tokens").insert({
      user_id: user.id,
      token: refresh_token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  /**
   * 刷新 Access Token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    // 查找 refresh token 並包含使用者資訊
    const { data: tokenRecord, error } = await this.db
      .from("refresh_tokens")
      .select(`
        *,
        user:users!refresh_tokens_user_id_fkey(*)
      `)
      .eq("token", refreshToken)
      .single();

    if (error || !tokenRecord) {
      throw new UnauthorizedError("無效的 Refresh Token");
    }

    // 檢查是否過期
    if (new Date() > new Date(tokenRecord.expires_at)) {
      // 刪除過期的 token
      await this.db.from("refresh_tokens").delete().eq("id", tokenRecord.id);
      throw new UnauthorizedError("Refresh Token 已過期");
    }

    const user = (tokenRecord as any).user;

    // 生成新的 tokens
    const access_token = generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    });

    const refresh_token = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // 刪除舊的 refresh token
    await this.db.from("refresh_tokens").delete().eq("id", tokenRecord.id);

    // 儲存新的 refresh token
    await this.db.from("refresh_tokens").insert({
      user_id: user.id,
      token: refresh_token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  /**
   * 登出
   */
  async logout(refreshToken: string): Promise<void> {
    // 刪除 refresh token
    await this.db.from("refresh_tokens").delete().eq("token", refreshToken);
  }

  /**
   * Google OAuth 登入/註冊
   */
  async googleAuth(googleProfile: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  }): Promise<AuthTokens> {
    const { id: google_id, email, name, picture } = googleProfile;

    // 檢查是否已有使用者
    const { data: existingUser } = await this.db
      .from("users")
      .select("*")
      .or(`google_id.eq.${google_id},email.eq.${email}`)
      .single();

    let user = existingUser;

    if (!user) {
      // 建立新使用者
      const { data: newUser, error } = await this.db
        .from("users")
        .insert({
          name,
          email,
          google_id,
          avatar_url: picture,
          email_verified: true,
          roles: ['freelancer'], // 預設為接案者
        })
        .select()
        .single();

      if (error || !newUser) {
        throw new BadRequestError(`建立使用者失敗: ${error?.message}`);
      }
      user = newUser;
    } else if (!user.google_id) {
      // 綁定 Google 帳號
      const { data: updatedUser, error } = await this.db
        .from("users")
        .update({ google_id })
        .eq("id", user.id)
        .select()
        .single();

      if (error || !updatedUser) {
        throw new BadRequestError(`綁定 Google 帳號失敗: ${error?.message}`);
      }
      user = updatedUser;
    }

    // 生成 tokens
    const access_token = generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    });

    const refresh_token = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // 儲存 refresh token
    await this.db.from("refresh_tokens").insert({
      user_id: user.id,
      token: refresh_token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  /**
   * 生成信箱驗證 token 並發送郵件
   */
  async sendVerificationEmail(userId: string, email: string, name: string): Promise<{ success: boolean; message: string }> {
    try {
      // 生成驗證 token（使用 crypto 生成隨機字串）
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // 儲存 token 到資料庫（24小時有效）
      const { error } = await this.db
        .from("email_verification_tokens")
        .insert({
          user_id: userId,
          token,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) {
        console.error("[SEND_VERIFICATION_EMAIL_ERROR]", error);
        return { success: false, message: "儲存驗證 token 失敗" };
      }

      // 生成驗證連結
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
      
      // 使用 Resend 發送驗證郵件（已在頂部 import，不需動態載入）
      const emailResult = await sendVerificationEmailFn(email, name, verificationUrl);

      if (!emailResult.success) {
        console.error("[SEND_VERIFICATION_EMAIL_ERROR]", emailResult.error);
        // 即使郵件發送失敗，也不刪除 token，讓使用者可以重新發送
        return { success: false, message: "發送驗證郵件失敗，請稍後重試" };
      }

      console.log(`[EMAIL] 驗證郵件已發送到 ${email}`);
      return { success: true, message: "驗證郵件已發送" };
    } catch (error: any) {
      console.error("[SEND_VERIFICATION_EMAIL_ERROR]", error);
      return { success: false, message: error.message || "發送驗證郵件失敗" };
    }
  }

  /**
   * 驗證 Email Token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message?: string }> {
    try {
      // 查找驗證 token
      const { data: tokenRecord, error: tokenError } = await this.db
        .from("email_verification_tokens")
        .select("*")
        .eq("token", token)
        .single();

      if (tokenError || !tokenRecord) {
        return { success: false, message: "無效的驗證 token" };
      }

      // 檢查是否過期
      if (new Date() > new Date(tokenRecord.expires_at)) {
        await this.db.from("email_verification_tokens").delete().eq("id", tokenRecord.id);
        return { success: false, message: "驗證連結已過期" };
      }

      // 更新使用者狀態
      const { error: updateError } = await this.db
        .from("users")
        .update({ email_verified: true })
        .eq("id", tokenRecord.user_id);

      if (updateError) {
        return { success: false, message: "更新驗證狀態失敗" };
      }

      // 刪除已使用的 token
      await this.db.from("email_verification_tokens").delete().eq("id", tokenRecord.id);

      return { success: true };
    } catch (error: any) {
      console.error("[VERIFY_EMAIL_ERROR]", error);
      return { success: false, message: error.message || "驗證失敗" };
    }
  }

  /**
   * 重新發送驗證郵件（帶有速率限制）
   */
  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // 查找使用者
      const { data: user, error: userError } = await this.db
        .from("users")
        .select("id, name, email, email_verified")
        .eq("email", email)
        .single();

      if (userError || !user) {
        return { success: false, message: "找不到該電子郵件的帳號" };
      }

      if (user.email_verified) {
        return { success: false, message: "此帳號已經完成驗證" };
      }

      // 檢查重發限制：查看最近的 token 建立時間
      const { data: recentToken } = await this.db
        .from("email_verification_tokens")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (recentToken) {
        const lastSentTime = new Date(recentToken.created_at).getTime();
        const now = Date.now();
        const timeDiff = now - lastSentTime;
        const cooldownMinutes = 2; // 2 分鐘冷卻時間
        const cooldownMs = cooldownMinutes * 60 * 1000;

        if (timeDiff < cooldownMs) {
          const remainingSeconds = Math.ceil((cooldownMs - timeDiff) / 1000);
          return {
            success: false,
            message: `請稍後再試，您可以在 ${remainingSeconds} 秒後重新發送驗證郵件`,
          };
        }
      }

      // 刪除舊的驗證 token
      await this.db.from("email_verification_tokens").delete().eq("user_id", user.id);

      // 發送新的驗證郵件
      return await this.sendVerificationEmail(user.id, user.email, user.name);
    } catch (error: any) {
      console.error("[RESEND_VERIFICATION_EMAIL_ERROR]", error);
      return { success: false, message: error.message || "重新發送驗證郵件失敗" };
    }
  }

  /**
   * 驗證手機號碼
   */
  async verifyPhone(userId: string, phone: string): Promise<void> {
    const { error } = await this.db
      .from("users")
      .update({
        phone,
        phone_verified: true,
      })
      .eq("id", userId);

    if (error) {
      throw new BadRequestError(`驗證手機號碼失敗: ${error.message}`);
    }
  }

  /**
   * 發送手機驗證碼（模擬）
   */
  async sendPhoneVerificationCode(phone: string): Promise<string> {
    // TODO: 整合 Twilio 或其他 SMS 服務
    // 這裡僅模擬生成驗證碼
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 在生產環境，應該：
    // 1. 將驗證碼儲存到 Redis（設定過期時間）
    // 2. 使用 Twilio 發送 SMS
    // 3. 回傳成功訊息

    console.log(`[SMS] 發送驗證碼到 ${phone}: ${code}`);

    return code;
  }

  /**
   * 重設密碼
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const password_hash = await hashPassword(newPassword);

    const { error } = await this.db
      .from("users")
      .update({ password_hash })
      .eq("id", userId);

    if (error) {
      throw new BadRequestError(`重設密碼失敗: ${error.message}`);
    }

    // 刪除所有 refresh tokens（強制重新登入）
    await this.db.from("refresh_tokens").delete().eq("user_id", userId);
  }
}
