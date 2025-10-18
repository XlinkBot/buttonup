import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Script from "next/script"
import UTMTracker from "@/components/UTMTracker"

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
  description: "每日汇总Reddit上的AI创业讨论，为AI创业者提供2025年AI创业新机会、个人AI创业项目推荐、AI创业经验分享。深度解析AI创业失败教训、AI创业成功案例和实战经验，帮助如何开始AI创业。适合大学生AI创业方向选择和非技术AI创业入门。",
  keywords: [
    // Brand keywords (essential for brand recognition)
    "创业洞察 ButtonUp", "ButtonUp AI创业", "ButtonUp 创业洞察",
    
    // Core long-tail keywords (low competition KD 0-30)
    "2025年AI创业新机会", "个人AI创业项目推荐", "AI创业经验分享",
    "Reddit AI创业讨论汇总", "AI创业失败教训", "AI创业成功案例",
    "如何开始AI创业", "AI创业需要什么技能", "大学生AI创业方向",
    "非技术AI创业入门", "AI创业机会发现", "AI创业者心得",
    "AI创业项目推荐", "个人AI创业入门", "AI创业趋势分析",
    "AI创业案例研究", "AI创业实战经验", "AI创业入门指南"
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
    title: "创业洞察 ButtonUp - AI Startups 每日创业讨论汇总, AI创业故事, AI创业机会发现, AI行业洞察报告",
    description: "每日汇总Reddit上的AI创业讨论，为AI创业者提供最新AI洞察和趋势分析。发现AI创业机会，掌握AI行业动态。探索AI创业在startups中的应用。",
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
    description: "每日汇总Reddit上的AI创业讨论，为AI创业者提供最新AI洞察和趋势分析。发现AI创业机会，掌握AI行业动态。探索AI创业在startups中的应用。",
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
    title: "创业洞察 ButtonUp - AI Startups 每日创业讨论汇总, AI创业故事, AI创业机会发现, AI行业洞察报告"
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
            // Enable enhanced measurement for better UTM tracking
            enhanced_measurement_settings: {
              scrolls_enabled: true,
              outbound_clicks_enabled: true,
              site_search_enabled: true,
              video_engagement_enabled: true,
              file_downloads_enabled: true
            },
            // Ensure UTM parameters are properly captured
            campaign_content: new URLSearchParams(window.location.search).get('utm_content'),
            campaign_id: new URLSearchParams(window.location.search).get('utm_id'),
            campaign_medium: new URLSearchParams(window.location.search).get('utm_medium'),
            campaign_name: new URLSearchParams(window.location.search).get('utm_campaign'),
            campaign_source: new URLSearchParams(window.location.search).get('utm_source'),
            campaign_term: new URLSearchParams(window.location.search).get('utm_term'),
            // Custom parameters for better tracking
            custom_map: {
              'custom_parameter_1': 'utm_content',
              'custom_parameter_2': 'utm_term'
            }
          });
          
          // Track page views with UTM parameters
          gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            utm_source: new URLSearchParams(window.location.search).get('utm_source'),
            utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
            utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
            utm_content: new URLSearchParams(window.location.search).get('utm_content'),
            utm_term: new URLSearchParams(window.location.search).get('utm_term')
          });
        `}
      </Script>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <UTMTracker />
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
