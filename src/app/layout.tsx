import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { DEFAULT_APP_LOCALE } from "@/components/app-locale"
import { Toaster } from "@/components/ui/sonner"

const geistSans = localFont({
  src: [
    {
      path: "./fonts/geist-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/geist-latin-ext.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
})

const geistMono = localFont({
  src: [
    {
      path: "./fonts/geist-mono-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/geist-mono-latin-ext.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
})

type LayoutParams = {
  language?: string
}

type RootLayoutProps = Readonly<{
  children: React.ReactNode
  params: Promise<LayoutParams>
}>

type MetadataProps = {
  params: Promise<LayoutParams>
}

type LocalizedMetadataText = {
  title: string
  description: string
  locale: string
  keywords: string[]
}

const metadataTextByLocale: Record<"zh" | "en", LocalizedMetadataText> = {
  zh: {
    title: "Oxmon Web",
    description: "Oxmon 服务器监控平台 Web 控制台",
    locale: "zh_CN",
    keywords: ["Oxmon", "服务器监控", "告警", "指标", "证书监控", "运维平台"],
  },
  en: {
    title: "Oxmon Web",
    description: "Web interface for Oxmon server monitoring",
    locale: "en_US",
    keywords: ["Oxmon", "server monitoring", "alerts", "metrics", "certificate monitoring", "operations dashboard"],
  },
}

function resolveLocale(language?: string): "zh" | "en" {
  if (language === "zh" || language === "en") {
    return language
  }

  return DEFAULT_APP_LOCALE
}

function resolveMetadataBase() {
  const origin = process.env.NEXT_PUBLIC_APP_URL

  if (!origin) {
    return undefined
  }

  try {
    return new URL(origin)
  } catch {
    return undefined
  }
}

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { language } = await params
  const locale = resolveLocale(language)
  const { title, description, locale: ogLocale, keywords } = metadataTextByLocale[locale]

  return {
    metadataBase: resolveMetadataBase(),
    title,
    description,
    keywords,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        zh: "/zh",
        en: "/en",
        "x-default": "/zh",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/${locale}`,
      locale: ogLocale,
      siteName: "Oxmon Web",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { language } = await params
  const locale = resolveLocale(language)

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
