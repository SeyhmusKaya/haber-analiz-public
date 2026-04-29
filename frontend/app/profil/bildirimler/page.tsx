"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"

const API_URL = ""

type NotificationType = "new_article" | "comment_reply" | "comment_like" | string

interface Notification {
  id: number
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  created_at: string
  link?: string
}

// Icon + color per notification type
function notifMeta(type: NotificationType): { icon: string; color: string; bg: string } {
  switch (type) {
    case "new_article":  return { icon: "📰", color: "#2563eb", bg: "rgba(37,99,235,0.10)" }
    case "comment_reply": return { icon: "💬", color: "#7c3aed", bg: "rgba(124,58,237,0.10)" }
    case "comment_like":  return { icon: "👍", color: "#16a34a", bg: "rgba(22,163,74,0.10)" }
    default:              return { icon: "🔔", color: "#f59e0b", bg: "rgba(245,158,11,0.10)" }
  }
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return "Az önce"
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`
  return new Date(dateStr).toLocaleDateString("tr-TR")
}

type Tab = "all" | "unread"

export default function BildirimlerPage() {
  const { user, token, loading } = useAuth()
  const router = useRouter()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [fetching, setFetching] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const [tab, setTab] = useState<Tab>("all")

  useEffect(() => {
    if (!loading && !user) return
    if (!token) return
    setFetching(true)
    fetch(`${API_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data: { notifications: Notification[] }) =>
        setNotifications(data.notifications || [])
      )
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [user, token, loading])

  async function markAsRead(id: number) {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    )
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // silently fail
    }
  }

  async function markAllAsRead() {
    setMarkingAll(true)
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {
      // silently fail
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications])

  const filtered = useMemo(
    () => tab === "unread" ? notifications.filter(n => !n.is_read) : notifications,
    [notifications, tab]
  )

  if (loading) return null

  if (!user) {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
          <p style={{ color: "var(--color-text-2)", fontSize: 14, margin: "0 0 16px" }}>
            Bu sayfayı görüntülemek için giriş yapmanız gerekmektedir.
          </p>
          <button
            onClick={() => router.push("/giris")}
            style={{
              padding: "10px 24px",
              background: "var(--color-accent)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Giriş Yap
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 10 }}>
            Bildirimler
            {unreadCount > 0 && (
              <span style={{
                background: "var(--color-accent)", color: "#fff",
                fontSize: 12, fontWeight: 700,
                padding: "2px 9px", borderRadius: 99,
                lineHeight: "18px",
              }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-3)", margin: 0 }}>
            {notifications.length} bildirim
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "8px 16px",
              fontSize: 13,
              color: "var(--color-accent)",
              cursor: markingAll ? "not-allowed" : "pointer",
              fontWeight: 500,
              opacity: markingAll ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {markingAll ? "İşleniyor..." : "Tümünü okundu işaretle"}
          </button>
        )}
      </div>

      {/* ── Tab filter ── */}
      <div style={{
        display: "flex", gap: 4,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 4,
        marginBottom: 16,
        width: "fit-content",
      }}>
        {([
          { key: "all",    label: "Tümü",       count: notifications.length },
          { key: "unread", label: "Okunmamış",  count: unreadCount },
        ] as { key: Tab; label: string; count: number }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "6px 16px",
              borderRadius: "calc(var(--radius-md) - 2px)",
              border: "none",
              fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
              background: tab === t.key ? "var(--color-accent)" : "transparent",
              color: tab === t.key ? "#fff" : "var(--color-text-2)",
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: "1px 6px", borderRadius: 99,
                background: tab === t.key ? "rgba(255,255,255,0.25)" : "var(--color-surface-2, rgba(0,0,0,0.07))",
                color: tab === t.key ? "#fff" : "var(--color-text-3)",
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {fetching ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: 76, borderRadius: "var(--radius-lg)", background: "var(--color-border)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "56px 24px" }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "var(--color-surface-2, rgba(0,0,0,0.05))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto 16px",
          }}>
            {tab === "unread" ? "✓" : "📭"}
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", margin: "0 0 6px" }}>
            {tab === "unread" ? "Tüm bildirimler okundu" : "Bildiriminiz yok"}
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-3)", margin: 0 }}>
            {tab === "unread"
              ? "Harika! Okunmamış bildiriminiz bulunmuyor."
              : "Yeni bildirimler burada görünecek."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map(n => {
            const meta = notifMeta(n.type)
            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markAsRead(n.id)
                  if (n.link) router.push(n.link)
                }}
                style={{
                  background: n.is_read ? "var(--color-surface)" : "var(--color-surface)",
                  border: `1px solid ${n.is_read ? "var(--color-border)" : meta.color + "44"}`,
                  borderRadius: "var(--radius-lg)",
                  padding: "14px 18px",
                  cursor: n.link ? "pointer" : "default",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  transition: "border-color 200ms ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Left colored border accent */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                  background: n.is_read ? "var(--color-border)" : meta.color,
                  borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)",
                  transition: "background 200ms ease",
                }} />

                {/* Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: meta.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: n.is_read ? 500 : 700,
                    color: "var(--color-text)",
                    marginBottom: 3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {n.title}
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: "var(--color-text-3)",
                    lineHeight: 1.5,
                    marginBottom: 6,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-3)" }} suppressHydrationWarning>
                    {timeAgo(n.created_at)}
                  </div>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: meta.color,
                    flexShrink: 0, marginTop: 6,
                    boxShadow: `0 0 0 2px ${meta.color}33`,
                  }} />
                )}

                {/* Arrow for linked notifications */}
                {n.link && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-3)" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 4 }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  maxWidth: 720,
  width: "100%",
  margin: "0 auto",
  padding: "clamp(20px,4vw,40px) 0",
}

const cardStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: 24,
}
