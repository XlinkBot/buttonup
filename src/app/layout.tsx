import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Script from "next/script"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Only preload primary font
});

export const metadata: Metadata = {
  title: {
    default: "创业洞察 ButtonUp - AI Startups 每日创业讨论汇总",
    template: "%s | 创业洞察 ButtonUp"
  },
  description: "每日汇总Reddit上的AI创业讨论，为AI创业者提供2025年最新AI创业趋势分析、AI创业机会发现、AI行业洞察报告。深度解析AI SaaS创业、AI Agent开发、AIGC应用、大模型创业等热门方向，分享AI创业成功案例、失败教训和实战经验。助力AI创业者把握风口，发现机会，规避风险。阅读全文获取完整AI创业洞察，探索LLMs在创业中的应用。",
  keywords: [
    // 核心关键词 - AI创业
    "AI创业", "AI创业讨论", "AI创业洞察", "buttonup", "startups", "创业洞察",
    // 长尾关键词 - AI创业趋势
    "2025年AI创业趋势", "AI创业趋势分析", "最新AI创业动态",
    "AI创业风口", "AI创业赛道", "AI创业热点",
    // 长尾关键词 - 来源相关
    "Reddit AI创业讨论", "Reddit AI创业社区", "AI创业者社区",
    // 长尾关键词 - 内容类型
    "AI创业机会发现", "AI创业案例分析", "AI创业经验分享",
    "AI创业失败教训", "AI创业成功案例", "AI创业建议", "阅读全文",
    // 长尾关键词 - 细分领域
    "AI SaaS创业", "AI Agent创业", "AI应用开发",
    "大模型创业", "AIGC创业", "AI工具创业", "llms", "LLMs应用",
    // 长尾关键词 - 问题导向
    "如何开始AI创业", "AI创业项目推荐", "AI创业资讯汇总",
    "AI创业者必读", "AI创业入门指南", "AI创业方向选择"
  ],
  authors: [{ name: "创业洞察 ButtonUp", url: "https://buttonup.cloud" }],
  creator: "创业洞察 ButtonUp",
  publisher: "创业洞察 ButtonUp",
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
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover"
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://buttonup.cloud/",
    title: "创业洞察 ButtonUp - AI Startups 每日创业讨论汇总",
    description: "每日汇总Reddit上的AI创业讨论，为AI创业者提供最新AI洞察和趋势分析。发现AI创业机会，掌握AI行业动态。阅读全文获取完整创业洞察，探索LLMs在startups中的应用。",
    siteName: "创业洞察 ButtonUp",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "创业洞察 ButtonUp - 每日创业讨论汇总"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "创业洞察 ButtonUp - AI Startups 每日创业讨论汇总",
    description: "每日汇总Reddit上的AI创业讨论，为AI创业者提供最新AI洞察和趋势分析。阅读全文获取完整创业洞察，探索LLMs在startups中的应用。",
    images: ["/og-image.png"],
    creator: "@buttonup_cloud"
  },
  metadataBase: new URL('https://buttonup.cloud'),
  alternates: {
    canonical: 'https://buttonup.cloud',
    types: {
      'application/rss+xml': [
        { url: '/rss.xml', title: '创业洞察 ButtonUp RSS' }
      ]
    }
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
  },
  verification: {
    google: "rKl7kj8OPnjKiHdf4XIYQA46XkPhWNgKRfQ0jYDE0bg",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        {/* Critical CSS for above-the-fold content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html{line-height:1.15;-webkit-text-size-adjust:100%}
            body{margin:0;font-family:system-ui,-apple-system,sans-serif}
            .min-h-screen{min-height:100vh}
            .bg-gradient-to-br{background-image:linear-gradient(to bottom right,var(--tw-gradient-stops))}
            .from-gray-50{--tw-gradient-from:#f9fafb;--tw-gradient-to:rgb(249 250 251 / 0);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to)}
            .dark .from-gray-900{--tw-gradient-from:#111827}
          `
        }} />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('buttonup-theme') || 'system';
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);
                document.documentElement.classList.add(isDark ? 'dark' : 'light');
              } catch (e) {
                document.documentElement.classList.add('light');
              }
            `,
          }}
        />
      </head>
      
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-734L5EZQ9V"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-734L5EZQ9V', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
