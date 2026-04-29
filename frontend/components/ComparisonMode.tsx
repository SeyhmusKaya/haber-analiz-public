"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Analysis } from "@/types"
import { getAnalysis } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { usePlan } from "@/lib/usePlan"

interface CountryOption {
  code: string
  name: string
  flag: string
}

interface ComparisonModeProps {
  eventId: number
  countries: CountryOption[]
}

export default function ComparisonMode({ eventId, countries }: ComparisonModeProps) {
  const { user } = useAuth()
  const { hasAccess } = usePlan()
  const [open, setOpen] = useState(false)
  const [selecting, setSelecting] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [mobileTab, setMobileTab] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  function toggleCountry(code: string) {
    setSelected((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code)
      if (prev.length >= 3) return prev
      return [...prev, code]
    })
  }

  async function startComparison() {
    if (selected.length < 2) return
    setSelecting(false)
    setMobileTab(0)

    const newLoading: Record<string, boolean> = {}
    selected.forEach((c) => (newLoading[c] = true))
    setLoading(newLoading)

    for (const code of selected) {
      try {
        const data = await getAnalysis(eventId, code)
        setAnalyses((prev) => ({ ...prev, [code]: data }))
      } catch (e: any) {
        setErrors((prev) => ({ ...prev, [code]: e.message || "Yüklenemedi" }))
      } finally {
        setLoading((prev) => ({ ...prev, [code]: false }))
      }
    }
  }

  function handleClose() {
    setOpen(false)
    setSelecting(true)
    setSelected([])
    setAnalyses({})
    setLoading({})
    setErrors({})
  }

  function getCountry(code: string): CountryOption {
    return countries.find((c) => c.code === code) || { code, name: code, flag: "" }
  }

  function renderColumn(code: string) {
    const country = getCountry(code)
    const analysis = analyses[code]
    const isLoading = loading[code]
    const error = errors[code]

    return (
      <div key={code} style={{
        flex: 1, minWidth: 0, background: "var(--color-surface)",
        borderRadius: 12, border: "1px solid var(--color-border)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 18px", background: "var(--color-surface-2)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt={country.name}
            width={28} height={20} style={{ borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>{country.name}</span>
        </div>

        <div style={{ padding: 18 }}>
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: i === 1 ? 24 : 60, borderRadius: 8, background: "var(--color-border)", animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          )}

          {error && <p style={{ color: "#ef4444", fontSize: 14 }}>{error}</p>}

          {analysis && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Yandaş */}
              <div>
                <div style={{
                  display: "inline-block", padding: "4px 10px", borderRadius: 6,
                  background: "rgba(220,38,38,0.1)", color: "#dc2626",
                  fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" as const,
                }}>
                  Yandaş Medya
                </div>
                {analysis.pro_gov_sources?.length > 0 && (
                  <p style={{ fontSize: 11, color: "var(--color-text-3)", marginBottom: 6 }}>
                    {analysis.pro_gov_sources.join(", ")}
                  </p>
                )}
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-text-2)", margin: 0 }}>
                  {analysis.pro_gov_summary}
                </p>
              </div>

              {/* Muhalif */}
              <div>
                <div style={{
                  display: "inline-block", padding: "4px 10px", borderRadius: 6,
                  background: "rgba(22,163,74,0.1)", color: "#16a34a",
                  fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" as const,
                }}>
                  Muhalif Medya
                </div>
                {analysis.opposition_sources?.length > 0 && (
                  <p style={{ fontSize: 11, color: "var(--color-text-3)", marginBottom: 6 }}>
                    {analysis.opposition_sources.join(", ")}
                  </p>
                )}
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-text-2)", margin: 0 }}>
                  {analysis.opposition_summary}
                </p>
              </div>

              {/* Konsensüs */}
              {analysis.consensus && (
                <div style={{
                  padding: "12px 14px", borderRadius: 8,
                  background: "rgba(217,119,6,0.08)", borderLeft: "3px solid #d97706",
                }}>
                  <span style={{ fontWeight: 700, color: "#d97706", fontSize: 12 }}>Ortak Nokta</span>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-text-2)", marginTop: 4, marginBottom: 0 }}>
                    {analysis.consensus}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Giriş yapılmamış veya plan yetersiz → kilitli buton
  const canCompare = user && hasAccess("pro")

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "10px 20px", borderRadius: 10,
        border: `1px solid ${canCompare ? "var(--color-border)" : "#f59e0b"}`,
        background: canCompare ? "var(--color-surface)" : "rgba(245,158,11,0.08)",
        color: canCompare ? "var(--color-text)" : "#f59e0b",
        fontSize: 14, fontWeight: 600,
        cursor: "pointer", transition: "all 200ms ease",
      }}>
        {canCompare ? "↔️" : "🔒"} Karşılaştır {!canCompare && <span style={{ fontSize: 11, opacity: 0.8 }}>Pro</span>}
      </button>

      {open && !canCompare && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: 16,
        }} onClick={() => setOpen(false)}>
          <div style={{
            background: "var(--color-surface)", borderRadius: 16, padding: "36px 28px",
            textAlign: "center", maxWidth: 380, border: "2px solid #f59e0b",
            boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>↔️</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "var(--color-text)" }}>
              Karşılaştırma Modu
            </h2>
            <p style={{ fontSize: 14, color: "var(--color-text-2)", marginBottom: 6, lineHeight: 1.6 }}>
              {!user
                ? "Bu özelliği kullanmak için giriş yapmanız gerekiyor."
                : "Karşılaştırma modu Pro planında kullanılabilir."}
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 20 }}>
              2-3 ülkeyi yan yana analiz edin.
            </p>
            <Link href={user ? "/premium" : "/giris"} style={{
              display: "inline-block", padding: "11px 28px",
              background: "#f59e0b", color: "#fff", borderRadius: 10,
              fontWeight: 700, textDecoration: "none", fontSize: 14,
            }}>
              {user ? "Pro'ya Geç →" : "Giriş Yap →"}
            </Link>
            <button onClick={() => setOpen(false)} style={{
              display: "block", margin: "12px auto 0", fontSize: 12,
              color: "var(--color-text-3)", background: "none", border: "none", cursor: "pointer",
            }}>Kapat</button>
          </div>
        </div>
      )}

      {open && canCompare && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: 16,
        }} onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
          <div style={{
            width: "95vw", maxWidth: 1100, maxHeight: "90vh", overflowY: "auto",
            background: "var(--color-bg)", borderRadius: 16, padding: "clamp(14px, 3vw, 28px)",
            border: "1px solid var(--color-border)", boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
            position: "relative",
          }}>
            {/* Kapat */}
            <button onClick={handleClose} style={{
              position: "absolute", top: 16, right: 16,
              width: 36, height: 36, borderRadius: "50%",
              border: "1px solid var(--color-border)", background: "var(--color-surface)",
              color: "var(--color-text-3)", fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>

            {selecting ? (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: "var(--color-text)" }}>
                  Ülkeleri Karşılaştır
                </h2>
                <p style={{ color: "var(--color-text-3)", fontSize: 13, marginBottom: 20 }}>
                  2 veya 3 ülke seçin, ardından medya analizlerini yan yana görün.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
                  {countries.map(c => {
                    const isSelected = selected.includes(c.code)
                    const disabled = !isSelected && selected.length >= 3
                    return (
                      <button key={c.code} onClick={() => !disabled && toggleCountry(c.code)} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 16px", borderRadius: 10,
                        border: isSelected ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                        background: isSelected ? "rgba(37,99,235,0.1)" : "var(--color-surface)",
                        color: "var(--color-text)", fontSize: 14,
                        fontWeight: isSelected ? 600 : 400,
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.4 : 1, transition: "all 200ms ease",
                      }}>
                        <img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.name}
                          width={24} height={17} style={{ borderRadius: 2 }} />
                        {c.name}
                      </button>
                    )
                  })}
                </div>

                <button onClick={startComparison} disabled={selected.length < 2} style={{
                  padding: "12px 32px", borderRadius: 10, border: "none",
                  background: selected.length >= 2 ? "var(--color-accent)" : "var(--color-surface-2)",
                  color: selected.length >= 2 ? "#fff" : "var(--color-text-3)",
                  fontSize: 15, fontWeight: 600,
                  cursor: selected.length >= 2 ? "pointer" : "not-allowed",
                }}>
                  Karşılaştır ({selected.length}/3)
                </button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <button onClick={() => setSelecting(true)} style={{
                    padding: "8px 14px", borderRadius: 8,
                    border: "1px solid var(--color-border)", background: "var(--color-surface)",
                    color: "var(--color-text)", fontSize: 13, cursor: "pointer",
                  }}>← Geri</button>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>Karşılaştırma</h2>
                </div>

                {isMobile ? (
                  <>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
                      {selected.map((code, idx) => {
                        const c = getCountry(code)
                        return (
                          <button key={code} onClick={() => setMobileTab(idx)} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "8px 16px", borderRadius: 8,
                            border: mobileTab === idx ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                            background: mobileTab === idx ? "rgba(37,99,235,0.1)" : "var(--color-surface)",
                            color: "var(--color-text)", fontSize: 13,
                            fontWeight: mobileTab === idx ? 600 : 400,
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}>
                            <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt={c.name}
                              width={20} height={14} style={{ borderRadius: 2 }} />
                            {c.name}
                          </button>
                        )
                      })}
                    </div>
                    {renderColumn(selected[mobileTab])}
                  </>
                ) : (
                  <div style={{ display: "flex", gap: 16 }}>
                    {selected.map(code => renderColumn(code))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  )
}
