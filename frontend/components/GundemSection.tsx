"use client"

import React from "react"
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
  title?: React.ReactNode
  moreHref?: string
  showSources?: boolean
}

export default function GundemSection({ events, title = "🗞️ Dünya Gündemi", moreHref = "/dunyadan-haberler", showSources = false }: Props) {
  // Sadece resmi olan haberleri göster
  const filtered = events.filter(e => e.image_url)
  if (filtered.length === 0) return null

  return (
    <div style={{
      marginBottom: 24,
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "20px 20px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{
          fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 700,
          letterSpacing: "-0.02em", color: "var(--color-text)",
          display: "flex", alignItems: "center", gap: 8, margin: 0,
        }}>
          {title}
        </h2>
        <Link href={moreHref} style={{
          fontSize: 12, color: "var(--color-accent)", textDecoration: "none",
          fontWeight: 500,
        }}>
          Tümünü gör →
        </Link>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 10,
      }}>
        {filtered.map((event) => {
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
                display: "flex",
                flexDirection: "column",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
            >
              {event.image_url && (
                <div style={{ height: 110, overflow: "hidden", flexShrink: 0 }}>
                  <img
                    src={event.image_url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    referrerPolicy="no-referrer"
                    onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none" }}
                  />
                </div>
              )}
              <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: catColor,
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    {CATEGORY_LABELS[event.category] || event.category}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--color-text-3)" }} suppressHydrationWarning>
                    {timeAgo(event.published_at ?? event.created_at)}
                  </span>
                </div>
                <p style={{
                  fontSize: 12, fontWeight: 600, color: "var(--color-text)",
                  lineHeight: 1.4, flex: 1,
                }} className="line-clamp-3">
                  {event.title_tr}
                </p>
                <span style={{ fontSize: 10, color: "var(--color-text-3)" }}>
                  {showSources ? `${event.article_count ?? 0} kaynak` : `${event.country_codes?.length ?? 0} ülke`}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
