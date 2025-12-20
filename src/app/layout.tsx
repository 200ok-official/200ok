import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "200 OK - 軟體接案平台",
  description: "專業的軟體開發接案媒合平台，連結優秀的開發者與案主",
  keywords: ["接案", "軟體開發", "外包", "freelance", "案件媒合"],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <Providers>
          <div className="pt-16">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

