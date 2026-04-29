"use client"

import { useEffect, useState, useCallback } from "react"
import { getTensionArticles, TensionArticlesResponse } from "@/lib/api"

const CATEGORY_LABELS: Record<string, string> = {
  siyaset: "Siyaset", ekonomi: "Ekonomi", "savas-catisma": "Savaş & Çatışma",
  diplomasi: "Diplomasi", savunma: "Savunma", enerji: "Enerji",
  teknoloji: "Teknoloji", kultur: "Kültür", spor: "Spor", saglik: "Sağlık",
  cevre: "Çevre", diger: "Diğer",
}

const CATEGORY_COLORS: Record<string, string> = {
  siyaset: "#2563eb", ekonomi: "#16a34a", "savas-catisma": "#dc2626",
  diplomasi: "#7c3aed", savunma: "#b45309", enerji: "#0891b2",
  teknoloji: "#0284c7", kultur: "#db2777", spor: "#16a34a", saglik: "#059669",
}

function tensionColor(score: number) {
  if (score >= 7) return "#dc2626"
  if (score >= 4) return "#d97706"
  return "#16a34a"
}

function tensionLabel(score: number) {
  if (score >= 7) return "Yüksek Gerilim"
  if (score >= 4) return "Orta Gerilim"
  return "Düşük Gerilim"
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  })
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
    .slice(0, 80)
}

function FlagImg({ code, size = 28 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={code}
      width={size}
      height={Math.round(size * 0.67)}
      style={{ borderRadius: 3, objectFit: "cover", display: "block" }}
    />
  )
}

interface Props {
  countryA: string
  countryB: string
  countryAName: string
  countryBName: string
  tensionScore: number
  onClose: () => void
}

export default function TensionDetailModal({
  countryA, countryB, countryAName, countryBName, tensionScore, onClose,
}: Props) {
  const [data, setData] = useState<TensionArticlesResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const color = tensionColor(tensionScore)
  const pct = Math.round((tensionScore / 10) * 100)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getTensionArticles(countryA, countryB)
    setData(res)
    setLoading(false)
  }, [countryA, countryB])

  useEffect(() => {
    load()
    // ESC ile kapat
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [load, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1001,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        pointerEvents: "none",
      }}>
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 620,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          pointerEvents: "auto",
          animation: "modalIn 180ms ease",
        }}>
          {/* Header */}
          <div style={{
            padding: "24px 24px 20px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface-2)",
          }}>
            {/* Ülkeler + Skor */}
            <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 16 }}>
              {/* Ülke A */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <FlagImg code={countryA} size={40} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                  {data?.country_a?.name || countryAName}
                </span>
              </div>

              {/* Orta: skor + bar + etiket */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "0 16px" }}>
                <span style={{
                  fontSize: 28, fontWeight: 800, color,
                  lineHeight: 1,
                }}>
                  {tensionScore.toFixed(1)}
                </span>
                <div style={{
                  width: "100%", height: 6, borderRadius: 3,
                  background: "var(--color-border)", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: `linear-gradient(90deg, ${color}99, ${color})`,
                    borderRadius: 3, transition: "width 600ms ease",
                  }} />
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, color,
                  background: `${color}18`,
                  padding: "2px 10px", borderRadius: 99,
                  border: `1px solid ${color}44`,
                }}>
                  {tensionLabel(tensionScore)}
                </span>
              </div>

              {/* Ülke B */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <FlagImg code={countryB} size={40} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                  {data?.country_b?.name || countryBName}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-3)" }}>
                Bu ülkelerin her ikisinde de haberleşen olaylar
              </p>
              <button
                onClick={onClose}
                aria-label="Kapat"
                style={{
                  background: "var(--color-border)", border: "none",
                  borderRadius: "50%", width: 30, height: 30,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "var(--color-text-3)",
                  fontSize: 16, flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* İçerik */}
          <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px 24px" }}>
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{
                    background: "var(--color-surface-2)", borderRadius: 12,
                    border: "1px solid var(--color-border)", overflow: "hidden",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}>
                    <div style={{ height: 110, background: "var(--color-border)" }} />
                    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ height: 10, width: "40%", borderRadius: 4, background: "var(--color-border)" }} />
                      <div style={{ height: 13, width: "90%", borderRadius: 4, background: "var(--color-border)" }} />
                      <div style={{ height: 13, width: "65%", borderRadius: 4, background: "var(--color-border)" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data || data.events.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "48px 0",
                color: "var(--color-text-3)", fontSize: 14,
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p style={{ margin: 0 }}>Son 30 günde her iki ülkeyi de kapsayan haber bulunamadı.</p>
              </div>
            ) : (
              <>
                <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "var(--color-text-2)" }}>
                  {data.events.length} ortak haber — tarihe göre sıralı
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {data.events.map((event) => (
                    <a
                      key={event.id}
                      href={event.category ? `/haber/${event.category}/${event.id}-${slugify(event.title_tr)}` : `/haber/${event.id}/${slugify(event.title_tr)}`}
                      style={{
                        display: "block", textDecoration: "none",
                        background: "var(--color-surface-2)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        overflow: "hidden",
                        transition: "all 150ms ease",
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLAnchorElement
                        el.style.borderColor = color
                        el.style.transform = "translateX(3px)"
                        el.style.background = `${color}08`
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLAnchorElement
                        el.style.borderColor = "var(--color-border)"
                        el.style.transform = "translateX(0)"
                        el.style.background = "var(--color-surface-2)"
                      }}
                    >
                      {/* Resim — üstte tam genişlik */}
                      {event.image_url && (
                        <div style={{
                          height: 130, overflow: "hidden",
                          background: "var(--color-border)",
                          borderRadius: "10px 10px 0 0",
                          flexShrink: 0,
                        }}>
                          <img
                            src={event.image_url}
                            alt=""
                            referrerPolicy="no-referrer"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none" }}
                          />
                        </div>
                      )}

                      {/* İçerik */}
                      <div style={{ padding: event.image_url ? "12px 14px" : "16px 14px", display: "flex", gap: 10, alignItems: "flex-start", minHeight: event.image_url ? undefined : 90 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Üst satır: tarih + kategori */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>
                              {formatDate(event.created_at)}
                            </span>
                            {event.category && (
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: "1px 7px",
                                borderRadius: 99, background: `${CATEGORY_COLORS[event.category] || "#6b7280"}20`,
                                color: CATEGORY_COLORS[event.category] || "#6b7280",
                                border: `1px solid ${CATEGORY_COLORS[event.category] || "#6b7280"}40`,
                              }}>
                                {CATEGORY_LABELS[event.category] || event.category}
                              </span>
                            )}
                            {event.importance_score >= 8 && (
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: "1px 7px",
                                borderRadius: 99, background: "#dc262618",
                                color: "#dc2626", border: "1px solid #dc262640",
                              }}>
                                🔥 Önemli
                              </span>
                            )}
                          </div>

                          {/* Başlık */}
                          <p style={{
                            margin: 0, fontSize: 13, fontWeight: 600,
                            color: "var(--color-text)", lineHeight: 1.45,
                            display: "-webkit-box",
                            WebkitLineClamp: event.image_url ? 2 : 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}>
                            {event.title_tr}
                          </p>
                        </div>

                        {/* Ok ikonu */}
                        <span style={{ fontSize: 14, color: "var(--color-text-3)", flexShrink: 0, marginTop: 2 }}>
                          →
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </>
  )
}
