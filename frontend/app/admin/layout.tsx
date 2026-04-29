"use client"

import { useAuth } from "@/lib/auth"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

const NAV = [
  { href: "/admin/dashboard",      icon: "📊", label: "Dashboard" },
  { href: "/admin/kaynaklar",      icon: "📰", label: "Kaynaklar" },
  { href: "/admin/kullanicilar",   icon: "👥", label: "Kullanıcılar" },
  { href: "/admin/aboneler",       icon: "💎", label: "Aboneler" },
  { href: "/admin/mesajlar",       icon: "✉️",  label: "Mesajlar" },
  { href: "/admin/api-anahtarlari", icon: "🔑", label: "API Anahtarları" },
  { href: "/admin/bulten",         icon: "📧", label: "Bülten / SMTP" },
  { href: "/admin/ai-ayarlari",    icon: "🤖", label: "AI Ayarları" },
  { href: "/admin/odeme-ayarlari", icon: "💳", label: "Ödeme Ayarları" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) router.replace("/")
  }, [user, loading])

  if (loading || !user?.is_admin) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, border: "3px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 13, color: "var(--color-text-3)" }}>Yükleniyor...</span>
        </div>
      </div>
    )
  }

  const sidebarW = collapsed ? 62 : 220

  return (
    <div className="admin-layout" style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-2)" }}>

      {/* Sidebar */}
      <aside style={{
        width: sidebarW,
        flexShrink: 0,
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? "18px 0" : "18px 16px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 8,
          minHeight: 64,
        }}>
          {!collapsed && (
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
              }}>🌐</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", lineHeight: 1.2 }}>Medya İzle</div>
                <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin</div>
              </div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-text-3)", fontSize: 11, transition: "background 0.15s",
            }}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 0" }}>
          {NAV.map(item => {
            const active = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== "/admin")
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                style={{
                  display: "flex", alignItems: "center",
                  gap: collapsed ? 0 : 10,
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "11px 0" : "10px 14px",
                  margin: "2px 8px",
                  borderRadius: 10,
                  textDecoration: "none",
                  background: active ? "var(--color-accent)" : "transparent",
                  color: active ? "#fff" : "var(--color-text-2)",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  transition: "background 0.15s, color 0.15s",
                  position: "relative",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--color-surface-2)" }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && (
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.label}
                  </span>
                )}
                {active && !collapsed && (
                  <div style={{ position: "absolute", right: 10, width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.6)" }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{
          padding: collapsed ? "14px 0" : "14px 16px",
          borderTop: "1px solid var(--color-border)",
          display: "flex", alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 600 }}>Admin</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px",
          height: 56,
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          position: "sticky", top: 0, zIndex: 5,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: "var(--color-text-3)", fontSize: 12 }}>Admin</span>
            <span style={{ color: "var(--color-border)" }}>/</span>
            <span style={{ fontWeight: 600, color: "var(--color-text)", fontSize: 13 }}>
              {NAV.find(n => pathname?.startsWith(n.href))?.label ?? "Panel"}
            </span>
          </div>
          <Link
            href="/"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, color: "var(--color-text-3)",
              textDecoration: "none", padding: "6px 12px",
              background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
              borderRadius: 8, transition: "border-color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
          >
            ← Siteye Dön
          </Link>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: "28px 24px", maxWidth: 1200 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
