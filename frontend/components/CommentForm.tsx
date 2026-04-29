"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"

const API_URL = ""

interface Props {
  eventId: number
  parentId?: number
  onSubmit: () => void
  onCancel?: () => void
}

export default function CommentForm({ eventId, parentId, onSubmit, onCancel }: Props) {
  const { user, token } = useAuth()
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)

  if (!user) return null

  const submit = async () => {
    if (!content.trim() || sending) return
    setSending(true)
    try {
      await fetch(`${API_URL}/api/events/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: content.trim(), parent_id: parentId || null }),
      })
      setContent("")
      onSubmit()
    } catch {}
    setSending(false)
  }

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 12, fontWeight: 700,
      }}>
        {(user.display_name || user.username)?.[0]?.toUpperCase() || "?"}
      </div>
      <div style={{ flex: 1 }}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={parentId ? "Yanıt yaz..." : "Yorum yaz..."}
          rows={parentId ? 2 : 3}
          style={{
            width: "100%", padding: "10px 14px", fontSize: 13, resize: "vertical",
            background: "var(--color-bg)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)", color: "var(--color-text)",
            outline: "none", lineHeight: 1.5, boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
          {onCancel && (
            <button onClick={onCancel} style={{
              padding: "6px 14px", fontSize: 12, background: "transparent",
              border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
              color: "var(--color-text-2)", cursor: "pointer",
            }}>İptal</button>
          )}
          <button onClick={submit} disabled={sending || !content.trim()} style={{
            padding: "6px 14px", fontSize: 12, fontWeight: 600,
            background: "var(--color-accent)", color: "#fff", border: "none",
            borderRadius: "var(--radius-md)", cursor: "pointer",
            opacity: sending || !content.trim() ? 0.5 : 1,
          }}>
            {sending ? "Gönderiliyor..." : "Gönder"}
          </button>
        </div>
      </div>
    </div>
  )
}
