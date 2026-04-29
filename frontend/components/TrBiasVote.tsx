"use client"

import { useState, useEffect } from "react"

interface Props {
  eventId: number
}

const OPTIONS = [
  { key: "pro_gov",    label: "Yandaş medya haklı",    color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
  { key: "opposition", label: "Muhalif medya haklı",   color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
  { key: "both",       label: "Her ikisi de yanlı",    color: "#d97706", bg: "rgba(217,119,6,0.08)" },
  { key: "undecided",  label: "Karar veremedim",       color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
]

export default function TrBiasVote({ eventId }: Props) {
  const storageKey = `tr_bias_vote_${eventId}`

  const [voted, setVoted] = useState<string | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({ pro_gov: 0, opposition: 0, both: 0, undecided: 0 })
  const [loading, setLoading] = useState(true)

  // Load existing results from backend
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) setVoted(saved)

    fetch(`/api/votes/tr-bias/${eventId}`)
      .then(r => r.json())
      .then(d => {
        setCounts({
          pro_gov: d.pro_gov || 0,
          opposition: d.opposition || 0,
          both: d.both || 0,
          undecided: d.undecided || 0,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [eventId, storageKey])

  async function handleVote(key: string) {
    if (voted) return
    const next = { ...counts, [key]: (counts[key] || 0) + 1 }
    setCounts(next)
    setVoted(key)
    localStorage.setItem(storageKey, key)

    // Send to backend
    try {
      await fetch(`/api/votes/tr-bias/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: key }),
      })
    } catch {}
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 16,
      overflow: "hidden",
    }}>
      {/* Başlık */}
      <div style={{
        padding: "14px 18px",
        borderBottom: "1px solid var(--color-border)",
        display: "flex", alignItems: "center", gap: 10,
        background: "linear-gradient(135deg, rgba(220,38,38,0.04), rgba(22,163,74,0.04))",
      }}>
        <img
          src="https://flagcdn.com/w20/tr.png"
          alt="TR"
          style={{ width: 18, height: 13, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
        />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
            Türkiye Kutuplaşma Anketi
          </div>
          {total > 0 && (
            <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 1 }}>
              {total} okuyucu oy kullandı
            </div>
          )}
        </div>
      </div>

      {/* Soru */}
      <div style={{ padding: "12px 18px 6px", fontSize: 13, color: "var(--color-text-2)", fontWeight: 500 }}>
        Bu haberde sizce kim daha doğru yaklaşım sergiledi?
      </div>

      {/* Seçenekler */}
      <div style={{ padding: "6px 14px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
        {OPTIONS.map(opt => {
          const isMyVote = voted === opt.key
          const count    = counts[opt.key] || 0
          const pct      = total > 0 ? Math.round((count / total) * 100) : 0

          return (
            <button
              key={opt.key}
              onClick={() => handleVote(opt.key)}
              disabled={!!voted}
              style={{
                position: "relative",
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px",
                borderRadius: 10,
                border: isMyVote ? `2px solid ${opt.color}` : "1px solid var(--color-border)",
                background: isMyVote ? opt.bg : "transparent",
                cursor: voted ? "default" : "pointer",
                textAlign: "left",
                overflow: "hidden",
                transition: "all 180ms ease",
                outline: "none",
              }}
              onMouseEnter={e => { if (!voted) e.currentTarget.style.borderColor = opt.color }}
              onMouseLeave={e => { if (!voted && !isMyVote) e.currentTarget.style.borderColor = "var(--color-border)" }}
            >
              {voted && total > 0 && (
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${pct}%`,
                  background: isMyVote ? opt.bg : "rgba(0,0,0,0.03)",
                  borderRadius: 10,
                  transition: "width 600ms cubic-bezier(0.4,0,0.2,1)",
                  zIndex: 0,
                }} />
              )}
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: opt.color, flexShrink: 0,
                position: "relative", zIndex: 1,
              }} />
              <span style={{
                flex: 1, fontSize: 13,
                fontWeight: isMyVote ? 700 : 500,
                color: isMyVote ? opt.color : "var(--color-text)",
                position: "relative", zIndex: 1,
              }}>
                {opt.label}
              </span>
              {voted && (
                <div style={{
                  position: "relative", zIndex: 1,
                  display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 800,
                    color: isMyVote ? opt.color : "var(--color-text-2)",
                  }}>
                    %{pct}
                  </span>
                  {isMyVote && (
                    <span style={{ fontSize: 13, color: opt.color }}>✓</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {voted && (
        <div style={{ padding: "4px 14px 12px", display: "flex", justifyContent: "center" }}>
          <span style={{
            fontSize: 11, color: "var(--color-text-3)",
            background: "var(--color-bg)", border: "1px solid var(--color-border)",
            borderRadius: 99, padding: "3px 12px",
          }}>
            Oyunuz kaydedildi · {total} toplam oy
          </span>
        </div>
      )}
    </div>
  )
}
