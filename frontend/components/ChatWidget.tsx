"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { usePlan } from "@/lib/usePlan"

const API_URL = ""

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

interface Message {
  role: "user" | "assistant"
  message: string
  created_at?: string
}

interface Props {
  eventId: number
  eventTitle: string
}

export default function ChatWidget({ eventId, eventTitle }: Props) {
  const { user } = useAuth()
  const { plan, hasAccess } = usePlan()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [remaining, setRemaining] = useState<{ daily: number; event: number } | null>(null)
  const [limitError, setLimitError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open && user && !historyLoaded) {
      loadHistory()
    }
  }, [open, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  async function loadHistory() {
    try {
      const res = await fetch(`${API_URL}/api/chat/${eventId}/history`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } finally {
      setHistoryLoaded(true)
    }
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    setInput("")
    setLimitError(null)
    setMessages(prev => [...prev, { role: "user", message: text }])
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/chat/${eventId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ message: text }),
      })

      const data = await res.json()

      if (res.status === 429) {
        setLimitError(data.message)
        setMessages(prev => prev.slice(0, -1))
        setInput(text)
        return
      }

      if (!res.ok) {
        setMessages(prev => [
          ...prev,
          { role: "assistant", message: "Bir hata oluştu, lütfen tekrar deneyin." },
        ])
        return
      }

      setMessages(prev => [...prev, { role: "assistant", message: data.message }])
      setRemaining({ daily: data.daily_remaining, event: data.event_remaining })
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const btnStyle: React.CSSProperties = {
    width: 50, height: 50, borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 16px rgba(59,130,246,0.4)",
    textDecoration: "none", border: "none", cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    color: "#fff",
  }

  const ChatIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 10h5M8 13.5h3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="18" cy="6" r="2" fill="white" fillOpacity="0.9"/>
      <path d="M17.3 4.7l1.4 1.4M18.7 4.7l-1.4 1.4" stroke="rgba(59,130,246,1)" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )

  // Giriş yapmamış — popup göster
  if (!user) {
    return (
      <div className="chat-widget-fab" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200 }}>
        {open && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: -1 }}
            />
            <div style={{
              position: "absolute", bottom: 64, right: 0, width: 290,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 18, overflow: "hidden",
              boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
              animation: "slideUp 0.2s ease",
            }}>
              {/* Gradient header */}
              <div style={{
                padding: "22px 20px 18px",
                background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))",
                borderBottom: "1px solid var(--color-border)",
                textAlign: "center",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px",
                  color: "var(--color-accent)",
                }}>
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                    <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M6 7h8M6 10.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                  AI Asistan
                </h3>
                <p style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 4 }}>
                  Bu haber hakkında sorularınızı yanıtlar
                </p>
              </div>
              {/* Body */}
              <div style={{ padding: "18px 20px" }}>
                <p style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.6, marginBottom: 16, textAlign: "center" }}>
                  AI asistanı kullanmak için giriş yapmanız gerekiyor.
                </p>
                <Link href="/giris" style={{
                  display: "block", padding: "11px 0", textAlign: "center",
                  background: "var(--color-accent)", color: "#fff",
                  borderRadius: 10, fontWeight: 600, textDecoration: "none", fontSize: 13,
                  marginBottom: 8,
                }}>
                  Giriş Yap
                </Link>
                <Link href="/kayit" style={{
                  display: "block", padding: "10px 0", textAlign: "center",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface-2)", color: "var(--color-text-2)",
                  borderRadius: 10, fontWeight: 500, textDecoration: "none", fontSize: 13,
                }}>
                  Ücretsiz Üye Ol
                </Link>
                <button onClick={() => setOpen(false)} style={{
                  display: "block", width: "100%", marginTop: 10,
                  fontSize: 12, color: "var(--color-text-3)",
                  background: "none", border: "none", cursor: "pointer",
                }}>
                  Kapat
                </button>
              </div>
            </div>
          </>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          title="AI Asistan — Giriş gerekli"
          style={btnStyle}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)" }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)" }}
        >
          <ChatIcon />
        </button>
      </div>
    )
  }

  // Pro planı yok — kilit ikonu + upgrade prompt
  if (!hasAccess("pro")) {
    return (
      <div className="chat-widget-fab" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200 }}>
        {open && (
          <div style={{
            position: "absolute", bottom: 64, right: 0, width: 280,
            background: "var(--color-surface)", border: "2px solid #7c3aed",
            borderRadius: 16, padding: "24px 20px", textAlign: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M6 7h8M6 10.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "var(--color-text)" }}>
              AI Asistan — Pro Özelliği
            </h3>
            <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 16, lineHeight: 1.6 }}>
              Yapay zeka asistanı kullanmak için Pro plana ihtiyacınız var.
            </p>
            <Link href="/premium" style={{
              display: "block", padding: "10px 20px", background: "#7c3aed",
              color: "#fff", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: 14,
            }}>
              Pro&apos;ya Geç →
            </Link>
            <button onClick={() => setOpen(false)} style={{
              marginTop: 10, fontSize: 12, color: "var(--color-text-3)",
              background: "none", border: "none", cursor: "pointer",
            }}>Kapat</button>
          </div>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          title="AI Asistan — Pro gerekli"
          style={{ ...btnStyle, opacity: 0.65 }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)" }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)" }}
        >
          <ChatIcon />
        </button>
      </div>
    )
  }

  return (
    <div className="chat-widget-fab" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200 }}>
      {/* Chat panel */}
      {open && (
        <div style={{
          position: "absolute",
          bottom: 64,
          right: 0,
          width: 360,
          maxHeight: 520,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--color-border-subtle)",
            display: "flex", alignItems: "center", gap: 10,
            background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, color: "var(--color-accent)",
            }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M6 7h8M6 10.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                AI Asistan
              </p>
              <p style={{ fontSize: 11, color: "var(--color-text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {eventTitle}
              </p>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--color-text-3)", fontSize: 18, lineHeight: 1, padding: 4,
            }}>✕</button>
          </div>

          {/* Remaining info */}
          {remaining && (
            <div style={{
              padding: "6px 16px",
              fontSize: 11, color: "var(--color-text-3)",
              borderBottom: "1px solid var(--color-border-subtle)",
              background: "var(--color-surface-2)",
            }}>
              Kalan: {remaining.daily} günlük · {remaining.event} bu haber için
            </div>
          )}

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "16px",
            display: "flex", flexDirection: "column", gap: 12,
            minHeight: 200, maxHeight: 320,
          }}>
            {messages.length === 0 && historyLoaded && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-3)" }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M6 7h8M6 10.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "var(--color-text-3)", lineHeight: 1.6 }}>
                  Bu haber hakkında soru sorabilirsiniz.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "82%",
                  padding: "10px 13px",
                  borderRadius: msg.role === "user"
                    ? "14px 14px 4px 14px"
                    : "14px 14px 14px 4px",
                  background: msg.role === "user"
                    ? "var(--color-accent)"
                    : "var(--color-surface-2)",
                  color: msg.role === "user" ? "#fff" : "var(--color-text)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  border: msg.role === "assistant" ? "1px solid var(--color-border)" : "none",
                }}>
                  {msg.message}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "10px 14px",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "14px 14px 14px 4px",
                  display: "flex", gap: 5, alignItems: "center",
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "var(--color-text-3)",
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            {limitError && (
              <div style={{
                padding: "10px 12px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "var(--radius-md)",
                fontSize: 12, color: "#ef4444",
              }}>
                {limitError}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--color-border-subtle)",
            display: "flex", gap: 8, alignItems: "flex-end",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Bir soru sorun... (Enter ile gönder)"
              rows={1}
              style={{
                flex: 1, resize: "none", padding: "8px 12px",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text)", fontSize: 13,
                outline: "none", maxHeight: 80, lineHeight: 1.5,
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: loading || !input.trim() ? "var(--color-surface-3)" : "var(--color-accent)",
                border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.15s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l2 6-2 6 12-6z" fill="white" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="AI Asistan"
        style={{
          ...btnStyle,
          background: open
            ? "var(--color-surface-3)"
            : "linear-gradient(135deg, #3b82f6, #7c3aed)",
          border: open ? "1px solid var(--color-border)" : "none",
          color: open ? "var(--color-text-2)" : "#fff",
          boxShadow: open ? "0 2px 8px rgba(0,0,0,0.12)" : "0 4px 16px rgba(59,130,246,0.4)",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)" }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)" }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          </svg>
        ) : (
          <ChatIcon />
        )}
      </button>
    </div>
  )
}
