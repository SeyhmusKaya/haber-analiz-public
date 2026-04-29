"use client"

import Link from "next/link"
import { useState } from "react"
import { Event } from "@/types"
import { timeAgo, CATEGORY_LABELS, eventUrl } from "@/lib/utils"

function flagUrl(code: string) {
  return `https://flagcdn.com/w20/${code.toLowerCase()}.png`
}

const CAT_COLOR: Record<string, string> = {
  siyaset: "#ef4444",
  ekonomi: "#10b981",
  "savas-catisma": "#ef4444",
  diplomasi: "#3b82f6",
  teknoloji: "#8b5cf6",
  saglik: "#14b8a6",
  cevre: "#22c55e",
  spor: "#f59e0b",
  kultur: "#ec4899",
  diger: "#71717a",
}

const CAT_BG: Record<string, string> = {
  siyaset: "rgba(239,68,68,0.1)",
  ekonomi: "rgba(16,185,129,0.1)",
  "savas-catisma": "rgba(239,68,68,0.12)",
  diplomasi: "rgba(59,130,246,0.1)",
  teknoloji: "rgba(139,92,246,0.1)",
  saglik: "rgba(20,184,166,0.1)",
  cevre: "rgba(34,197,94,0.1)",
  spor: "rgba(245,158,11,0.1)",
  kultur: "rgba(236,72,153,0.1)",
  diger: "rgba(113,113,122,0.1)",
}

// Category icons for placeholder
const CAT_ICON: Record<string, string> = {
  siyaset: "🏛️",
  ekonomi: "📈",
  "savas-catisma": "⚔️",
  diplomasi: "🤝",
  teknoloji: "💻",
  saglik: "🏥",
  cevre: "🌿",
  spor: "⚽",
  kultur: "🎭",
  diger: "📰",
}

interface Props { event: Event; showTrBiasBadge?: boolean; showSourceCount?: boolean }

function ImagePlaceholder({ category }: { category: string }) {
  const color = CAT_COLOR[category] || "#71717a"
  const icon = CAT_ICON[category] || "📰"
  const label = CATEGORY_LABELS[category] || "Haber"

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
      borderBottom: `1px solid ${color}20`,
    }}>
      <span style={{ fontSize: 28, opacity: 0.5 }}>{icon}</span>
      <span style={{
        fontSize: 11,
        fontWeight: 500,
        color: color,
        opacity: 0.6,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}>
        {label}
      </span>
    </div>
  )
}

export default function NewsCard({ event, showTrBiasBadge, showSourceCount }: Props) {
  const [imgHidden, setImgHidden] = useState(false)

  const label = CATEGORY_LABELS[event.category] || event.category || "Diğer"
  const catColor = CAT_COLOR[event.category] || "#71717a"
  const catBg = CAT_BG[event.category] || "rgba(113,113,122,0.1)"
  const showPlaceholder = !event.image_url || imgHidden

  return (
    <Link
      href={eventUrl(event.id, event.title_tr, event.category)}
      style={{ textDecoration: "none", display: "flex", height: "100%" }}
    >
      <article className="news-card-mobile" style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
        overflow: "hidden",
      }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.borderColor = catColor + "60"
          el.style.transform = "translateY(-2px)"
          el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)"
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.borderColor = "var(--color-border)"
          el.style.transform = "translateY(0)"
          el.style.boxShadow = "none"
        }}
      >
        {/* Hero image — always 160px, placeholder if no image */}
        <div className="news-card-img" style={{
          height: 160,
          flexShrink: 0,
          overflow: "hidden",
          position: "relative",
        }}>
          {showPlaceholder ? (
            <ImagePlaceholder category={event.category} />
          ) : (
            <img
              src={event.image_url!}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              referrerPolicy="no-referrer"
              onLoad={(e) => {
                const img = e.target as HTMLImageElement
                if (img.naturalWidth > 0 && (img.naturalWidth <= 300 || img.naturalHeight <= 300)) {
                  setImgHidden(true)
                }
              }}
              onError={() => setImgHidden(true)}
            />
          )}
          {event.video_url && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.28)",
            }}>
              <div className="video-play-btn" style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid rgba(255,255,255,0.85)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}>
                <span style={{ fontSize: 14, marginLeft: 2, color: "#fff" }}>▶</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="news-card-content" style={{
          padding: "16px 20px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flex: 1,
          minWidth: 0,
        }}>
          {/* Category + time */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: catColor,
                background: catBg,
                padding: "3px 8px",
                borderRadius: 99,
                whiteSpace: "nowrap",
              }}>
                {label}
              </span>
              {(showTrBiasBadge || event.has_tr_bias) && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px 2px 5px",
                  borderRadius: 99,
                  background: "rgba(220,38,38,0.1)",
                  color: "#dc2626",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.03em",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  <img src={flagUrl("tr")} alt="TR" style={{ width: 14, height: 10, objectFit: "cover", borderRadius: 2 }} />
                  Kutuplaşma
                </span>
              )}
            </div>
            <span style={{ fontSize: 12, color: "var(--color-text-3)", whiteSpace: "nowrap" }} suppressHydrationWarning>
              {timeAgo(event.published_at ?? event.created_at)}
            </span>
          </div>

          {/* Title */}
          <h2 className="news-card-title line-clamp-3" style={{
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.45,
            color: "var(--color-text)",
            letterSpacing: "-0.01em",
            flex: 1,
          }}>
            {event.title_tr}
          </h2>

          {/* Summary */}
          <p className="news-card-summary line-clamp-2" style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--color-text-2)",
            minHeight: "2.6em",
          }}>
            {event.summary_tr || ""}
          </p>

          {/* Footer */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 10,
            borderTop: "1px solid var(--color-border-subtle)",
            marginTop: "auto",
          }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {event.country_codes?.slice(0, 5).map(cc => (
                <span key={cc} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  color: "var(--color-text-3)",
                  background: "var(--color-surface-2)",
                  padding: "1px 6px",
                  borderRadius: 4,
                }}>
                  <img src={flagUrl(cc)} alt={cc} style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 2 }} />
                  {cc}
                </span>
              ))}
              {(event.country_codes?.length ?? 0) > 5 && (
                <span style={{ fontSize: 11, color: "var(--color-text-3)", alignSelf: "center" }}>
                  +{event.country_codes!.length - 5}
                </span>
              )}
            </div>
            <span style={{
              fontSize: 12,
              color: "var(--color-text-3)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--color-accent)",
                display: "inline-block",
              }} />
              {showSourceCount ? (event.article_count ?? 0) + " kaynak" : (event.country_codes?.length ?? 0) + " ülke"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
