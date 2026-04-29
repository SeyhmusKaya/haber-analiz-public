"use client"
import Link from "next/link"
import { Event } from "@/types"
import { eventUrl } from "@/lib/utils"

interface Props { events: Event[] }

export default function NewsTicker({ events }: Props) {
  if (events.length === 0) return null

  const items = [...events, ...events]

  return (
    <div style={{
      background: "var(--color-surface)",
      borderBottom: "1px solid var(--color-border-subtle)",
      display: "flex",
      alignItems: "stretch",
      overflow: "hidden",
      height: 38,
    }}>
      {/* Sol etiket */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        background: "#ef4444",
        flexShrink: 0,
        zIndex: 2,
        gap: 6,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#fff",
          animation: "tickerPulse 1.2s ease-in-out infinite",
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: 11, fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#fff",
          whiteSpace: "nowrap",
        }}>
          Son Dakika
        </span>
      </div>

      {/* Ayraç */}
      <div style={{ width: 1, background: "rgba(239,68,68,0.3)", flexShrink: 0 }} />

      {/* Kayan içerik */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Soldan soluk geçiş */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 32,
          background: "linear-gradient(to right, var(--color-surface), transparent)",
          zIndex: 1, pointerEvents: "none",
        }} />
        {/* Sağdan soluk geçiş */}
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 32,
          background: "linear-gradient(to left, var(--color-surface), transparent)",
          zIndex: 1, pointerEvents: "none",
        }} />

        <div style={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          animation: "tickerScroll 20s linear infinite",
          whiteSpace: "nowrap",
        }}>
          {items.map((event, i) => (
            <Link
              key={`${event.id}-${i}`}
              href={eventUrl(event.id, event.title_tr, event.category)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "0 28px",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-text-2)",
                textDecoration: "none",
                flexShrink: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-accent)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-2)")}
            >
              <span style={{
                width: 4, height: 4, borderRadius: "50%",
                background: "#ef4444", flexShrink: 0,
              }} />
              {event.title_tr}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes tickerPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
