"use client"

import Link from "next/link"
import { useState, useRef, useEffect, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import ThemeToggle from "./ThemeToggle"
import NotificationBell from "./NotificationBell"
import { useAuth } from "@/lib/auth"

type NavLink = {
  href: string
  label: string
  icon?: string
  flagCode?: string
  activeWhen?: (pathname: string, searchParams: URLSearchParams) => boolean
}

const NAV_LINKS: NavLink[] = [
  {
    href: "/",
    label: "Ana Sayfa",
    icon: "⊞",
    activeWhen: (p, s) => p === "/" && !s.get("category"),
  },
  {
    href: "/gundem",
    label: "Gündem",
    icon: "◉",
    activeWhen: (p) => p === "/gundem" || p.startsWith("/gundem/"),
  },
  {
    href: "/dunyadan-haberler",
    label: "Dünyadan Haberler",
    icon: "🌍",
    activeWhen: (p) => p === "/dunyadan-haberler" || p.startsWith("/dunyadan-haberler/") || p === "/kategoriler",
  },
  {
    href: "/turkiyeden-haberler",
    label: "Türkiye'den Haberler",
    flagCode: "tr",
    activeWhen: (p) => p === "/turkiyeden-haberler",
  },
  {
    href: "/kutuplasmalar",
    label: "Türkiyedeki Kutuplaşmalar",
    icon: "⚡",
    activeWhen: (p) => p === "/kutuplasmalar",
  },
  {
    href: "/raporlar",
    label: "Raporlar",
    icon: "↗",
    activeWhen: (p) => p === "/raporlar" || p.startsWith("/raporlar/"),
  },
]

/* ─── Avatar ─────────────────────────────────────────── */
function Avatar({ name, avatar, size = 28 }: { name: string; avatar?: string; size?: number }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt=""
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.42), fontWeight: 700, color: "#fff",
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

/* ─── Desktop Nav (searchParams gerektiriyor) ─────────── */
function DesktopNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
      {NAV_LINKS.map(link => {
        const active = link.activeWhen
          ? link.activeWhen(pathname, searchParams)
          : pathname === link.href

        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              position: "relative",
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 11px",
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              color: active ? "var(--color-text)" : "var(--color-text-2)",
              textDecoration: "none",
              borderRadius: 7,
              background: "transparent",
              whiteSpace: "nowrap",
              transition: "color 0.12s, background 0.12s",
            }}
            onMouseEnter={e => {
              if (!active) {
                e.currentTarget.style.color = "var(--color-text)"
                e.currentTarget.style.background = "var(--color-surface-2)"
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                e.currentTarget.style.color = "var(--color-text-2)"
                e.currentTarget.style.background = "transparent"
              }
            }}
          >
            {link.flagCode ? (
              <img
                src={`https://flagcdn.com/w20/${link.flagCode}.png`}
                alt=""
                style={{ width: 15, height: 11, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
              />
            ) : link.icon ? (
              <span style={{
                fontSize: 11, flexShrink: 0,
                color: active ? "var(--color-accent)" : "var(--color-text-3)",
                fontStyle: "normal",
              }}>{link.icon}</span>
            ) : null}

            {link.label}

            {active && (
              <span style={{
                position: "absolute",
                bottom: 1, left: "20%",
                width: "60%", height: 2,
                borderRadius: 2,
                background: "var(--color-accent)",
              }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

/* ─── UserMenu ─────────────────────────────────────────── */
function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Link href="/giris" className="mobile-hide" style={{
          fontSize: 13, fontWeight: 500, color: "var(--color-text-2)",
          textDecoration: "none", padding: "6px 13px", borderRadius: 8,
          border: "1px solid var(--color-border)", whiteSpace: "nowrap",
          transition: "all 0.12s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-2)" }}
        >
          Giriş
        </Link>
        <Link href="/kayit" style={{
          fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none",
          padding: "6px 13px", borderRadius: 8, whiteSpace: "nowrap",
          background: "var(--color-accent)", transition: "opacity 0.12s",
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.85" }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}
        >
          Üye Ol
        </Link>
      </div>
    )
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "transparent",
          border: "1px solid " + (open ? "var(--color-accent)55" : "var(--color-border)"),
          borderRadius: 9, padding: "4px 10px 4px 5px",
          cursor: "pointer", transition: "border-color 0.12s", height: 36,
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor = "var(--color-accent)55" }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = "var(--color-border)" }}
      >
        <Avatar name={user.name} avatar={user.avatar} size={26} />
        <span className="mobile-hide" style={{
          fontSize: 13, fontWeight: 500, color: "var(--color-text)",
          maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {user.name.split(" ")[0]}
        </span>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="mobile-hide"
          style={{ color: "var(--color-text-3)", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }}>
          <path d="M1 3l3.5 3L8 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          width: 210, background: "var(--color-surface)",
          border: "1px solid var(--color-border)", borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
          overflow: "hidden", zIndex: 100,
        }}>
          <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Avatar name={user.name} avatar={user.avatar} size={34} />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
                <p style={{ fontSize: 11, color: "var(--color-text-3)", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
              </div>
            </div>
          </div>
          {[
            { href: "/profil", label: "Profilim", icon: "👤" },
            { href: "/profil/kataloglar", label: "Kataloglarım", icon: "🔖" },
            { href: "/profil/bildirimler", label: "Bildirimler", icon: "🔔" },
            ...(user.is_admin ? [{ href: "/admin", label: "Admin Paneli", icon: "⚙️" }] : []),
          ].map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} style={{
              display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", fontSize: 13,
              color: "var(--color-text-2)", textDecoration: "none", transition: "background 0.1s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-surface-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 13, width: 18, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <button onClick={() => { logout(); setOpen(false) }} style={{
            display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left",
            padding: "9px 14px", fontSize: 13, color: "#ef4444",
            background: "none", border: "none", borderTop: "1px solid var(--color-border)",
            cursor: "pointer", transition: "background 0.1s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <span style={{ fontSize: 13, width: 18, flexShrink: 0 }}>🚪</span>Çıkış Yap
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Mobile Menu ──────────────────────────────────────── */
function MobileMenuContent({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        zIndex: 90,
      }} />
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: "min(288px, 80vw)",
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        zIndex: 91, overflowY: "auto",
        display: "flex", flexDirection: "column",
        animation: "mobileMenuIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        {/* Top */}
        <div style={{
          padding: "15px 18px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <Link href="/" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <img src="/logo.png" alt="" style={{ width: 28, height: 28, borderRadius: 7, objectFit: "cover" }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: "var(--color-text)", letterSpacing: "-0.03em" }}>Medya İzle</span>
          </Link>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: "1px solid var(--color-border)",
            background: "var(--color-surface-2)", color: "var(--color-text-3)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* User */}
        {user && (
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <Avatar name={user.name} avatar={user.avatar} size={36} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "4px 0" }}>
          {NAV_LINKS.map(link => {
            const active = link.activeWhen
              ? link.activeWhen(pathname, searchParams)
              : pathname === link.href
            return (
              <Link key={link.href} href={link.href} onClick={onClose} style={{
                display: "flex", alignItems: "center", gap: 11, padding: "11px 18px",
                fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? "var(--color-accent)" : "var(--color-text)",
                textDecoration: "none",
                background: active ? "rgba(37,99,235,0.07)" : "transparent",
                borderLeft: active ? "3px solid var(--color-accent)" : "3px solid transparent",
              }}>
                {link.flagCode ? (
                  <img src={`https://flagcdn.com/w20/${link.flagCode}.png`} alt="" style={{ width: 18, height: 13, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
                ) : (
                  <span style={{ width: 18, fontSize: 13, color: "var(--color-text-3)", flexShrink: 0, textAlign: "center" }}>{link.icon}</span>
                )}
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Auth */}
        <div style={{ padding: "14px 18px", borderTop: "1px solid var(--color-border)", flexShrink: 0 }}>
          {!user ? (
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/giris" onClick={onClose} style={{
                flex: 1, textAlign: "center", padding: "10px", fontSize: 14, fontWeight: 600,
                color: "var(--color-text)", textDecoration: "none",
                border: "1px solid var(--color-border)", borderRadius: 9,
              }}>Giriş Yap</Link>
              <Link href="/kayit" onClick={onClose} style={{
                flex: 1, textAlign: "center", padding: "10px", fontSize: 14, fontWeight: 600,
                color: "#fff", textDecoration: "none", background: "var(--color-accent)", borderRadius: 9,
              }}>Üye Ol</Link>
            </div>
          ) : (
            <button onClick={() => { logout(); onClose() }} style={{
              width: "100%", padding: "10px", fontSize: 14, fontWeight: 600,
              color: "#ef4444", background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.2)", borderRadius: 9, cursor: "pointer",
            }}>Çıkış Yap</button>
          )}
        </div>
      </div>
    </>
  )
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <>
      <Suspense fallback={null}>
        <MobileMenuContent onClose={onClose} />
      </Suspense>
      <style>{`@keyframes mobileMenuIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
    </>
  )
}

/* ─── Header ───────────────────────────────────────────── */
export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 4) }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <header
        className="safe-area-top"
        style={{
          position: "sticky", top: 0, zIndex: 50,
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          backgroundColor: "color-mix(in srgb, var(--color-bg) 92%, transparent)",
          borderBottom: "1px solid var(--color-border)",
          boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.07)" : "none",
          transition: "box-shadow 0.2s",
        }}
      >
        <div style={{
          width: "100%",
          padding: "0 clamp(16px, 3vw, 28px)", height: 58,
          display: "flex", alignItems: "center", gap: 0,
        }}>

          {/* ── Sol: hamburger + logo ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginRight: 24 }}>
            {/* Hamburger (sadece mobil) */}
            <button
              className="mobile-show"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menü"
              style={{
                display: "none", width: 36, height: 36, borderRadius: 8,
                border: "1px solid var(--color-border)", background: "transparent",
                color: "var(--color-text-2)", cursor: "pointer",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                <img src="/logo.png" alt="Medya İzle" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--color-text)" }}>
                  Medya İzle
                </span>
                <span className="mobile-hide" style={{ fontSize: 9, fontWeight: 500, color: "var(--color-text-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Haberi değil, bakış açısını oku
                </span>
              </div>
            </Link>
          </div>

          {/* ── Orta: nav (desktop) ── */}
          <div className="mobile-hide" style={{ flex: 1 }}>
            <Suspense fallback={null}>
              <DesktopNav />
            </Suspense>
          </div>

          {/* ── Sağ: aksiyonlar ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0, marginLeft: "auto" }}>
            {/* Arama */}
            <Link href="/arama" title="Ara" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 34, height: 34, borderRadius: 8,
              color: "var(--color-text-2)", textDecoration: "none", transition: "all 0.12s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--color-text)"; e.currentTarget.style.background = "var(--color-surface-2)" }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--color-text-2)"; e.currentTarget.style.background = "transparent" }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Link>

            <ThemeToggle />
            <NotificationBell />

            <div className="mobile-hide" style={{ width: 1, height: 18, background: "var(--color-border)", marginInline: 5 }} />
            <UserMenu />
          </div>
        </div>
      </header>

      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  )
}
