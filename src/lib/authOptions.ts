import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
          // 調用後端 Google OAuth API
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const response = await fetch(`${backendUrl}/api/v1/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              google_id: account.providerAccountId,
              email: profile.email,
              name: user.name || profile.email,
              picture: user.image || null,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Google OAuth backend error:", errorData);
            return false;
          }

          const result = await response.json();
          
          // 將 tokens 和 user 資訊附加到 user 物件（供後續使用）
          (user as any).accessToken = result.data.access_token;
          (user as any).refreshToken = result.data.refresh_token;
          (user as any).userId = result.data.user.id;
          (user as any).userEmail = result.data.user.email;
          (user as any).userName = result.data.user.name;
          (user as any).userRoles = result.data.user.roles;
          (user as any).userAvatarUrl = result.data.user.avatar_url;

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
  debug: process.env.NODE_ENV === 'development',
};


