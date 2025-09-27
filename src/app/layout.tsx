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
  description: "每日汇总Reddit上的创业讨论，为创业者提供最新洞察和趋势分析。发现创业机会，掌握行业动态，与创业社区保持同步。",
  keywords: ["创业", "创业讨论", "每日汇总", "创业洞察", "buttonup", "创业趋势", "Reddit", "创业社区", "创业机会", "行业分析"],
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
    title: "创业洞察 ButtonUp - 每日创业讨论汇总",
    description: "每日汇总Reddit上的创业讨论，为创业者提供最新洞察和趋势分析。发现创业机会，掌握行业动态。",
    siteName: "创业洞察 ButtonUp",
    images: [
      {
        url: "/og-image.jpg",
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
    images: ["/og-image.jpg"],
    creator: "@buttonup_cloud"
  },
  alternates: {
    canonical: "/",
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
