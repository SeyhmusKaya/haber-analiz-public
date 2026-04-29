"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"

const API_URL = ""

interface Notification {
  id: number
  type: string
  title: string
  message?: string
  link?: string
  is_read: boolean
  created_at: string
}

export default function NotificationDropdown({ onClose, onRead }: { onClose: () => void; onRead: () => void }) {
  const { token } = useAuth()
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch(`${API_URL}/api/notifications?limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setItems(d.notifications || d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  const markRead = async (id: number) => {
    if (!token) return
    await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    })
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    onRead()
  }

  const markAllRead = async () => {
    if (!token) return
    await fetch(`${API_URL}/api/notifications/read-all`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    })
    setItems(prev => prev.map(n => ({ ...n, is_read: true })))
    onRead()
  }

  const handleClick = (n: Notification) => {
    if (!n.is_read) markRead(n.id)
    if (n.link) router.push(n.link)
    onClose()
  }

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}dk`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}sa`
    return `${Math.floor(h / 24)}g`
  }

  const typeIcon: Record<string, string> = {
    new_article: "📰", comment_reply: "💬", comment_like: "👍", newsletter: "📧",
  }

  return (
    <div ref={ref} style={{
      position: "absolute", top: "100%", right: 0, marginTop: 8,
      width: "min(340px, calc(100vw - 32px))", background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)", boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      zIndex: 200, overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 16px", borderBottom: "1px solid var(--color-border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>Bildirimler</span>
        <button
          onClick={markAllRead}
          style={{
            fontSize: 11, color: "var(--color-accent)", background: "none",
            border: "none", cursor: "pointer", fontWeight: 500,
          }}
        >
          Tümünü okundu işaretle
        </button>
      </div>

      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--color-text-3)" }}>Yükleniyor...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--color-text-3)" }}>Bildiriminiz yok</div>
        ) : (
          items.map(n => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                padding: "10px 16px", cursor: "pointer", display: "flex", gap: 10,
                background: n.is_read ? "transparent" : "rgba(37,99,235,0.05)",
                borderBottom: "1px solid var(--color-border-subtle)",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-surface-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? "transparent" : "rgba(37,99,235,0.05)")}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{typeIcon[n.type] || "🔔"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: "var(--color-text)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {n.title}
                </div>
                {n.message && (
                  <div style={{
                    fontSize: 12, color: "var(--color-text-3)", marginTop: 2,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {n.message}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, color: "var(--color-text-3)", flexShrink: 0 }} suppressHydrationWarning>
                {timeAgo(n.created_at)}
              </span>
            </div>
          ))
        )}
      </div>

      <div
        onClick={() => { router.push("/profil/bildirimler"); onClose() }}
        style={{
          padding: "10px 16px", textAlign: "center", borderTop: "1px solid var(--color-border)",
          fontSize: 13, fontWeight: 500, color: "var(--color-accent)", cursor: "pointer",
        }}
      >
        Tümünü Gör
      </div>
    </div>
  )
}
