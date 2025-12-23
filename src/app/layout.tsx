import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { GoogleAnalytics } from "@/components/seo/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://200ok.tw'),
  title: {
    default: "200 OK - 專業軟體接案平台 | 連結優秀開發者與案主",
    template: "%s | 200 OK"
  },
  description: "200 OK 是台灣領先的軟體開發接案媒合平台，提供專業的案件媒合服務。無論您是尋找優秀開發者的案主，或是想接案的軟體工程師、設計師，都能在這裡找到最適合的合作夥伴。支援網站開發、App 開發、UI/UX 設計等多種專案類型。",
  keywords: [
    "接案平台",
    "軟體開發",
    "程式外包",
    "freelance",
    "案件媒合",
    "網站開發",
    "App開發",
    "UI設計",
    "UX設計",
    "自由工作者",
    "遠端工作",
    "程式設計師",
    "軟體工程師",
    "外包平台",
    "專案外包"
  ],
  authors: [{ name: "200 OK Team" }],
  creator: "200 OK",
  publisher: "200 OK",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "/",
    title: "200 OK - 專業軟體接案平台",
    description: "連結優秀開發者與案主，提供最專業的軟體開發案件媒合服務",
    siteName: "200 OK",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "200 OK - 專業軟體接案平台"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "200 OK - 專業軟體接案平台",
    description: "連結優秀開發者與案主，提供最專業的軟體開發案件媒合服務",
    images: ["/og-image.png"],
    creator: "@200ok_tw",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  verification: {
    // 可在未來加入 Google Search Console 和其他驗證碼
    // google: 'your-google-site-verification',
    // bing: 'your-bing-site-verification',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <GoogleAnalytics />
      </head>
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

