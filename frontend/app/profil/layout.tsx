"use client"

import { useAuth } from "@/lib/auth"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

const API = ""
const PLAN_COLORS: Record<string, string> = { free: "#6b7280", pro: "#7c3aed" }
const PLAN_LABELS: Record<string, string> = { free: "Ücretsiz", pro: "Pro" }

const NAV_ITEMS = [
  { href: "/profil", label: "Profilim", icon: "👤" },
  { href: "/profil/premium", label: "Premium Üyelik", icon: "⭐" },
  { href: "/profil/kataloglar", label: "Kataloglarım", icon: "📁" },
  { href: "/profil/bulten", label: "Bülten Ayarları", icon: "📧" },
  { href: "/profil/ayarlar", label: "Bildirim Ayarları", icon: "🔔" },
  { href: "/profil/bildirimler", label: "Bildirimler", icon: "📬" },
]

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [userPlan, setUserPlan] = useState<string>("free")
  const [navHover, setNavHover] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace("/giris")
    if (user) {
      const token = localStorage.getItem("auth_token")
      fetch(`${API}/api/subscription/status`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
        .then(r => r.json()).then(d => { if (d.plan) setUserPlan(d.plan) }).catch(() => {})
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ color: "var(--color-text-3)", fontSize: 14 }}>Yükleniyor...</div>
      </div>
    )
  }

  if (!user) return null

  const planColor = PLAN_COLORS[userPlan] ?? PLAN_COLORS.free
  const planLabel = PLAN_LABELS[userPlan] ?? PLAN_LABELS.free
  const avatarInitial = (user.display_name || user.username)?.[0]?.toUpperCase() ?? "?"

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px", display: "flex", gap: 28, minHeight: "70vh" }}>
      {/* Sidebar */}
      <aside style={{
        width: 256, flexShrink: 0,
        position: "sticky", top: 80, alignSelf: "flex-start",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {/* User card */}
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}>
          {/* Gradient header band */}
          <div style={{
            height: 6,
            background: `linear-gradient(90deg, ${planColor}, #3b82f6)`,
          }} />

          <div style={{ padding: "20px 16px 18px", textAlign: "center" }}>
            {/* Avatar */}
            <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: user.avatar_url
                  ? undefined
                  : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, fontWeight: 700, color: "#fff",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                border: "3px solid var(--color-surface)",
                outline: "2px solid var(--color-border)",
              }}>
                {!user.avatar_url && avatarInitial}
              </div>
            </div>

            {/* Name */}
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", lineHeight: 1.3 }}>
              {user.display_name || user.username}
            </div>

            {/* Email */}
            <div style={{
              fontSize: 11, color: "var(--color-text-3)", marginTop: 3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              maxWidth: "100%",
            }}>
              {user.email}
            </div>

            {/* Plan badge */}
            <div style={{ marginTop: 12 }}>
              <Link
                href="/profil/premium"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 14px", borderRadius: 99,
                  fontSize: 12, fontWeight: 700,
                  background: planColor + "1a",
                  color: planColor,
                  textDecoration: "none",
                  border: `1.5px solid ${planColor}55`,
                  transition: "all 0.15s",
                }}
              >
                ⭐ {planLabel} Plan
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}>
          {NAV_ITEMS.map((item, idx) => {
            const active = pathname === item.href
            const hovered = navHover === item.href
            const showDivider = idx < NAV_ITEMS.length - 1

            return (
              <div key={item.href} style={{ position: "relative" }}>
                <Link
                  href={item.href}
                  onMouseEnter={() => setNavHover(item.href)}
                  onMouseLeave={() => setNavHover(null)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "11px 16px",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active
                      ? "var(--color-accent)"
                      : hovered
                      ? "var(--color-text)"
                      : "var(--color-text-2)",
                    background: active
                      ? "rgba(37,99,235,0.08)"
                      : hovered
                      ? "var(--color-surface-2)"
                      : "transparent",
                    borderLeft: active
                      ? "3px solid var(--color-accent)"
                      : "3px solid transparent",
                    textDecoration: "none",
                    transition: "background 0.12s, color 0.12s",
                  }}
                >
                  <span style={{ fontSize: 15, lineHeight: 1 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {active && (
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "var(--color-accent)", flexShrink: 0,
                    }} />
                  )}
                </Link>
                {showDivider && (
                  <div style={{
                    height: 1,
                    background: "var(--color-border)",
                    margin: "0 16px",
                    opacity: 0.6,
                  }} />
                )}
              </div>
            )
          })}
        </nav>

        {/* Back to home */}
        <Link
          href="/"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "8px 12px",
            fontSize: 12, color: "var(--color-text-3)", textDecoration: "none",
            borderRadius: "var(--radius-md)",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text-2)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-3)")}
        >
          ← Ana Sayfaya Dön
        </Link>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>

      {/* Mobile tab nav */}
      <div className="mobile-bottom-nav no-scrollbar" style={{ overflowX: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "6px 12px", fontSize: 10, fontWeight: active ? 600 : 400,
              color: active ? "var(--color-accent)" : "var(--color-text-3)",
              textDecoration: "none", whiteSpace: "nowrap", minWidth: 60,
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label.split(" ")[0]}
            </Link>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          aside { display: none !important; }
          main { width: 100% !important; padding-bottom: 80px !important; }
        }
      `}</style>
    </div>
  )
}
