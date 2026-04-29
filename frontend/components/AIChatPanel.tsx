"use client"

import { useState, useRef, useEffect } from "react"

const API_URL = ""

interface Message {
  role: "user" | "ai"
  text: string
}

interface Props {
  eventId: number
  eventTitle: string
  onClose: () => void
}

export default function AIChatPanel({ eventId, eventTitle, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: `"${eventTitle}" haberi hakkında soru sorabilirsiniz.` },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const q = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", text: q }])
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, question: q }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages(prev => [...prev, { role: "ai", text: data.message || data.error || "Bir hata oluştu, lütfen tekrar deneyin." }])
      } else {
        setMessages(prev => [...prev, { role: "ai", text: data.answer || data.message || "Yanıt alınamadı." }])
      }
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Bağlantı hatası, lütfen tekrar deneyin." }])
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: "min(400px, 90vw)",
      background: "var(--color-surface)", borderLeft: "1px solid var(--color-border)",
      boxShadow: "-8px 0 32px rgba(0,0,0,0.2)", zIndex: 1000,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px", borderBottom: "1px solid var(--color-border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>AI Asistan</span>
        <button onClick={onClose} style={{
          width: 28, height: 28, borderRadius: "50%", border: "none",
          background: "var(--color-surface-2)", color: "var(--color-text-3)",
          cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%", padding: "10px 14px", borderRadius: 12,
            background: m.role === "user" ? "var(--color-accent)" : "var(--color-surface-2)",
            color: m.role === "user" ? "#fff" : "var(--color-text)",
            fontSize: 13, lineHeight: 1.6,
          }}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: "flex-start", padding: "10px 14px", borderRadius: 12,
            background: "var(--color-surface-2)", color: "var(--color-text-3)", fontSize: 13,
          }}>
            Düşünüyor...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Sorunuzu yazın..."
          style={{
            flex: 1, padding: "10px 14px", fontSize: 13, background: "var(--color-bg)",
            border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
            color: "var(--color-text)", outline: "none",
          }}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          padding: "10px 16px", background: "var(--color-accent)", color: "#fff",
          border: "none", borderRadius: "var(--radius-lg)", cursor: "pointer",
          fontSize: 13, fontWeight: 600, opacity: loading || !input.trim() ? 0.5 : 1,
        }}>
          Gönder
        </button>
      </div>
    </div>
  )
}
