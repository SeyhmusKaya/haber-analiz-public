import Link from "next/link"
import { eventUrl } from "@/lib/utils"

interface OnThisDayEvent {
  id: number
  title_tr: string
  created_at: string
  category?: string
}

interface OnThisDayProps {
  events: OnThisDayEvent[]
}

export default function OnThisDay({ events }: OnThisDayProps) {
  const now = new Date()
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

  const matching = events
    .filter((e) => {
      const d = new Date(e.created_at)
      return (
        d.getMonth() === oneYearAgo.getMonth() &&
        d.getDate() === oneYearAgo.getDate() &&
        d.getFullYear() === oneYearAgo.getFullYear()
      )
    })
    .slice(0, 3)

  // If no events from exactly 1 year ago, show most recent 3 as fallback
  const display = matching.length > 0 ? matching : events.slice(0, 3)

  if (display.length === 0) return null

  return (
    <section
      style={{
        background: "var(--bg-card)",
        borderRadius: 12,
        padding: 20,
        border: "1px solid var(--border)",
      }}
    >
      <h3
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span role="img" aria-label="takvim">
          &#x1F4C5;
        </span>
        Tarihte Bugun
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {display.map((event) => {
          const date = new Date(event.created_at)
          const formatted = date.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })

          return (
            <Link
              key={event.id}
              href={eventUrl(event.id, event.title_tr, event.category)}
              style={{
                display: "block",
                padding: 12,
                borderRadius: 8,
                background: "var(--bg-secondary)",
                textDecoration: "none",
                transition: "all 200ms ease",
                border: "1px solid transparent",
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  lineHeight: 1.5,
                  margin: 0,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {event.title_tr}
              </p>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  marginTop: 4,
                  display: "block",
                }}
              >
                {formatted}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
