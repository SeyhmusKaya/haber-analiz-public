"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { getVoteResults, postVote } from "@/lib/api"

interface Country {
  code: string
  name: string
  flag: string
}

interface ReaderVoteProps {
  eventId: number
  countries: Country[]
}

export default function ReaderVote({ eventId, countries }: ReaderVoteProps) {
  const { user } = useAuth()
  const [voted, setVoted] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => {
    if (countries.length === 0) return
    setLoading(true)
    setVoted(null)
    setResults({})
    getVoteResults(eventId, "global")
      .then((data) => {
        const r: Record<string, number> = {}
        // data has dynamic keys per country code
        countries.forEach(c => { r[c.code] = (data as any)[c.code] || 0 })
        setResults(r)
        setTotal(data.total || 0)
        if (data.user_vote) setVoted(data.user_vote)
      })
      .finally(() => setLoading(false))
  }, [eventId, countries])

  async function handleVote(code: string) {
    if (!user || voted || submitting) return
    setSubmitting(code)
    try {
      await postVote(eventId, "global", code)
      const fresh = await getVoteResults(eventId, "global")
      const r: Record<string, number> = {}
      countries.forEach(c => { r[c.code] = (fresh as any)[c.code] || 0 })
      setResults(r)
      setTotal(fresh.total || 0)
      setVoted(code)
    } catch {
      // silent fail
    }
    setSubmitting(null)
  }

  if (countries.length < 2) return null

  if (!user) {
    return (
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        padding: "22px 20px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>🗳️</div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
          Sizce hangi ülkenin haberi gerçeği daha iyi yansıtıyor?
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 14 }}>
          Oy vermek için giriş yapmanız gerekiyor.
        </p>
        <Link href="/giris" style={{
          display: "inline-block", fontSize: 13, fontWeight: 600,
          color: "#fff", background: "var(--color-accent)",
          padding: "8px 20px", borderRadius: 8, textDecoration: "none",
        }}>
          Giriş Yap
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 16,
      overflow: "hidden",
    }}>
      {/* Başlık */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--color-border)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>🗳️</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>
            Sizce hangi ülkenin haberi gerçeği daha iyi yansıtıyor?
          </div>
          {total > 0 && (
            <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 2 }}>
              {total} okuyucu oy kullandı
            </div>
          )}
        </div>
      </div>

      {/* Seçenekler */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} style={{
              height: 52, borderRadius: 10,
              background: "var(--color-border)", opacity: 0.4,
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))
        ) : countries.map((country) => {
          const isMyVote = voted === country.code
          const count = results[country.code] || 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const isSpinning = submitting === country.code

          return (
            <button
              key={country.code}
              onClick={() => handleVote(country.code)}
              disabled={!!voted || !!submitting}
              style={{
                position: "relative",
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px",
                borderRadius: 10,
                border: isMyVote
                  ? "2px solid var(--color-accent)"
                  : "1px solid var(--color-border)",
                background: isMyVote ? "rgba(37,99,235,0.06)" : "transparent",
                cursor: voted ? "default" : submitting ? "wait" : "pointer",
                textAlign: "left",
                overflow: "hidden",
                transition: "all 180ms ease",
                minHeight: 52,
                outline: "none",
              }}
              onMouseEnter={e => { if (!voted && !submitting) e.currentTarget.style.borderColor = "var(--color-accent)" }}
              onMouseLeave={e => { if (!voted && !submitting) e.currentTarget.style.borderColor = "var(--color-border)" }}
            >
              {/* Bar arka plan */}
              {voted && total > 0 && (
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${pct}%`,
                  background: isMyVote ? "rgba(37,99,235,0.08)" : "rgba(0,0,0,0.03)",
                  borderRadius: 10,
                  transition: "width 600ms cubic-bezier(0.4,0,0.2,1)",
                  zIndex: 0,
                }} />
              )}

              {/* Bayrak resmi */}
              <span style={{ flexShrink: 0, position: "relative", zIndex: 1, lineHeight: 1 }}>
                {isSpinning ? (
                  <span style={{ fontSize: 20 }}>⏳</span>
                ) : (
                  <img
                    src={`https://flagcdn.com/32x24/${country.code.toLowerCase()}.png`}
                    alt={country.name}
                    width={32} height={24}
                    style={{ borderRadius: 3, display: "block" }}
                  />
                )}
              </span>

              {/* Ülke adı */}
              <span style={{
                flex: 1, fontSize: 13,
                fontWeight: isMyVote ? 700 : 500,
                color: isMyVote ? "var(--color-accent)" : "var(--color-text)",
                position: "relative", zIndex: 1,
              }}>
                {country.name}
              </span>

              {/* Sonuç */}
              {voted && (
                <div style={{
                  position: "relative", zIndex: 1,
                  display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: 14, fontWeight: 800,
                    color: isMyVote ? "var(--color-accent)" : "var(--color-text-2)",
                  }}>
                    %{pct}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--color-text-3)" }}>
                    {count} oy
                  </span>
                </div>
              )}

              {isMyVote && (
                <span style={{
                  position: "relative", zIndex: 1,
                  fontSize: 14, color: "var(--color-accent)", fontWeight: 700, flexShrink: 0,
                }}>✓</span>
              )}
            </button>
          )
        })}
      </div>

      {voted && (
        <div style={{ padding: "10px 16px 14px", display: "flex", justifyContent: "center" }}>
          <span style={{
            fontSize: 11, color: "var(--color-text-3)",
            background: "var(--color-bg)", border: "1px solid var(--color-border)",
            borderRadius: 99, padding: "4px 12px",
          }}>
            Oyunuz kaydedildi · {total} toplam oy
          </span>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
      `}</style>
    </div>
  )
}
