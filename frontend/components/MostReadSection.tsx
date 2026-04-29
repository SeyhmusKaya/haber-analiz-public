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

export default function MostReadSection({ events }: Props) {
  if (events.length === 0) return null

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "18px 20px",
    }}>
      <h3 style={{
        fontSize: 13, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.05em", color: "var(--color-text-2)",
        marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
      }}>
        📈 Çok Okunanlar
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {events.map((event, i) => (
          <Link
            key={event.id}
            href={eventUrl(event.id, event.title_tr, event.category)}
            style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "9px 8px", borderRadius: "var(--radius-md)",
              textDecoration: "none", transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--color-surface-2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{
              fontSize: 15, fontWeight: 800,
              color: i < 3 ? "var(--color-accent)" : "var(--color-text-3)",
              minWidth: 22, lineHeight: 1, marginTop: 2,
            }}>
              {i + 1}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 500, color: "var(--color-text)",
                lineHeight: 1.4, marginBottom: 4,
              }} className="line-clamp-2">
                {event.title_tr}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: CAT_COLOR[event.category] || "#71717a",
                }}>
                  {CATEGORY_LABELS[event.category] || event.category}
                </span>
                <span style={{ fontSize: 11, color: "var(--color-text-3)" }} suppressHydrationWarning>
                  {timeAgo(event.published_at ?? event.created_at)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
