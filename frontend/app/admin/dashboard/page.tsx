"use client"

import { useEffect, useState } from "react"
import { adminGetStats } from "@/lib/api"

interface Stats {
  total_users: number
  active_today: number
  total_events: number
  total_articles: number
  tokens_by_feature: Record<string, number>
  daily_active: { date: string; count: number }[]
  chat_today: number
}

const FEATURE_LABELS: Record<string, string> = {
  chat: "AI Sohbet",
  analysis: "Ülke Analizi",
  long_summary: "Uzun Özet",
}

const FEATURE_COLORS: Record<string, string> = {
  chat: "#8b5cf6",
  analysis: "#3b82f6",
  long_summary: "#10b981",
}

function StatCard({ label, value, icon, color, sub }: {
  label: string; value: number | string; icon: string; color: string; sub?: string
}) {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 14,
      padding: "20px 22px",
      display: "flex", alignItems: "center", gap: 16,
      transition: "box-shadow 0.2s",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: color, borderRadius: "14px 14px 0 0",
      }} />
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: color + "18",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 3, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    adminGetStats().then(setStats).catch(e => setError(e.message))
  }, [])

  if (error) return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <p style={{ color: "#ef4444", fontSize: 14 }}>{error === "FORBIDDEN" ? "Erişim yetkiniz yok." : error}</p>
    </div>
  )

  if (!stats) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ height: 88, background: "var(--color-surface)", borderRadius: 14, border: "1px solid var(--color-border)", animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  )

  const maxActive = Math.max(...stats.daily_active.map(d => d.count), 1)
  const totalTokens = Object.values(stats.tokens_by_feature).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "var(--color-text-3)" }}>
          {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="Toplam Kullanıcı"  value={stats.total_users}    icon="👥" color="#3b82f6" />
        <StatCard label="Bugün Aktif"        value={stats.active_today}   icon="🟢" color="#10b981" sub="çevrimiçi" />
        <StatCard label="Toplam Haber"       value={stats.total_events}   icon="📰" color="#8b5cf6" />
        <StatCard label="Toplam Makale"      value={stats.total_articles} icon="📄" color="#f59e0b" />
        <StatCard label="Bugün AI Sohbet"    value={stats.chat_today}     icon="💬" color="#ec4899" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 28 }}>

        {/* Aktif kullanıcı grafiği */}
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 14, padding: "22px 24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>Aktif Kullanıcı Trendi</p>
              <p style={{ fontSize: 12, color: "var(--color-text-3)" }}>Son 7 gün</p>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-accent)" }}>
              {stats.daily_active.reduce((s, d) => s + d.count, 0)}
            </div>
          </div>
          {stats.daily_active.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--color-text-3)", textAlign: "center", padding: "20px 0" }}>Henüz veri yok</p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100 }}>
              {stats.daily_active.map((d, i) => (
                <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 10, color: "var(--color-text-3)", fontWeight: 600 }}>{d.count}</div>
                  <div style={{
                    width: "100%",
                    height: Math.max(Math.round((d.count / maxActive) * 72), 4) + "px",
                    background: i === stats.daily_active.length - 1
                      ? "var(--color-accent)"
                      : "var(--color-accent)",
                    opacity: 0.5 + (i / stats.daily_active.length) * 0.5,
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.3s ease",
                  }} />
                  <div style={{ fontSize: 10, color: "var(--color-text-3)" }}>
                    {new Date(d.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Token kullanımı */}
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 14, padding: "22px 24px",
        }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>Token Kullanımı</p>
            <p style={{ fontSize: 12, color: "var(--color-text-3)" }}>Özelliğe göre dağılım</p>
          </div>
          {Object.keys(stats.tokens_by_feature).length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--color-text-3)", textAlign: "center", padding: "20px 0" }}>Henüz veri yok</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {Object.entries(stats.tokens_by_feature).map(([feature, total]) => {
                const pct = totalTokens > 0 ? Math.round((total / totalTokens) * 100) : 0
                const color = FEATURE_COLORS[feature] ?? "#6b7280"
                return (
                  <div key={feature}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "var(--color-text-2)", fontWeight: 500 }}>
                        {FEATURE_LABELS[feature] || feature}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)" }}>
                        {total.toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <div style={{ height: 6, background: "var(--color-border)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: pct + "%", background: color, borderRadius: 99, transition: "width 0.5s ease" }} />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--color-text-3)", marginTop: 3, textAlign: "right" }}>{pct}%</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 14, padding: "20px 24px",
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 16 }}>Hızlı Erişim</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { href: "/admin/kullanicilar", label: "👥 Kullanıcıları Yönet" },
            { href: "/admin/mesajlar", label: "✉️ Mesajlar" },
            { href: "/admin/aboneler", label: "💎 Aboneler" },
            { href: "/admin/ai-ayarlari", label: "🤖 Gemini Ayarları" },
            { href: "/admin/bulten", label: "📧 SMTP Ayarları" },
            { href: "/admin/odeme-ayarlari", label: "💳 Ödeme Ayarları" },
          ].map(l => (
            <a key={l.href} href={l.href} style={{
              padding: "8px 16px",
              background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
              borderRadius: 10, fontSize: 13, color: "var(--color-text-2)",
              textDecoration: "none", transition: "border-color 0.15s, color 0.15s",
              fontWeight: 500,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-2)" }}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
