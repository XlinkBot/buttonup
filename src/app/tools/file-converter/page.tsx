import { Metadata } from 'next';
import FileConverterClient from './FileConverterClient';

// Add metadata for file converter page
export const metadata: Metadata = {
  title: "文件转换工具 - PDF/DOCX/PPTX转文本 | ButtonUp",
  description: "免费在线文件转换工具，支持PDF、DOCX、PPTX文件转换为文本格式。无需注册，安全可靠，转换后立即销毁文件。最大支持5MB文件上传。",
  keywords: "文件转换,PDF转换,DOCX转换,PPTX转换,PDF转文本,Word转文本,PowerPoint转文本,在线转换,免费工具,文件处理",
  alternates: {
    canonical: 'https://buttonup.cloud/tools/file-converter/',
  },
  openGraph: {
    title: "文件转换工具 - PDF/DOCX/PPTX转文本 | ButtonUp",
    description: "免费在线文件转换工具，支持PDF、DOCX、PPTX文件转换为文本格式。无需注册，安全可靠，转换后立即销毁文件。",
    url: "https://buttonup.cloud/tools/file-converter/",
    siteName: "ButtonUp 创业洞察",
    images: [
      {
        url: "https://buttonup.cloud/og-image.png",
        width: 1200,
        height: 630,
        alt: "ButtonUp 文件转换工具",
      },
    ],
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "文件转换工具 - PDF/DOCX/PPTX转文本 | ButtonUp",
    description: "免费在线文件转换工具，支持PDF、DOCX、PPTX文件转换为文本格式。无需注册，安全可靠。",
    images: ["https://buttonup.cloud/og-image.png"],
  },
};

// Enable ISR - revalidate every 30 minutes using Next.js built-in ISR
export const revalidate = 300;

export default function FileConverterPage() {
  // Generate structured data for file converter page
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ButtonUp 文件转换工具",
    "url": "https://buttonup.cloud/tools/file-converter/",
    "description": "免费在线文件转换工具，支持PDF、DOCX、PPTX文件转换为文本格式",
    "inLanguage": "zh-CN",
    "isPartOf": {
      "@type": "WebSite",
      "name": "ButtonUp 创业洞察",
      "url": "https://buttonup.cloud"
    }
  };

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ButtonUp 创业洞察",
    "url": "https://buttonup.cloud",
    "logo": "https://buttonup.cloud/logo.png",
    "sameAs": [
      "https://twitter.com/buttonup_co"
    ],
    "description": "每日汇总Reddit创业社区讨论精华，专注AI创业内容分享"
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "首页",
        "item": "https://buttonup.cloud/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "在线工具",
        "item": "https://buttonup.cloud/tools/"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "文件转换工具",
        "item": "https://buttonup.cloud/tools/file-converter/"
      }
    ]
  };

  const softwareApplicationStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ButtonUp 文件转换工具",
    "description": "免费在线文件转换工具，支持PDF、DOCX、PPTX文件转换为文本格式",
    "url": "https://buttonup.cloud/tools/file-converter/",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CNY"
    },
    "author": {
      "@type": "Organization",
      "name": "ButtonUp 创业洞察"
    },
    "featureList": [
      "PDF转文本",
      "DOCX转文本", 
      "PPTX转文本",
      "支持下载",
      "免费使用",
      "安全可靠",
      "无需注册"
    ],
    "screenshot": "https://buttonup.cloud/og-image.png"
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "文件转换工具支持哪些文件格式？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "我们的文件转换工具支持三种格式：PDF（便携式文档格式）、DOCX（Microsoft Word文档）和PPTX（Microsoft PowerPoint演示文稿）。转换后的文本可以复制到剪贴板或下载为.txt文件。"
        }
      },
      {
        "@type": "Question",
        "name": "文件大小限制是多少？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "目前支持最大5MB的文件上传。如果您的文件超过此限制，建议先压缩文件或分批处理。我们正在持续优化服务，未来可能会提高文件大小限制。"
        }
      },
      {
        "@type": "Question",
        "name": "使用文件转换工具是否安全？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "完全安全。我们不会存储或缓存用户上传的文件，转换完成后立即销毁。所有文件处理都在服务器端进行，确保您的文件隐私和数据安全。"
        }
      },
      {
        "@type": "Question",
        "name": "转换后的文本质量如何？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "我们的转换工具使用先进的OCR和文档解析技术，能够准确提取文本内容，保持原有的格式和结构。对于扫描的PDF文件，我们使用OCR技术进行文字识别。"
        }
      },
      {
        "@type": "Question",
        "name": "是否需要注册或付费？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "完全免费使用，无需注册。您可以随时上传文件进行转换，没有任何使用限制或隐藏费用。我们致力于为创业者和内容创作者提供免费实用的工具。"
        }
      }
    ]
  };

  const howToStructuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "如何使用ButtonUp文件转换工具",
    "description": "学习如何使用ButtonUp免费文件转换工具将PDF、DOCX、PPTX文件转换为文本",
    "totalTime": "PT2M",
    "supply": [
      {
        "@type": "HowToSupply",
        "name": "需要转换的文件（PDF、DOCX或PPTX格式）"
      }
    ],
    "tool": [
      {
        "@type": "HowToTool",
        "name": "ButtonUp文件转换工具"
      }
    ],
    "step": [
      {
        "@type": "HowToStep",
        "name": "选择文件",
        "text": "点击上传区域选择需要转换的PDF、DOCX或PPTX文件",
        "url": "https://buttonup.cloud/tools/file-converter/#upload"
      },
      {
        "@type": "HowToStep",
        "name": "开始转换",
        "text": "点击'转换为文本'按钮开始处理文件",
        "url": "https://buttonup.cloud/tools/file-converter/#convert"
      },
      {
        "@type": "HowToStep",
        "name": "获取结果",
        "text": "转换完成后，您可以复制文本到剪贴板或下载为.txt文件",
        "url": "https://buttonup.cloud/tools/file-converter/#result"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(howToStructuredData)
        }}
      />

      <FileConverterClient />
    </div>
  );
}