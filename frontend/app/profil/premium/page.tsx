"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

const API = ""

const PLAN_FEATURES: Record<string, { label: string; color: string; gradient: string; features: { text: string; available: boolean }[] }> = {
  free: {
    label: "Ücretsiz",
    color: "#6b7280",
    gradient: "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)",
    features: [
      { text: "Günde 3 ülke analizi", available: true },
      { text: "Temel arama", available: true },
      { text: "Yorum yapabilme", available: true },
      { text: "1 katalog (max 10 haber)", available: true },
      { text: "AI Soru Sor", available: false },
      { text: "AI Asistan (Chatbot)", available: false },
      { text: "Propaganda skoru", available: false },
      { text: "Karşılaştırma modu", available: false },
      { text: "Doğal dil arama", available: false },
      { text: "Reklamsız deneyim", available: false },
      { text: "Haftalık rapor PDF", available: false },
      { text: "API erişimi", available: false },
    ],
  },
  pro: {
    label: "Pro",
    color: "#7c3aed",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
    features: [
      { text: "Sınırsız ülke analizi", available: true },
      { text: "Gelişmiş arama", available: true },
      { text: "Yorum yapabilme", available: true },
      { text: "Sınırsız katalog", available: true },
      { text: "Sınırsız AI Soru Sor", available: true },
      { text: "Sınırsız AI Asistan (Chatbot)", available: true },
      { text: "Propaganda skoru + Radar grafik", available: true },
      { text: "Karşılaştırma modu", available: true },
      { text: "Doğal dil arama", available: true },
      { text: "Reklamsız deneyim", available: true },
      { text: "Aylık rapor PDF", available: true },
      { text: "API erişimi (günde 1000 istek)", available: true },
    ],
  },
}

