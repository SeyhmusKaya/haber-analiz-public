"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Analysis, EventDetail } from "@/types"
import { getEvent, getAnalysis } from "@/lib/api"

const COUNTRIES_META: Record<string, { name: string; flag: string }> = {
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

export default function KarsilastirPage({ params }: { params: Promise<{ id: string }> }) {
  const [eventId, setEventId] = useState<number | null>(null)
  const [countryCodes, setCountryCodes] = useState<string[]>([])
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    params.then((p) => setEventId(parseInt(p.id)))
  }, [params])

  useEffect(() => {
    if (!eventId) return
    getEvent(eventId).then((e) => {
      setEvent(e)
      const codes = (e.available_countries || []).map((c: { code: string }) => c.code)
      setCountryCodes(codes)
    })
  }, [eventId])

  function toggleCountry(code: string) {
    setSelected((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code)
      if (prev.length >= 3) return prev
      return [...prev, code]
    })
  }

  async function loadAnalysis(code: string) {
    if (!eventId || analyses[code] || loading[code]) return
    setLoading((prev) => ({ ...prev, [code]: true }))
    try {
      const data = await getAnalysis(eventId, code)
      setAnalyses((prev) => ({ ...prev, [code]: data }))
    } finally {
      setLoading((prev) => ({ ...prev, [code]: false }))
    }
  }

  useEffect(() => {
    selected.forEach((code) => loadAnalysis(code))
  }, [selected, eventId])

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Link
          href={`/haber/${eventId}`}
          style={{ fontSize: 13, color: "var(--color-accent)", textDecoration: "none" }}
        >
          ← Habere Dön
        </Link>
        <span style={{ fontSize: 13, color: "var(--color-text-3)" }}>|</span>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
          Karşılaştırma Modu
        </h1>
      </div>

      {event && (
        <p style={{ fontSize: 14, color: "var(--color-text-2)", marginBottom: 24, lineHeight: 1.5 }}>
          {event.title_tr}
        </p>
      )}

      {/* Ülke seçici */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 10 }}>
          Karşılaştırmak istediğiniz ülkeleri seçin (en fazla 3):
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {countryCodes.map((code) => {
            const meta = COUNTRIES_META[code]
            if (!meta) return null
            const isSelected = selected.includes(code)
            return (
              <button
                key={code}
                onClick={() => toggleCountry(code)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: "var(--radius-md)",
                  border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: isSelected ? "rgba(37,99,235,0.08)" : "var(--color-surface)",
                  color: isSelected ? "var(--color-accent)" : "var(--color-text-2)",
                  cursor: "pointer", fontSize: 13, fontWeight: isSelected ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 18 }}>{meta.flag}</span>
                {meta.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Karşılaştırma sütunları */}
      {selected.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${selected.length}, 1fr)`,
          gap: 16,
        }}>
          {selected.map((code) => {
            const meta = COUNTRIES_META[code]
            const analysis = analyses[code]
            const isLoading = loading[code]
            return (
              <div
                key={code}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 24 }}>{meta?.flag}</span>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                    {meta?.name}
                  </h2>
                </div>

                {isLoading && (
                  <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>Yükleniyor...</div>
                )}

                {analysis && !isLoading && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <p style={{
                        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                        color: "#dc2626", letterSpacing: "0.5px", marginBottom: 6,
                      }}>
                        Yandaş Medya
                      </p>
                      <p style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.7, margin: 0 }}>
                        {analysis.pro_gov_summary}
                      </p>
                    </div>
                    <div>
                      <p style={{
                        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                        color: "#16a34a", letterSpacing: "0.5px", marginBottom: 6,
                      }}>
                        Muhalif Medya
                      </p>
                      <p style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.7, margin: 0 }}>
                        {analysis.opposition_summary}
                      </p>
                    </div>
                    {analysis.consensus && (
                      <div style={{
                        background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.2)",
                        borderRadius: "var(--radius-md)", padding: "10px 14px",
                      }}>
                        <p style={{
                          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                          color: "#d97706", letterSpacing: "0.5px", marginBottom: 4,
                        }}>
                          Ortak Nokta
                        </p>
                        <p style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.6, margin: 0 }}>
                          {analysis.consensus}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selected.length === 0 && (
        <div style={{
          textAlign: "center", padding: "48px 20px",
          color: "var(--color-text-3)", fontSize: 14,
        }}>
          Karşılaştırmak için yukarıdan en az bir ülke seçin.
        </div>
      )}
    </div>
  )
}
