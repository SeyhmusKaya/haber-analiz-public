"use client"

import { useState, useEffect } from "react"

const API = ""

interface FactCheck {
  claim: string
  source: string
  rating: "true" | "false" | "half-true" | "unverified"
  explanation?: string
  source_url?: string
  checked_at: string
}

const RATING_CONFIG = {
  true:        { label: "Doğrulandı",    color: "#16a34a", bg: "rgba(22,163,74,0.1)",  icon: "✓" },
  false:       { label: "Yanlış",        color: "#dc2626", bg: "rgba(220,38,38,0.1)",  icon: "✗" },
  "half-true": { label: "Kısmen Doğru", color: "#d97706", bg: "rgba(217,119,6,0.1)",  icon: "~" },
  unverified:  { label: "Doğrulanamadı",color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: "?" },
}

interface Props {
  eventId: number
}

function AILoadingAnimation() {
  const [dotCount, setDotCount] = useState(1)
  const [step, setStep] = useState(0)

  const steps = [
    "Haberden iddialar çıkarılıyor",
    "İddialar yapay zeka ile değerlendiriliyor",
    "Kaynaklar karşılaştırılıyor",
    "Sonuçlar hazırlanıyor",
  ]

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDotCount(d => (d % 3) + 1)
    }, 500)
    const stepTimer = setInterval(() => {
      setStep(s => (s + 1) % steps.length)
    }, 2200)
    return () => {
      clearInterval(dotTimer)
      clearInterval(stepTimer)
    }
  }, [])

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "36px 24px", gap: 20,
    }}>
      {/* Animated robot icon */}
      <div style={{ position: "relative", width: 64, height: 64 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(37,99,235,0.15))",
          border: "2px solid rgba(16,185,129,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28,
          animation: "factcheck-pulse 2s ease-in-out infinite",
        }}>
          🔍
        </div>
        {/* Orbiting dot */}
        <div style={{
          position: "absolute", top: 0, left: "50%", width: 10, height: 10,
          marginLeft: -5, marginTop: -5,
          borderRadius: "50%", background: "#10b981",
          transformOrigin: "5px 37px",
          animation: "factcheck-orbit 1.5s linear infinite",
        }} />
      </div>

      {/* Step text */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 15, fontWeight: 600, color: "var(--color-text)",
          marginBottom: 6,
        }}>
          Yapay zeka sizin için iddiaları kontrol ediyor
          <span style={{ display: "inline-block", minWidth: 18, textAlign: "left" }}>
            {Array(dotCount).fill(".").join("")}
          </span>
        </div>
        <div style={{
          fontSize: 13, color: "var(--color-text-3)",
          padding: "4px 14px",
          background: "var(--color-surface-2)",
          borderRadius: 99,
          display: "inline-block",
          transition: "opacity 0.3s",
        }}>
          {steps[step]}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: "100%", maxWidth: 260, height: 3,
        background: "var(--color-border)", borderRadius: 99, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: "linear-gradient(90deg, #10b981, #2563eb)",
          animation: "factcheck-progress 2.5s ease-in-out infinite",
        }} />
      </div>

      <style>{`
        @keyframes factcheck-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16,185,129,0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(16,185,129,0); }
        }
        @keyframes factcheck-orbit {
          from { transform: rotate(0deg) translateX(0) rotate(0deg); transform-origin: center 37px; }
          to { transform: rotate(360deg) translateX(0) rotate(-360deg); transform-origin: center 37px; }
        }
        @keyframes factcheck-progress {
          0% { width: 0%; margin-left: 0; }
          50% { width: 75%; margin-left: 0; }
          75% { width: 25%; margin-left: 75%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}

export default function FactCheckSection({ eventId }: Props) {
  const [checks, setChecks] = useState<FactCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`${API}/api/factcheck/${eventId}`)
      .then(r => r.json())
      .then(d => setChecks(d.fact_checks || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [eventId, open])

  return (
    <div style={{ marginTop: 24 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          background: open ? "none" : "var(--color-surface)",
          border: open ? "none" : "1px solid var(--color-border)",
          borderTop: open ? "1px solid var(--color-border)" : "none",
          borderRadius: open ? 0 : "var(--radius-lg)",
          cursor: "pointer", padding: open ? "10px 0" : "14px 18px",
          transition: "background 0.15s",
        }}
      >
        <span style={{
          width: 34, height: 34, borderRadius: "50%",
          background: open ? "transparent" : "rgba(16,185,129,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: open ? 16 : 18, flexShrink: 0,
        }}>
          🔍
        </span>
        <div style={{ flex: 1, textAlign: "left" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-2)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
            İddia Kontrolü
          </span>
          {!open && (
            <span style={{ fontSize: 12, color: "var(--color-text-3)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
              Bu haberdeki iddiaları yapay zeka ile kontrol edin
            </span>
          )}
        </div>
        <span style={{
          flexShrink: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
          color: open ? "var(--color-text-3)" : "var(--color-accent)",
          background: open ? "none" : "rgba(16,185,129,0.1)",
          padding: open ? 0 : "4px 10px", borderRadius: 99,
        }}>
          {open ? "▲ Gizle" : "▼ Göster"}
        </span>
      </button>

      {open && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {loading ? (
            <div style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
            }}>
              <AILoadingAnimation />
            </div>
          ) : checks.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--color-text-3)", padding: "24px 0" }}>
              Bu haber için iddia kontrolü mevcut değil.
            </p>
          ) : (
            checks.map((check, i) => {
              const cfg = RATING_CONFIG[check.rating] ?? RATING_CONFIG.unverified
              return (
                <div key={i} style={{
                  padding: "14px 16px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  borderLeft: `3px solid ${cfg.color}`,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{
                      flexShrink: 0, width: 24, height: 24, borderRadius: "50%",
                      background: cfg.bg, color: cfg.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700,
                    }}>
                      {cfg.icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px",
                          borderRadius: 99, background: cfg.bg, color: cfg.color,
                        }}>
                          {cfg.label}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>
                          {check.source}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "var(--color-text)", lineHeight: 1.5 }}>
                        {check.claim}
                      </p>
                      {check.explanation && (
                        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.6 }}>
                          {check.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <p style={{ fontSize: 11, color: "var(--color-text-3)", textAlign: "center", marginTop: 4 }}>
            ⚠️ İddia kontrolleri yapay zeka tarafından üretilmiştir. Kesin bilgi için birden fazla kaynağa başvurun.
          </p>
        </div>
      )}
    </div>
  )
}
