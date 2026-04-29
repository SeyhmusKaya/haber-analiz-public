"use client"

import { useState, useEffect, useCallback } from "react"
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

export default function HeroSlider({ events }: Props) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % events.length)
  }, [events.length])

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + events.length) % events.length)
  }, [events.length])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  if (events.length === 0) return null

  const event = events[current]
  const catColor = CAT_COLOR[event.category] || "#71717a"
  const label = CATEGORY_LABELS[event.category] || event.category

  return (
    <>
      {/* ── Desktop slider (hidden on mobile) ── */}
      <div className="hero-slider-desktop" style={{
        position: "relative",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        height: "clamp(300px, 55vw, 460px)",
        marginBottom: 24,
      }}>
        {event.image_url ? (
          <>
            <div style={{
              position: "absolute", inset: -20,
              backgroundImage: `url(${event.image_url})`,
              backgroundSize: "cover", backgroundPosition: "center",
              filter: "blur(20px) brightness(0.4)",
              transform: "scale(1.1)",
            }} />
            <img
              src={event.image_url}
              alt={event.title_tr}
              style={{
                position: "absolute", right: 0, top: 0, bottom: 0,
                width: "55%", height: "100%",
                objectFit: "cover", objectPosition: "center",
                maskImage: "linear-gradient(to right, transparent 0%, black 30%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 30%)",
              }}
              loading="eager"
              referrerPolicy="no-referrer"
              onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
            />
          </>
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(135deg, ${catColor}40 0%, #0f0f0f 100%)`,
          }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.05) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)" }} />
        <Link href={eventUrl(event.id, event.title_tr, event.category)} style={{ textDecoration: "none" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "clamp(16px, 4vw, 32px) clamp(14px, 3vw, 28px)", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: catColor, padding: "3px 10px", borderRadius: 99 }}>{label}</span>
              {event.video_url && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "rgba(239,68,68,0.85)", padding: "3px 9px", borderRadius: 99, display: "flex", alignItems: "center", gap: 4 }}>▶ Video</span>}
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }} suppressHydrationWarning>{timeAgo(event.published_at ?? event.created_at)}</span>
            </div>
            <h2 style={{ fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 700, color: "#fff", lineHeight: 1.3, letterSpacing: "-0.01em", maxWidth: 700 }}>{event.title_tr}</h2>
            <p className="mobile-hide line-clamp-2" style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, maxWidth: 600 }}>{event.summary_tr}</p>
          </div>
        </Link>
        <button onClick={prev} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <button onClick={next} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        <div style={{ position: "absolute", bottom: 14, right: 28, display: "flex", gap: 6 }}>
          {events.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? 20 : 8, height: 8, borderRadius: 99, background: i === current ? "#fff" : "rgba(255,255,255,0.35)", border: "none", cursor: "pointer", transition: "all 0.3s ease" }} />
          ))}
        </div>
      </div>

      {/* ── Mobile slider (hidden on desktop) ── */}
      <div className="hero-slider-mobile" style={{ marginBottom: 16 }}>
        <Link href={eventUrl(event.id, event.title_tr, event.category)} style={{ textDecoration: "none", display: "block" }}>
          {event.image_url ? (
            <div style={{ height: 220, borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", overflow: "hidden" }}>
              <img
                src={event.image_url}
                alt={event.title_tr}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                loading="eager"
                referrerPolicy="no-referrer"
                onError={e => { (e.target as HTMLImageElement).parentElement!.style.background = `linear-gradient(135deg, ${catColor}40, #0f0f0f)` }}
              />
            </div>
          ) : (
            <div style={{ height: 100, borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", background: `linear-gradient(135deg, ${catColor}40, #0f0f0f)` }} />
          )}
          <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderTop: "none",
            borderRadius: "0 0 var(--radius-xl) var(--radius-xl)",
            padding: "14px 16px 16px",
            minHeight: 120,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#fff", background: catColor, padding: "3px 9px", borderRadius: 99 }}>{label}</span>
              {event.video_url && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "rgba(239,68,68,0.85)", padding: "3px 8px", borderRadius: 99 }}>▶ Video</span>}
              <span style={{ fontSize: 11, color: "var(--color-text-3)" }} suppressHydrationWarning>{timeAgo(event.published_at ?? event.created_at)}</span>
            </div>
            <h2 className="line-clamp-2" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)", lineHeight: 1.35, letterSpacing: "-0.01em", marginBottom: 4 }}>{event.title_tr}</h2>
            {event.summary_tr && (
              <p className="line-clamp-2" style={{ fontSize: 13, color: "var(--color-text-3)", lineHeight: 1.5 }}>{event.summary_tr}</p>
            )}
          </div>
        </Link>
        {/* Navigation row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingInline: 4 }}>
          <button onClick={prev} style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <div style={{ display: "flex", gap: 6 }}>
            {events.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? 18 : 7, height: 7, borderRadius: 99, background: i === current ? "var(--color-accent)" : "var(--color-border)", border: "none", cursor: "pointer", transition: "all 0.3s ease" }} />
            ))}
          </div>
          <button onClick={next} style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </div>
      </div>
    </>
  )
}
