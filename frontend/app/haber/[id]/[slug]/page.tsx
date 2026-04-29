import { notFound, redirect } from "next/navigation"
import { getEvent, getRelatedEvents } from "@/lib/api"
import { timeAgo, CATEGORY_LABELS, eventUrl } from "@/lib/utils"
import HaberDetayClient from "../HaberDetayClient"
import ReadSaveActions from "@/components/ReadSaveActions"
import SiteChatbot from "@/components/SiteChatbot"
import HeroImage from "@/components/HeroImage"
import ActionSidebar from "@/components/ActionSidebar"
import AdBanner from "@/components/AdBanner"
import CommentSection from "@/components/CommentSection"
import BookmarkButton from "@/components/BookmarkButton"
import AiFlagButton from "@/components/AiFlagButton"
import SummaryBox from "@/components/SummaryBox"
import type { Metadata } from "next"

const CAT_COLOR: Record<string, string> = {
  siyaset: "#ef4444", ekonomi: "#10b981", "savas-catisma": "#ef4444",
  diplomasi: "#3b82f6", teknoloji: "#8b5cf6", saglik: "#14b8a6",
  cevre: "#22c55e", spor: "#f59e0b", kultur: "#ec4899", diger: "#71717a",
}
const CAT_BG: Record<string, string> = {
  siyaset: "rgba(239,68,68,0.1)", ekonomi: "rgba(16,185,129,0.1)",
  "savas-catisma": "rgba(239,68,68,0.12)", diplomasi: "rgba(59,130,246,0.1)",
  teknoloji: "rgba(139,92,246,0.1)", saglik: "rgba(20,184,166,0.1)",
  cevre: "rgba(34,197,94,0.1)", spor: "rgba(245,158,11,0.1)",
  kultur: "rgba(236,72,153,0.1)", diger: "rgba(113,113,122,0.1)",
}

interface PageProps {
  params: Promise<{ id: string; slug: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://medyaizle.com"

/**
 * Handles both URL formats:
 *  - New: /haber/siyaset/123-haber-adi  → params.id = "siyaset", params.slug = "123-haber-adi"
 *  - Old: /haber/123/eski-slug           → params.id = "123",     params.slug = "eski-slug"
 */
function parseEventId(id: string, slug: string): number | null {
  // New format: first segment is a category, ID is at the start of slug
  const fromSlug = slug.match(/^(\d+)/)
  if (fromSlug) return parseInt(fromSlug[1])
  // Old format: first segment is the numeric ID
  if (/^\d+$/.test(id)) return parseInt(id)
  return null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, slug } = await params
  const eventId = parseEventId(id, slug)
  if (!eventId) return { title: "Haber | Medya İzle" }
  try {
    const event = await getEvent(eventId)
    const desc = event.summary_tr?.slice(0, 160) || "Dünya medyasının yandaş ve muhalif bakış açılarını yapay zeka ile karşılaştırın."
    const canonicalUrl = `${SITE_URL}${eventUrl(eventId, event.title_tr, event.category)}`
    const ogImage = event.image_url
      ? [{ url: event.image_url, width: 1200, height: 630, alt: event.title_tr }]
      : [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: event.title_tr }]

    const categoryLabel = CATEGORY_LABELS[event.category] || event.category
    const countryNames = (event.available_countries || []).map((c: { name: string }) => c.name).filter(Boolean)
    const titleWords = event.title_tr.split(/\s+/).filter((w: string) => w.length > 3)
    const allKeywords = [...new Set([
      ...titleWords,
      ...countryNames,
      categoryLabel,
      "haber analizi", "medya karşılaştırma", "yapay zeka haber",
      "yandaş muhalif medya", event.category,
    ])].filter(Boolean)
    const allTags = [...new Set([categoryLabel, ...countryNames, "haber analizi", "medya karşılaştırma"])].filter(Boolean)

    return {
      title: event.title_tr,
      description: desc,
      keywords: allKeywords,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: event.title_tr,
        description: desc,
        type: "article",
        url: canonicalUrl,
        siteName: "Medya İzle",
        locale: "tr_TR",
        images: ogImage,
        publishedTime: event.created_at,
        modifiedTime: event.updated_at || event.created_at,
        section: categoryLabel,
        tags: allTags,
        authors: ["Medya İzle"],
      },
      twitter: {
        card: "summary_large_image",
        title: event.title_tr,
        description: desc,
        images: ogImage.map(i => i.url),
        site: "@medyaizle",
      },
    }
  } catch {
    return { title: "Haber | Medya İzle" }
  }
}

