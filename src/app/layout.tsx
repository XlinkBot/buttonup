import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "创业洞察 buttonup - 每日Reddit创业讨论汇总",
  description: "每日汇总Reddit上的创业讨论，为创业者提供最新洞察和趋势分析",
  keywords: "创业,Reddit,讨论,每日汇总,创业洞察,buttonup,创业趋势",
  authors: [{ name: "创业洞察 buttonup" }],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover"
  },
  openGraph: {
    title: "创业洞察 buttonup - 每日Reddit创业讨论汇总",
    description: "每日汇总互联网的创业讨论，为创业者提供最新洞察和趋势分析",
    type: "website",
    locale: "zh_CN",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ButtonUp"
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false
  }
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
        {children}
      </body>
    </html>
  );
}
