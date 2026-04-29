"use client"

import { useState, useEffect } from "react"

const API = ""

const COUNTRY_META: Record<string, { name: string; flag: string }> = {
  TR: { name: "Türkiye", flag: "🇹🇷" },
  US: { name: "ABD", flag: "🇺🇸" },
  GB: { name: "İngiltere", flag: "🇬🇧" },
  DE: { name: "Almanya", flag: "🇩🇪" },
  RU: { name: "Rusya", flag: "🇷🇺" },
  CN: { name: "Çin", flag: "🇨🇳" },
  IR: { name: "İran", flag: "🇮🇷" },
  IL: { name: "İsrail", flag: "🇮🇱" },
  SA: { name: "Suudi Arabistan", flag: "🇸🇦" },
  EG: { name: "Mısır", flag: "🇪🇬" },
}

interface SilenceCardProps {
  eventId: number
  allCountries: string[]
  coveredCountries: string[]
}

export default function SilenceCard({ eventId, allCountries, coveredCountries }: SilenceCardProps) {
  const coveredSet = new Set(coveredCountries)
  const missingCountries = allCountries.filter((c) => !coveredSet.has(c))

  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open || analysis !== null || missingCountries.length === 0) return
    setLoading(true)
    fetch(`${API}/api/events/${eventId}/silence`)
      .then(r => r.json())
      .then(d => setAnalysis(d.analysis || null))
      .catch(() => setAnalysis(null))
      .finally(() => setLoading(false))
  }, [open, eventId])

  if (missingCountries.length === 0 || coveredCountries.length < 3) return null

  return (
    <div style={{
      backgroundColor: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
    }}>
      {/* Başlık / toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          width: "100%", padding: "16px 20px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
          borderBottom: open ? "1px solid var(--color-border)" : "none",
        }}
      >
        <span style={{ fontSize: 20 }}>🔇</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", display: "block" }}>
            Suskunluk Analizi
          </span>
          <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>
            {missingCountries.length} ülke bu haberi işlemedi — neden?
          </span>
        </div>
        <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "16px 20px" }}>
          {/* İşlemeyen ülkeler */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
              Haberi işlemeyen ülkeler
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {missingCountries.map((code) => {
                const meta = COUNTRY_META[code]
                if (!meta) return null
                return (
                  <div key={code} style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "5px 10px", borderRadius: 99,
                    background: "rgba(239,68,68,0.07)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}>
                    <img
                      src={`https://flagcdn.com/20x15/${code.toLowerCase()}.png`}
                      alt={meta.name} width={16} height={12} style={{ borderRadius: 2, opacity: 0.5 }}
                    />
                    <span style={{ fontSize: 12, color: "var(--color-text-3)", textDecoration: "line-through" }}>
                      {meta.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* AI Analiz */}
          <div style={{
            padding: "14px 16px",
            background: "var(--color-surface-2)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
              🤖 Yapay Zeka Yorumu
            </span>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[1, 2].map(i => (
                  <div key={i} style={{ height: 14, borderRadius: 4, background: "var(--color-border)", animation: "pulse 1.5s ease-in-out infinite", width: i === 2 ? "70%" : "100%" }} />
                ))}
              </div>
            ) : analysis ? (
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.7 }}>{analysis}</p>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-3)" }}>
                Bu haber için suskunluk analizi mevcut değil.
              </p>
            )}
          </div>

          {/* İşleyen ülkeler özet */}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 12, color: "var(--color-text-3)" }}>
            <span>Haberi işleyen:</span>
            {coveredCountries.map((code) => {
              const meta = COUNTRY_META[code]
              if (!meta) return null
              return (
                <span key={code} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <img src={`https://flagcdn.com/20x15/${code.toLowerCase()}.png`} alt={meta.name} width={14} height={11} style={{ borderRadius: 2 }} />
                  {meta.name}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
