"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"

const API_URL = ""

interface Notification {
  id: number
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export default function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem("auth_token")
    if (!token) return

    fetch(`${API_URL}/api/notifications?unread=true`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      })
      .catch(() => {})
  }, [user])

  async function markAllRead() {
    const token = localStorage.getItem("auth_token")
    if (!token) return
    await fetch(`${API_URL}/api/notifications/read-all`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    })
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  if (!user) return null

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 36, height: 36, borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)", background: "transparent",
          color: "var(--color-text-3)", cursor: "pointer", position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, transition: "border-color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
        title="Bildirimler"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            width: 16, height: 16, borderRadius: "50%",
            background: "#ef4444", color: "#fff",
            fontSize: 9, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          width: 320, maxHeight: 400, overflowY: "auto",
          background: "var(--color-surface)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          zIndex: 100,
        }}>
          <div style={{
            padding: "12px 16px", borderBottom: "1px solid var(--color-border-subtle)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
              Bildirimler
            </span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{
                background: "none", border: "none", fontSize: 11,
                color: "var(--color-accent)", cursor: "pointer",
              }}>
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--color-text-3)" }}>
              Bildirim yok
            </div>
          ) : (
            notifications.slice(0, 10).map(n => (
              <div
                key={n.id}
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--color-border-subtle)",
                  background: n.is_read ? "transparent" : "var(--color-accent-dim, rgba(59,130,246,0.05))",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: "var(--color-text)", marginBottom: 2 }}>
                  {n.title}
                </p>
                {n.message && (
                  <p style={{ fontSize: 12, color: "var(--color-text-3)" }}>{n.message}</p>
                )}
              </div>
            ))
          )}

          <Link href="/profil/bildirimler" onClick={() => setOpen(false)} style={{
            display: "block", padding: "10px 16px", textAlign: "center",
            fontSize: 12, color: "var(--color-accent)", textDecoration: "none",
            borderTop: "1px solid var(--color-border-subtle)",
          }}>
            Tümünü Gör →
          </Link>
        </div>
      )}
    </div>
  )
}
