import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { AuthService } from "@/services/auth.service";

const authService = new AuthService();

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
    // 設定 session 為 24 小時
    maxAge: 24 * 60 * 60, // 24 小時（以秒為單位）
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          // 使用 Google 資料建立或登入使用者
          const result = await authService.googleAuth({
            id: account.providerAccountId,
            email: profile.email,
            name: user.name || profile.email,
            picture: user.image || undefined,
          });

          // 將 tokens 和 user 資訊附加到 user 物件（供後續使用）
          (user as any).accessToken = result.access_token;
          (user as any).refreshToken = result.refresh_token;
          (user as any).userId = result.user.id;
          (user as any).userEmail = result.user.email;
          (user as any).userName = result.user.name;
          (user as any).userRoles = result.user.roles;

          return true;
        } catch (error) {
          console.error("Google OAuth error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.userId = (user as any).userId;
        token.userEmail = (user as any).userEmail;
        token.userName = (user as any).userName;
        token.userRoles = (user as any).userRoles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).accessToken = token.accessToken;
        (session as any).refreshToken = token.refreshToken;
        // 設置 user 資訊到 session
        (session.user as any).id = token.userId;
        (session.user as any).email = token.userEmail || session.user.email;
        (session.user as any).name = token.userName || session.user.name;
        (session.user as any).roles = token.userRoles;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};


