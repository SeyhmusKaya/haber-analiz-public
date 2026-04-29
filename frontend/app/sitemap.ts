import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://medyaizle.com"
const API_URL  = process.env.BACKEND_URL  || "http://localhost:8000"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    // Ana sayfalar
    { url: SITE_URL,                                       lastModified: now,    changeFrequency: "hourly",  priority: 1.0 },
    { url: `${SITE_URL}/arama`,                            lastModified: now,    changeFrequency: "daily",   priority: 0.7 },
    { url: `${SITE_URL}/kaynaklar`,                        lastModified: now,    changeFrequency: "weekly",  priority: 0.6 },
    { url: `${SITE_URL}/konsensus`,                        lastModified: now,    changeFrequency: "daily",   priority: 0.6 },
    { url: `${SITE_URL}/raporlar`,                         lastModified: now,    changeFrequency: "weekly",  priority: 0.5 },
    { url: `${SITE_URL}/arsiv`,                            lastModified: now,    changeFrequency: "daily",   priority: 0.5 },
    { url: `${SITE_URL}/medya-okuryazarligi`,              lastModified: now,    changeFrequency: "weekly",  priority: 0.5 },
    { url: `${SITE_URL}/medya-okuryazarligi/propaganda`,   lastModified: now,    changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/medya-okuryazarligi/yanlilik`,     lastModified: now,    changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/medya-okuryazarligi/dogrulama`,    lastModified: now,    changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/medya-okuryazarligi/dezenformasyon`, lastModified: now,  changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/embed-olusturucu`,                 lastModified: now,    changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/api-docs`,                         lastModified: now,    changeFrequency: "monthly", priority: 0.3 },
    // Kurumsal
    { url: `${SITE_URL}/hakkimizda`,                       lastModified: now,    changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/metodoloji`,                       lastModified: now,    changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/iletisim`,                         lastModified: now,    changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/kullanim-kosullari`,               lastModified: now,    changeFrequency: "yearly",  priority: 0.2 },
    { url: `${SITE_URL}/gizlilik`,                         lastModified: now,    changeFrequency: "yearly",  priority: 0.2 },
    { url: `${SITE_URL}/cerez-politikasi`,                 lastModified: now,    changeFrequency: "yearly",  priority: 0.2 },
    { url: `${SITE_URL}/sikca-sorulan-sorular`,             lastModified: now,    changeFrequency: "monthly", priority: 0.5 },
    // Kategori sayfaları
    { url: `${SITE_URL}/?category=siyaset`,                 lastModified: now,    changeFrequency: "hourly",  priority: 0.7 },
    { url: `${SITE_URL}/?category=ekonomi`,                 lastModified: now,    changeFrequency: "hourly",  priority: 0.7 },
    { url: `${SITE_URL}/?category=savas-catisma`,           lastModified: now,    changeFrequency: "hourly",  priority: 0.7 },
    { url: `${SITE_URL}/?category=diplomasi`,               lastModified: now,    changeFrequency: "hourly",  priority: 0.7 },
    { url: `${SITE_URL}/?category=teknoloji`,               lastModified: now,    changeFrequency: "hourly",  priority: 0.6 },
    { url: `${SITE_URL}/?category=spor`,                    lastModified: now,    changeFrequency: "hourly",  priority: 0.6 },
  ]

  // Dinamik haber sayfaları
  try {
    const res = await fetch(`${API_URL}/api/events?page=1`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      const totalPages = Math.ceil(data.total / 20)

      const pagePromises = Array.from({ length: Math.min(totalPages, 10) }, (_, i) =>
        fetch(`${API_URL}/api/events?page=${i + 1}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )

      const pages = await Promise.all(pagePromises)
      for (const pageData of pages) {
        if (!pageData?.events) continue
        for (const event of pageData.events) {
          const slug = (event.title_tr || "haber")
            .toLowerCase()
            .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
            .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 80)
            .replace(/-$/, "")
          const category = event.category || "diger"
          entries.push({
            url: `${SITE_URL}/haber/${category}/${event.id}-${slug}`,
            lastModified: new Date(event.updated_at || event.created_at),
            changeFrequency: "daily",
            priority: event.importance_score >= 8 ? 0.9 : event.importance_score >= 5 ? 0.8 : 0.7,
          })
        }
      }
    }
  } catch {
    // Backend unreachable - static pages still indexed
  }

  // Dinamik kaynak sayfaları
  try {
    const res = await fetch(`${API_URL}/api/sources`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const sources = await res.json()
      for (const source of sources) {
        if (source.slug) {
          entries.push({
            url: `${SITE_URL}/kaynaklar/${source.slug}`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.5,
          })
        }
      }
    }
  } catch {}

  return entries
}
