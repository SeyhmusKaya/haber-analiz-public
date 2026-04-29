"use client"

import { useEffect, useState } from "react"
import { Tweet } from "@/types"
import { getTweets } from "@/lib/api"

const TR_STOP = new Set([
  've', 'ile', 'için', 'bir', 'bu', 'de', 'da', 'ki', 'ya', 'ne', 'o', 'en',
  'çok', 'daha', 'olan', 'olarak', 'gibi', 'kadar', 'sonra', 'önce', 'her',
  'mi', 'mu', 'mü', 'mı', 'ise', 'ama', 'fakat', 'ancak', 'üzere', 'göre',
  'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'is', 'are', 'was',
  'were', 'be', 'been', 'has', 'have', 'had', 'with', 'from', 'by', 'as',
  'its', 'over', 'after', 'that', 'this', 'than', 'into', 'but', 'not',
  'says', 'said', 'amid',
])

function extractKeywords(title: string): string[] {
  return title
    .replace(/['".,!?;:()]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !TR_STOP.has(w.toLowerCase()))
    .slice(0, 4)
}

function TweetSkeleton() {
  return (
    <div style={{
      padding: "16px 18px",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-md)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-border)", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ width: "40%", height: 12, borderRadius: 4, background: "var(--color-border)" }} />
          <div style={{ width: "25%", height: 10, borderRadius: 4, background: "var(--color-border)" }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ width: "100%", height: 12, borderRadius: 4, background: "var(--color-border)" }} />
        <div style={{ width: "85%", height: 12, borderRadius: 4, background: "var(--color-border)" }} />
        <div style={{ width: "60%", height: 12, borderRadius: 4, background: "var(--color-border)" }} />
      </div>
    </div>
  )
}

function TweetCard({ tweet }: { tweet: Tweet }) {
  const initial = (tweet.fullname || tweet.username || "?")[0].toUpperCase()
  const colors = ["#1d9bf0", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"]
  const color = colors[(initial.charCodeAt(0) || 0) % colors.length]

  return (
    <a
      href={tweet.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        padding: "16px 18px",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        textDecoration: "none",
        transition: "border-color 0.15s, background 0.15s",
        background: "var(--color-surface)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "#1d9bf0"
        e.currentTarget.style.background = "rgba(29,155,240,0.03)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--color-border)"
        e.currentTarget.style.background = "var(--color-surface)"
      }}
    >
      {/* Header: avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          color: "#fff",
          flexShrink: 0,
        }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {tweet.fullname || tweet.username}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-3)" }}>
            {tweet.username} {tweet.date && <span style={{ marginLeft: 4 }}>· {tweet.date}</span>}
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d9bf0" style={{ flexShrink: 0, opacity: 0.8 }}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.258 5.639 5.907-5.639Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </div>

      {/* Content */}
      <p style={{
        fontSize: 14,
        lineHeight: 1.6,
        color: "var(--color-text-2)",
        margin: 0,
        marginBottom: 12,
        wordBreak: "break-word",
      }}>
        {tweet.content}
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: 20 }}>
        {[
          { icon: "💬", val: tweet.replies, label: "yanıt" },
          { icon: "🔁", val: tweet.retweets, label: "RT" },
          { icon: "❤️", val: tweet.likes, label: "beğeni" },
        ].map(({ icon, val, label }) => val && val !== "0" ? (
          <span key={label} style={{ fontSize: 12, color: "var(--color-text-3)", display: "flex", alignItems: "center", gap: 4 }}>
            <span>{icon}</span>
            <span>{val}</span>
          </span>
        ) : null)}
      </div>
    </a>
  )
}

export default function TwitterEmbed({ title }: { title: string }) {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)

  const keywords = extractKeywords(title)
  const query = keywords.join(" ")
  const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(query)}&f=live`

  useEffect(() => {
    if (!query) {
      setLoading(false)
      setEmpty(true)
      return
    }

    setLoading(true)
    setEmpty(false)

    getTweets(query).then(data => {
      setTweets(data)
      setEmpty(data.length === 0)
    }).catch(() => {
      setEmpty(true)
    }).finally(() => {
      setLoading(false)
    })
  }, [query])

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#1d9bf0" }}>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.258 5.639 5.907-5.639Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Twitter&apos;da bu haber
          </span>
          {loading && (
            <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>yükleniyor...</span>
          )}
          {!loading && !empty && (
            <span style={{
              fontSize: 11,
              color: "#1d9bf0",
              background: "rgba(29,155,240,0.1)",
              padding: "2px 8px",
              borderRadius: 99,
            }}>
              {tweets.length} tweet
            </span>
          )}
        </div>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: "var(--color-accent)", textDecoration: "none" }}
        >
          Tümünü gör ↗
        </a>
      </div>

      {/* Skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <TweetSkeleton />
          <TweetSkeleton />
          <TweetSkeleton />
        </div>
      )}

      {/* Tweets */}
      {!loading && !empty && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tweets.map((tweet, i) => (
            <TweetCard key={i} tweet={tweet} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && empty && (
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            textDecoration: "none",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#1d9bf0"
            e.currentTarget.style.background = "rgba(29,155,240,0.04)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "var(--color-border)"
            e.currentTarget.style.background = "var(--color-surface)"
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {keywords.map(kw => (
              <span key={kw} style={{
                fontSize: 13, fontWeight: 500, color: "var(--color-text)",
                background: "var(--color-surface-2)", padding: "3px 10px",
                borderRadius: 99, border: "1px solid var(--color-border)",
              }}>
                {kw}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1d9bf0", whiteSpace: "nowrap", marginLeft: 16 }}>
            Twitter&apos;da Ara ↗
          </span>
        </a>
      )}
    </div>
  )
}
