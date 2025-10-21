import Header from "@/components/Header";
import { FileText, Download, ArrowRight, Home, ChevronRight, Wrench } from "lucide-react";
import Link from "next/link";

// Enable ISR - revalidate every 30 minutes using Next.js built-in ISR
export const revalidate = 300;

// Add metadata for tools page
export const metadata = {
  title: "在线工具 - ButtonUp 创业洞察",
  description: "ButtonUp 提供的免费在线工具集合，包括文件转换、PDF转文本等实用工具，助力创业者和内容创作者提高工作效率。",
  keywords: "在线工具,文件转换,PDF转换,DOCX转换,PPTX转换,免费工具,创业工具,内容创作工具",
  alternates: {
    canonical: 'https://buttonup.cloud/tools/',
  },
  openGraph: {
    title: "在线工具 - ButtonUp 创业洞察",
    description: "ButtonUp 提供的免费在线工具集合，包括文件转换、PDF转文本等实用工具，助力创业者和内容创作者提高工作效率。",
    url: "https://buttonup.cloud/tools/",
    siteName: "ButtonUp 创业洞察",
    images: [
      {
        url: "https://buttonup.cloud/og-image.png",
        width: 1200,
        height: 630,
        alt: "ButtonUp 在线工具",
      },
    ],
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "在线工具 - ButtonUp 创业洞察",
    description: "ButtonUp 提供的免费在线工具集合，包括文件转换、PDF转文本等实用工具，助力创业者和内容创作者提高工作效率。",
    images: ["https://buttonup.cloud/og-image.png"],
  },
};

export default function ToolsPage() {
  // Generate structured data for tools page
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ButtonUp 在线工具",
    "url": "https://buttonup.cloud/tools/",
    "description": "ButtonUp 提供的免费在线工具集合，包括文件转换、PDF转文本等实用工具，助力创业者和内容创作者提高工作效率。",
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
    "description": "每日汇总Reddit创业社区讨论精华，专注AI创业内容分享。深度解析Reddit上AI创业者的真实经验、失败教训和成功案例。"
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
      }
    ]
  };

  const itemListStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "ButtonUp 在线工具集合",
    "description": "免费在线工具，包括文件转换、PDF转文本等实用工具",
    "numberOfItems": 1,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "SoftwareApplication",
          "name": "文件转换工具",
          "description": "支持 PDF、DOCX、PPTX 文件转换为文本的免费在线工具",
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
          }
        }
      }
    ]
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "ButtonUp 提供哪些免费在线工具？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ButtonUp 目前提供文件转换工具，支持 PDF、DOCX、PPTX 文件转换为文本格式。所有工具完全免费使用，无需注册，支持最大5MB文件上传，转换后立即销毁文件确保隐私安全。"
        }
      },
      {
        "@type": "Question",
        "name": "文件转换工具支持哪些文件格式？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "我们的文件转换工具支持 PDF、DOCX（Word文档）和 PPTX（PowerPoint演示文稿）三种格式。转换后的文本可以复制到剪贴板或下载为 .txt 文件。"
        }
      },
      {
        "@type": "Question",
        "name": "使用这些工具是否安全？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "完全安全。我们不会存储或缓存用户上传的文件，转换完成后立即销毁。所有文件处理都在服务器端进行，确保您的文件隐私和数据安全。"
        }
      },
      {
        "@type": "Question",
        "name": "文件大小限制是多少？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "目前支持最大5MB的文件上传。如果您的文件超过此限制，建议先压缩文件或分批处理。我们正在持续优化服务，未来可能会提高文件大小限制。"
        }
      }
    ]
  };

  const tools = [
    {
      id: "file-converter",
      name: "文件转换工具",
      description: "支持 PDF、DOCX、PPTX 文件转换为文本",
      icon: FileText,
      href: "/tools/file-converter",
      features: ["PDF转文本", "DOCX转文本", "PPTX转文本", "支持下载", "免费使用"],
      status: "available"
    }
  ];

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
          __html: JSON.stringify(itemListStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData)
        }}
      />
      
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 md:pt-12 pb-8 sm:pb-12">
        
        {/* Breadcrumb Navigation */}
        <nav className="mb-8" aria-label="面包屑导航">
          <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <li>
              <Link 
                href="/" 
                className="flex items-center hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                <Home className="w-4 h-4 mr-1" />
                首页
              </Link>
            </li>
            <li>
              <ChevronRight className="w-4 h-4" />
            </li>
            <li className="text-gray-900 dark:text-gray-100 font-medium">
              在线工具
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mr-4">
              <Wrench className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-3 sm:mb-4">
                在线工具
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl">
                免费实用的在线工具集合，助力创业者和内容创作者提高工作效率
              </p>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="group w-full"
              >
                <article className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-400 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col group-hover:-translate-y-1 min-h-[280px] sm:min-h-[320px]">
                  
                  {/* Tool Icon Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex items-center">
                        {tool.status === 'available' && (
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-200 dark:border-green-600/30">
                            可用
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors mb-3">
                      {tool.name}
                    </h3>
                  </div>

                  {/* Tool Description */}
                  <div className="px-6 pb-6 flex-1 flex flex-col">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 flex-1">
                      {tool.description}
                    </p>

                    {/* Features */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {tool.features.map((feature, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full font-medium"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 mt-auto">
                      <button className="w-full inline-flex items-center justify-center px-4 py-3 border border-orange-200 dark:border-orange-600 rounded-lg text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-500 transition-colors">
                        使用工具
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>


        {/* Features Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              为什么选择我们的工具？
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              我们致力于为创业者和内容创作者提供简单、安全、高效的在线工具
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                完全免费
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                所有工具完全免费使用，无需注册，无隐藏费用
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                隐私安全
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                文件处理完成后立即销毁，不会存储或缓存您的数据
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                简单易用
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                直观的用户界面，无需学习成本，上传文件即可使用
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 py-6 sm:py-8 mt-8 sm:mt-12 md:mt-16">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 text-center text-gray-600 dark:text-gray-400">
          <div className="space-y-3">
            <p className="text-sm">
              &copy; 2024 创业洞察 buttonup. 汇总创业智慧，洞察行业趋势.
              <span className="mx-2">|</span>
              <a href="mailto:myladyyang@gmail.com" className="text-sm">
                myladyyang@gmail.com
              </a>{" "}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
