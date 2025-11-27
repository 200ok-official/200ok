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

          // 將 tokens 附加到 user 物件（供後續使用）
          (user as any).accessToken = result.access_token;
          (user as any).refreshToken = result.refresh_token;

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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).accessToken = token.accessToken;
        (session as any).refreshToken = token.refreshToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

