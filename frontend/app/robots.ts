import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://medyaizle.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/haber/", "/arama", "/kaynaklar/", "/medya-okuryazarligi/", "/raporlar/", "/hakkimizda", "/iletisim", "/sikca-sorulan-sorular"],
        disallow: ["/admin/", "/profil/", "/api/", "/giris", "/kayit", "/premium", "/embed/"],
      },
      {
        // Googlebot için özel optimizasyon
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/profil/", "/api/"],
      },
      {
        // Haber crawlerları için açık
        userAgent: "Googlebot-News",
        allow: "/haber/",
        disallow: [],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