export default async function HaberDetaySlugPage({ params }: PageProps) {
  const { id, slug } = await params
  const eventId = parseEventId(id, slug)
  if (!eventId) notFound()

  let event
  let relatedEvents: import("@/types").Event[] = []
  try {
    event = await getEvent(eventId)
  } catch {
    notFound()
  }

  try {
    const related = await getRelatedEvents(eventId)
    const isTrOnly = event.has_tr_bias && (event.available_countries || []).every((c: { code: string }) => c.code === "TR")
    relatedEvents = isTrOnly
      ? related.events.filter((e: import("@/types").Event) => e.has_tr_bias)
      : related.events
  } catch {
    // related events not critical — page still works
  }

  // Redirect to canonical URL if accessed via old format
  const canonicalPath = eventUrl(eventId, event.title_tr, event.category)
  const currentPath = `/haber/${id}/${slug}`
  if (currentPath !== canonicalPath) {
    redirect(canonicalPath)
  }

  const label = CATEGORY_LABELS[event.category] || event.category
  const catColor = CAT_COLOR[event.category] || "#71717a"
  const catBg = CAT_BG[event.category] || "rgba(113,113,122,0.1)"

  const summaryText = event.summary_tr || ""
  const wordCount = summaryText.split(/\s+/).filter(Boolean).length
  const countryNames = event.available_countries?.map((c: { name: string }) => c.name).filter(Boolean) || []

  const newsJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${SITE_URL}${canonicalPath}`,
    headline: event.title_tr,
    description: summaryText.slice(0, 160),
    articleBody: summaryText,
    wordCount,
    url: `${SITE_URL}${canonicalPath}`,
    datePublished: event.created_at,
    dateModified: event.updated_at || event.created_at,
    inLanguage: "tr-TR",
    ...(event.image_url ? {
      image: { "@type": "ImageObject", url: event.image_url, width: 1200, height: 630 },
    } : {}),
    author: { "@type": "Organization", name: "Medya İzle", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Medya İzle",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png`, width: 200, height: 60 },
    },
    articleSection: label,
    keywords: [label, ...countryNames, "haber analizi", "medya karşılaştırma", "yapay zeka haber"].join(", "),
    about: countryNames.map((name: string) => ({ "@type": "Country", name })),
    isAccessibleForFree: true,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "[data-speakable='summary']"],
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${canonicalPath}` },
  }

  const categoryUrl = `${SITE_URL}/haber/${event.category}`
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Ana Sayfa",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: label,
        item: categoryUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: event.title_tr,
        item: `${SITE_URL}${canonicalPath}`,
      },
    ],
  }

  const truncatedTitle = event.title_tr.length > 50 ? event.title_tr.slice(0, 50) + "..." : event.title_tr

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 0" }}>
        <nav aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
          <style dangerouslySetInnerHTML={{ __html: `.breadcrumb-link{color:var(--color-text-3);text-decoration:none;transition:color .15s}.breadcrumb-link:hover{color:var(--color-accent)}` }} />
          <span style={{ fontSize: 12, color: "var(--color-text-3)", lineHeight: 1.5 }}>
            <a href="/" className="breadcrumb-link">Ana Sayfa</a>
            {" › "}
            <a href={`/dunyadan-haberler?category=${event.category}`} className="breadcrumb-link">{label}</a>
            {" › "}
            <span style={{ color: "var(--color-text-3)" }}>{truncatedTitle}</span>
          </span>
        </nav>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-text-3)", textDecoration: "none" }}>
            ← Geri
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ReadSaveActions eventId={eventId} />
            <BookmarkButton eventId={eventId} />
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
              color: catColor, background: catBg, padding: "4px 10px", borderRadius: 99,
            }}>
              {label}
            </span>
          </div>
        </div>

        <h1 style={{
          fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 700, lineHeight: 1.3,
          letterSpacing: "-0.02em", color: "var(--color-text)", marginBottom: 14,
        }}>
          {event.title_tr}
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--color-text-3)", marginBottom: 28 }}>
          <time dateTime={event.published_at ?? event.created_at} suppressHydrationWarning>🕐 {timeAgo(event.published_at ?? event.created_at)}</time>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--color-border)" }} />
          <span>{event.article_count} kaynaktan derlendi</span>
        </div>

        {(event.image_url || event.video_url) && (
          <HeroImage src={event.image_url ?? ""} alt={event.title_tr} videoUrl={event.video_url} />
        )}

        {event.summary_tr && (
          <SummaryBox title={event.title_tr} summary={event.summary_tr} eventId={eventId} />
        )}

        <div style={{ borderTop: "1px solid var(--color-border)", margin: "20px 0 24px" }} />

        <HaberDetayClient event={event} relatedEvents={relatedEvents} />

        <div style={{ margin: "16px 0" }}>
          <AdBanner position="detail-bottom" />
        </div>

        <CommentSection eventId={eventId} />
        <SiteChatbot eventId={eventId} eventTitle={event.title_tr} />
        <ActionSidebar
          eventId={eventId}
          title={event.title_tr}
          imageUrl={event.image_url}
          summary={event.summary_tr}
          countries={event.available_countries}
          audioText={`${event.title_tr}. ${event.summary_tr || ""}`}
          relatedEvents={relatedEvents}
          allCountries={["TR","US","GB","DE","RU","CN","IR","IL","SA","EG"]}
          coveredCountries={event.available_countries.map((c: { code: string }) => c.code)}
          articles={event.articles || []}
          hasTrBias={event.has_tr_bias || false}
        />
      </article>
    </>
  )
}
