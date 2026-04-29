"use client"

import { useState, useEffect } from "react"

const API = ""

interface TensionPair {
  country_a: string
  country_b: string
  country_a_name: string
  country_b_name: string
  country_a_flag: string
  country_b_flag: string
  tension_score: number
  article_count: number
  calculated_at: string | null
}

function tensionLevel(score: number): "high" | "medium" | "low" {
  if (score >= 7) return "high"
  if (score >= 4) return "medium"
  return "low"
}

const LEVEL_COLORS = { high: "#dc2626", medium: "#d97706", low: "#16a34a" }
const LEVEL_LABELS = { high: "Yüksek", medium: "Orta", low: "Düşük" }

export default function TensionBarometer() {
  const [tensions, setTensions] = useState<TensionPair[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/api/tensions`)
      .then(r => r.json())
      .then(d => {
        const raw: TensionPair[] = d.tensions || []
        const seen = new Set<string>()
        const list = raw.filter(t => {
          const key = [t.country_a, t.country_b].sort().join("-")
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        setTensions(list)
        const latest = list.find(t => t.calculated_at)
        if (latest?.calculated_at) {
          setLastUpdated(new Date(latest.calculated_at).toLocaleDateString("tr-TR"))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      marginTop: "24px",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--color-text)" }}>
          🌡️ Jeopolitik Gerilim Barometresi
        </h3>
        {lastUpdated && (
          <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>
            Son güncelleme: {lastUpdated}
          </span>
        )}
      </div>

      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--color-text-3)" }}>
        Medya tonundan hesaplanan ülkeler arası gerilim endeksi (0-10)
      </p>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ height: 44, borderRadius: 10, background: "var(--color-border)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {tensions.map((pair, i) => {
            const level = tensionLevel(pair.tension_score)
            const color = LEVEL_COLORS[level]
            const pct = Math.round((pair.tension_score / 10) * 100)
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px",
                background: "var(--color-surface-2)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
              }}>
                <span style={{ fontSize: 13, whiteSpace: "nowrap", minWidth: 0 }}>
                  {pair.country_a_flag} {pair.country_a_name}
                </span>

                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--color-border)", position: "relative", overflow: "hidden" }}>
                  <div style={{
                    position: "absolute", left: 0, top: 0, height: "100%",
                    width: `${pct}%`, background: color, borderRadius: 2, transition: "width 500ms ease",
                  }} />
                </div>

                <span style={{ fontSize: 13, whiteSpace: "nowrap", minWidth: 0 }}>
                  {pair.country_b_flag} {pair.country_b_name}
                </span>

                <span style={{
                  fontSize: 11, fontWeight: 700, color, minWidth: 28, textAlign: "right",
                }}>
                  {pair.tension_score}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 16, fontSize: 12, color: "var(--color-text-3)" }}>
        {Object.entries(LEVEL_LABELS).map(([level, label]) => (
          <span key={level} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS], display: "inline-block" }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
