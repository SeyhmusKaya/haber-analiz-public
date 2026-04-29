"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { usePlan } from "@/lib/usePlan"

const API = ""

interface NarrativeEntry {
  date: string
  narrative_summary: string
  sentiment_score: number
  divergence_score: number
}

interface CountryNarrative {
  country_code: string
  country_name: string
  flag: string
  entries: NarrativeEntry[]
}

interface NarrativeTimelineProps {
  eventId: number
}

function sentimentColor(score: number): string {
  if (score > 0.3) return "#16a34a"
  if (score < -0.3) return "#dc2626"
  return "#d97706"
}

function sentimentLabel(score: number): string {
  if (score > 0.3) return "Olumlu"
  if (score < -0.3) return "Olumsuz"
  return "Nötr"
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
  } catch {
    return dateStr
  }
}

export default function NarrativeTimeline({ eventId }: NarrativeTimelineProps) {
  const { user } = useAuth()
  const { hasAccess } = usePlan()
  const canView = user && hasAccess("pro")

  const [data, setData] = useState<CountryNarrative[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!canView) return
    setLoading(true)
    const token = localStorage.getItem("auth_token")
    fetch(`${API}/api/narrative/${eventId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then(r => r.json())
      .then(d => {
        setData(d.countries || [])
      })
      .catch(() => setError("Anlatı takipçisi yüklenemedi."))
      .finally(() => setLoading(false))
  }, [eventId, canView])

  if (!canView) {
    return (
      <div style={{
        background: "var(--color-surface)",
        border: "1px dashed var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "32px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>📈</div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>
          Anlatı Takipçisi
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 16, lineHeight: 1.6 }}>
          Bu haberin anlatısının günler içinde ülkeler arası nasıl değiştiği.{" "}
          <strong>Pro</strong> plan gerektirir.
        </p>
        <Link href={user ? "/premium" : "/giris"} style={{
          fontSize: 13, fontWeight: 600, color: "#fff", background: "var(--color-accent)",
          padding: "8px 20px", borderRadius: 8, textDecoration: "none",
        }}>
          {user ? "Pro'ya Geç →" : "Giriş Yap →"}
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
    }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>
        📈 Anlatı Takipçisi
      </h3>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--color-text-3)" }}>
        Bu haberin anlatısının günler içinde ülkeden ülkeye nasıl şekillendiği
      </p>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 56, borderRadius: 10, background: "var(--color-border)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-3)", marginTop: 8 }}>
            Anlatılar analiz ediliyor, bu işlem birkaç saniye sürebilir…
          </p>
        </div>
      )}

      {error && (
        <p style={{ textAlign: "center", fontSize: 13, color: "#ef4444" }}>{error}</p>
      )}

      {!loading && !error && data.length === 0 && (
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--color-text-3)", padding: "24px 0" }}>
          Bu haber için henüz anlatı verisi oluşturulmadı.
        </p>
      )}

      {!loading && data.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.map(country => (
            <div key={country.country_code} style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}>
              {/* Ülke başlığı */}
              <button
                onClick={() => setExpanded(expanded === country.country_code ? null : country.country_code)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "12px 16px", background: "var(--color-surface-2)",
                  border: "none", cursor: "pointer", textAlign: "left",
                }}
              >
                <img
                  src={`https://flagcdn.com/w20/${country.country_code.toLowerCase()}.png`}
                  srcSet={`https://flagcdn.com/w40/${country.country_code.toLowerCase()}.png 2x`}
                  alt={country.country_name} width={20} height={14} style={{ borderRadius: 2 }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", flex: 1 }}>
                  {country.country_name}
                </span>
                <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>
                  {country.entries.length} gün
                </span>
                <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>
                  {expanded === country.country_code ? "▲" : "▼"}
                </span>
              </button>

              {/* Zaman çizelgesi */}
              {expanded === country.country_code && (
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 0 }}>
                  {country.entries.map((entry, idx) => {
                    const color = sentimentColor(entry.sentiment_score)
                    const isLast = idx === country.entries.length - 1
                    return (
                      <div key={entry.date} style={{ display: "flex", gap: 14 }}>
                        {/* Sol: dikey çizgi + nokta */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
                          <div style={{
                            width: 12, height: 12, borderRadius: "50%",
                            background: color, flexShrink: 0, marginTop: 6,
                            boxShadow: `0 0 0 3px ${color}22`,
                          }} />
                          {!isLast && (
                            <div style={{ width: 2, flex: 1, background: "var(--color-border)", marginTop: 4, minHeight: 20 }} />
                          )}
                        </div>
                        {/* Sağ: içerik */}
                        <div style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-2)" }}>
                              {formatDate(entry.date)}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 6px",
                              borderRadius: 99, background: `${color}22`, color,
                            }}>
                              {sentimentLabel(entry.sentiment_score)}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.6 }}>
                            {entry.narrative_summary}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
