import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { AuthProvider } from "@/lib/auth"
import CookieBanner from "@/components/CookieBanner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://medyaizle.com"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Medya İzle --- Yapay Zeka ile Haberler",
    template: "%s | Medya İzle",
  },
  description:
    "Yapay zeka destekli haber analizi: aynı haberi dünya medyasının yandaş ve muhalif kaynaklarıyla karşılaştırın. 10 ülkeden 100 kaynakla tarafsız bakış açısı.",
  keywords: [
    "yapay zeka haber analizi",
    "medya analizi",
    "haber karşılaştırma",
    "yandaş muhalif medya",
    "tarafsız haber",
    "dünya haberleri Türkçe",
    "medya yanlılığı",
    "propaganda tespiti",
    "haber okuryazarlığı",
    "medya okuryazarlığı",
    "Türkiye haberleri",
    "uluslararası haber",
    "AI haber analizi",
    "Gemini haber",
    "haber doğrulama",
  ],
  authors: [{ name: "Medya İzle", url: SITE_URL }],
  creator: "Medya İzle",
  publisher: "Medya İzle",
  category: "news",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: SITE_URL,
    siteName: "Medya İzle",
    title: "Medya İzle --- Yapay Zeka ile Haberler",
    description:
      "Yapay zeka destekli haber analizi: aynı haberi dünya medyasının yandaş ve muhalif kaynaklarıyla karşılaştırın.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Medya İzle — Yapay Zeka Destekli Medya Analizi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@medyaizle",
    creator: "@medyaizle",
    title: "Medya İzle --- Yapay Zeka ile Haberler",
    description:
      "Yapay zeka destekli haber analizi: aynı haberi dünya medyasının yandaş ve muhalif kaynaklarıyla karşılaştırın.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "pGA3B9g_jpRTftN9zun1-0P8pK3KL4NSk-cz5-2aCcE",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Medya İzle",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
        width: 200,
        height: 60,
      },
      description:
        "Yapay zeka destekli medya analiz platformu. Aynı haberin farklı ülkelerde ve farklı medya kesimlerinde nasıl yansıtıldığını karşılaştırın.",
      sameAs: [
        "https://twitter.com/medyaizle",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Medya İzle",
      description: "Yapay zeka destekli haber analizi ve medya karşılaştırma platformu",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "tr-TR",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/arama?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google AdSense — data-nscript olmadan head içinde */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4272457897788655"
          crossOrigin="anonymous"
        />
      </head>
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-JECJYVVT18"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-JECJYVVT18');
        `}
      </Script>
      <body className={inter.variable}>
        <AuthProvider>
          <Header />
          <main style={{ minHeight: "calc(100vh - 200px)", paddingBottom: 40 }}>
            {children}
          </main>
          <Footer />
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  )
}