export default function ProfilPremiumPage() {
  const [status, setStatus] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (!token) { window.location.href = "/giris"; return }

    Promise.all([
      fetch(`${API}/api/subscription/status`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      }).then(r => r.json()),
      fetch(`${API}/api/subscription/history`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      }).then(r => r.json()),
    ])
      .then(([s, h]) => {
        setStatus(s)
        setHistory(h.subscriptions || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <div style={skeletonPulse} />
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>
    )
  }

  const plan = status?.plan || "free"
  const isPro = plan === "pro"
  const planInfo = PLAN_FEATURES[plan] || PLAN_FEATURES.free
  const freeInfo = PLAN_FEATURES.free
  const proInfo = PLAN_FEATURES.pro
  const expiresAt = status?.plan_expires_at ? new Date(status.plan_expires_at) : null
  const isExpired = expiresAt ? new Date() > expiresAt : false

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "clamp(20px,4vw,40px) 0" }}>

      {/* ── Hero ── */}
      <div style={{
        background: planInfo.gradient,
        borderRadius: "var(--radius-lg)",
        padding: "clamp(24px,4vw,36px)",
        marginBottom: 28,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* decorative rings */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)" }} />
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.10)" }} />
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 14px", borderRadius: 99,
                background: "rgba(255,255,255,0.2)",
                fontSize: 13, fontWeight: 700, color: "#fff",
                letterSpacing: "0.03em",
              }}>
                {isPro ? "⭐" : "🆓"} {planInfo.label} Plan
              </span>
              {isExpired && (
                <span style={{ padding: "4px 12px", borderRadius: 99, background: "rgba(239,68,68,0.25)", color: "#fecaca", fontSize: 11, fontWeight: 600 }}>
                  Sona Erdi
                </span>
              )}
            </div>
            <h1 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>
              {isPro ? "Premium Üyeliğiniz Aktif" : "Ücretsiz Plan"}
            </h1>
            {expiresAt && !isExpired && (
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0 }}>
                {expiresAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} tarihine kadar geçerli
              </p>
            )}
            {!expiresAt && !isPro && (
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0 }}>
                Daha fazla özellik için Pro plana geçin
              </p>
            )}
          </div>
          {isPro ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", padding: "10px 18px", borderRadius: 12, backdropFilter: "blur(6px)" }}>
              <span style={{ fontSize: 22 }}>✓</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>En İyi Plan</span>
            </div>
          ) : (
            <Link href="/premium" style={{
              padding: "12px 24px",
              background: "#fff",
              color: "#7c3aed",
              borderRadius: "var(--radius-md)",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: 14,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}>
              Pro&apos;ya Yükselt →
            </Link>
          )}
        </div>

        {/* Stats row */}
        {status?.limits && (
          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            {[
              { label: "Günlük Analiz", value: status.limits.daily_analysis === -1 ? "Sınırsız" : status.limits.daily_analysis },
              { label: "Günlük Soru", value: status.limits.daily_questions === -1 ? "Sınırsız" : status.limits.daily_questions === 0 ? "—" : status.limits.daily_questions },
              { label: "Katalog", value: status.limits.catalogs === -1 ? "Sınırsız" : status.limits.catalogs },
              { label: "Reklamlar", value: status.limits.ads ? "Var" : "Yok" },
            ].map(l => (
              <div key={l.label} style={{
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(6px)",
                borderRadius: 10,
                padding: "10px 18px",
                minWidth: 90,
                flex: "1 1 80px",
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{l.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{l.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Plan comparison cards ── */}
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", marginBottom: 14 }}>Plan Karşılaştırması</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 28 }}>
        {(["free", "pro"] as const).map((p) => {
          const info = PLAN_FEATURES[p]
          const isCurrent = plan === p
          const isPlanPro = p === "pro"
          return (
            <div key={p} style={{
              borderRadius: "var(--radius-lg)",
              border: isCurrent ? `2px solid ${info.color}` : "1px solid var(--color-border)",
              background: "var(--color-surface)",
              overflow: "hidden",
              boxShadow: isCurrent ? `0 0 0 3px ${info.color}22` : "none",
              transition: "box-shadow 0.2s",
              position: "relative",
            }}>
              {/* Animated gradient border effect for pro + current */}
              {isCurrent && isPlanPro && (
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "var(--radius-lg)", pointerEvents: "none",
                  background: "linear-gradient(135deg, #7c3aed33, #a855f733, #7c3aed33)",
                  animation: "shimmer 3s ease-in-out infinite",
                }} />
              )}

              {/* Card header */}
              <div style={{
                padding: "20px 22px 16px",
                borderBottom: "1px solid var(--color-border)",
                background: isCurrent ? `${info.color}10` : "transparent",
                position: "relative",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: info.color }}>{info.label}</div>
                    {isPlanPro
                      ? <div style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 3 }}>Tüm özelliklere tam erişim</div>
                      : <div style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 3 }}>Temel özellikler dahil</div>}
                  </div>
                  {isCurrent && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "4px 10px",
                      borderRadius: 99, background: info.color, color: "#fff",
                    }}>
                      Mevcut
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div style={{ padding: "16px 22px 20px", display: "flex", flexDirection: "column", gap: 9 }}>
                {info.features.map(f => (
                  <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                      background: f.available ? "#dcfce7" : "var(--color-surface-2, rgba(0,0,0,0.06))",
                      color: f.available ? "#16a34a" : "var(--color-text-3)",
                    }}>
                      {f.available ? "✓" : "✕"}
                    </span>
                    <span style={{ fontSize: 13, color: f.available ? "var(--color-text)" : "var(--color-text-3)" }}>
                      {f.text}
                    </span>
                  </div>
                ))}
                {!isCurrent && isPlanPro && (
                  <Link href="/premium" style={{
                    display: "block", textAlign: "center",
                    marginTop: 12, padding: "11px 0",
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    color: "#fff", borderRadius: "var(--radius-md)",
                    fontWeight: 700, fontSize: 14, textDecoration: "none",
                  }}>
                    Pro&apos;ya Yükselt →
                  </Link>
                )}
                {!isCurrent && !isPlanPro && (
                  <div style={{ marginTop: 12, padding: "11px 0", textAlign: "center", fontSize: 13, color: "var(--color-text-3)" }}>
                    Mevcut planınız
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Payment history ── */}
      {history.length > 0 && (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          marginBottom: 28,
        }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>Ödeme Geçmişi</h2>
          </div>
          <div style={{ padding: "8px 0" }}>
            {history.map((h: any, i: number) => {
              const statusColor = h.status === "active" ? "#16a34a" : h.status === "cancelled" ? "#ef4444" : "#6b7280"
              const statusBg   = h.status === "active" ? "#dcfce7" : h.status === "cancelled" ? "#fee2e2" : "#f3f4f6"
              const statusLabel = h.status === "active" ? "Aktif" : h.status === "cancelled" ? "İptal" : "Sona Erdi"
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center",
                  padding: "14px 22px", gap: 16,
                  borderBottom: i < history.length - 1 ? "1px solid var(--color-border)" : "none",
                  flexWrap: "wrap",
                }}>
                  {/* Timeline dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: statusColor, flexShrink: 0,
                    boxShadow: `0 0 0 3px ${statusColor}30`,
                  }} />

                  <div style={{ flex: 1, minWidth: 100 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)" }}>Pro Plan</span>
                    <span style={{ fontSize: 12, color: "var(--color-text-3)", marginLeft: 8 }}>
                      {h.is_yearly ? "Yıllık" : "Aylık"}
                    </span>
                  </div>

                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>
                    ₺{h.amount}
                  </span>

                  <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 99, background: statusBg, color: statusColor, fontWeight: 600 }}>
                    {statusLabel}
                  </span>

                  <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>
                    {new Date(h.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Bottom CTA (free users) ── */}
      {!isPro && (
        <div style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
          borderRadius: "var(--radius-lg)",
          padding: "clamp(24px,4vw,36px)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)" }} />
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
              Pro plana geçin
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, margin: "0 0 20px" }}>
              Yapay zeka araçlarına, reklamsız deneyime ve sınırsız analize erişin.
            </p>
            <Link href="/premium" style={{
              display: "inline-block",
              padding: "14px 40px",
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "#fff",
              borderRadius: "var(--radius-md)",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: 15,
              boxShadow: "0 4px 20px rgba(124,58,237,0.5)",
            }}>
              Pro&apos;ya Yükselt →
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

const skeletonPulse: React.CSSProperties = {
  height: 200,
  borderRadius: 16,
  background: "var(--color-border)",
  animation: "pulse 1.5s ease-in-out infinite",
  maxWidth: 700,
  margin: "0 auto",
}
