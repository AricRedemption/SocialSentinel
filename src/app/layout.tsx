import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/lib/settings-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Amazon Review Intelligence | 亚马逊评论智能分析系统",
  description: "基于 AI 的亚马逊评论智能分析系统，支持 SellerSprite/领星 导出的评论数据，提供情感分析、主题聚类、用户洞察等深度分析功能",
  keywords: ["亚马逊评论分析", "Amazon Review Analysis", "评论智能分析", "SellerSprite", "领星", "AI分析"],
  authors: [{ name: "SocialSentinel" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
