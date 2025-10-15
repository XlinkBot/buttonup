import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "创业洞察 ButtonUp - 每日创业讨论汇总",
    template: "%s | 创业洞察 ButtonUp"
  },
  description: "每日汇总Reddit创业讨论,为创业者提供2024年最新创业趋势分析、创业机会发现、行业洞察报告。发现小成本创业项目、AI创业方向、独立开发者经验分享。",
  keywords: [
    // 核心关键词
    "创业", "创业讨论", "创业洞察", "buttonup",
    // 长尾关键词 - 趋势相关
    "2024创业趋势", "创业趋势分析", "最新创业动态",
    // 长尾关键词 - 来源相关
    "Reddit创业讨论", "Reddit创业社区", "创业者社区",
    // 长尾关键词 - 内容类型
    "创业机会发现", "创业案例分析", "创业经验分享",
    "创业失败教训", "创业成功案例", "创业建议",
    // 长尾关键词 - 细分领域
    "小成本创业项目", "AI创业方向", "独立开发者创业",
    "SaaS创业", "电商创业", "内容创业",
    // 长尾关键词 - 问题导向
    "如何找创业方向", "创业项目推荐", "创业资讯汇总",
    "创业者必读", "创业入门指南"
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
    title: "创业洞察 ButtonUp - 每日创业讨论汇总",
    description: "每日汇总Reddit上的创业讨论，为创业者提供最新洞察和趋势分析。发现创业机会，掌握行业动态。",
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
    title: "创业洞察 ButtonUp - 每日创业讨论汇总",
    description: "每日汇总Reddit上的创业讨论，为创业者提供最新洞察和趋势分析",
    images: ["/og-image.png"],
    creator: "@buttonup_cloud"
  },
  metadataBase: new URL('https://buttonup.cloud'),
  alternates: {
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
