"use client"

import Link from "next/link"
import { Event } from "@/types"
import { timeAgo, CATEGORY_LABELS, eventUrl } from "@/lib/utils"

const CAT_COLOR: Record<string, string> = {
  siyaset: "#ef4444", ekonomi: "#10b981", "savas-catisma": "#ef4444",
  diplomasi: "#3b82f6", teknoloji: "#8b5cf6", saglik: "#14b8a6",
  cevre: "#22c55e", spor: "#f59e0b", kultur: "#ec4899", diger: "#71717a",
}

interface Props {
  events: Event[]
}

export default function RelatedNews({ events }: Props) {
  const withImages = events.filter(e => e.image_url)
  if (withImages.length === 0) return null

  return (
    <div style={{ marginTop: 48 }}>
      <h3 style={{
        fontSize: 14,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "var(--color-text-2)",
        marginBottom: 20,
      }}>
        İlginizi Çekebilecek Haberler
      </h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 14,
      }}>
        {withImages.map(event => {
          const catColor = CAT_COLOR[event.category] || "#71717a"
          return (
            <Link
              key={event.id}
              href={eventUrl(event.id, event.title_tr, event.category)}
              style={{
                textDecoration: "none",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                transition: "border-color 0.15s, transform 0.15s",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {event.image_url && (
                <div className="related-news-img" style={{ height: 100, overflow: "hidden" }}>
                  <img
                    src={event.image_url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    referrerPolicy="no-referrer"
                    onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none" }}
                  />
                </div>
              )}
              <div style={{ padding: "12px 14px", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: catColor,
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    {CATEGORY_LABELS[event.category] || event.category}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--color-text-3)" }} suppressHydrationWarning>
                    {timeAgo(event.published_at ?? event.created_at)}
                  </span>
                </div>
                <p style={{
                  fontSize: 13, fontWeight: 500, color: "var(--color-text)",
                  lineHeight: 1.4,
                }} className="line-clamp-3">
                  {event.title_tr}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
