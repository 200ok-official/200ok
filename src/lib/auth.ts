import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * 取得伺服器端 session
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * 檢查使用者是否已登入
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

