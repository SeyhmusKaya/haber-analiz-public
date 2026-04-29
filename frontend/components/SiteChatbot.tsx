"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { eventUrl } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  text: string
  events?: Array<{ id: number; title_tr: string; category: string }>
}

interface Props {
  eventId?: number
  eventTitle?: string
}

const GLOBAL_SUGGESTIONS = [
  "Bugün önemli haberler neler?",
  "Ekonomi haberleri neler?",
  "ABD ile ilgili haberler var mı?",
]

const HINTS = [
  "Haberleri sormaya başlayın",
  "Gündemdeki gelişmeler neler?",
  "Yapay zekaya sorun",
]

export default function SiteChatbot({ eventId, eventTitle }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [hintIdx, setHintIdx] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isEventMode = !!eventId

  const suggestions = isEventMode
    ? [
        "Bu haber ne hakkında?",
        "Farklı ülkeler bu haberi nasıl yorumluyor?",
        "Bu olayın arka planı nedir?",
      ]
    : GLOBAL_SUGGESTIONS

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    if (open) { setShowHint(false); return }
    const cycle = () => {
      setHintIdx(i => (i + 1) % HINTS.length)
      setShowHint(true)
      setTimeout(() => setShowHint(false), 3400)
    }
    const t1 = setTimeout(cycle, 3000)
    const iv = setInterval(cycle, 9000)
    return () => { clearTimeout(t1); clearInterval(iv) }
  }, [open])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput("")
    setMessages(prev => [...prev, { role: "user", text: msg }])
    setLoading(true)
    try {
      const body: Record<string, unknown> = { message: msg }
      if (eventId) body.event_id = eventId

      const res = await fetch(`/api/chat/global`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: "assistant",
        text: data.answer || "Şu an yanıt veremiyorum.",
        events: data.events?.length ? data.events : undefined,
      }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Bağlantı hatası, lütfen tekrar deneyin." }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 300 }}>

      {/* Panel */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: -1 }} />
          <div style={{
            position: "absolute", bottom: 70, right: 0,
            width: 360,
            maxHeight: 520,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl, 20px)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            animation: "chatOpen 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            transformOrigin: "bottom right",
          }}>

            {/* Header */}
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--color-border)",
              display: "flex", alignItems: "center", gap: 10,
              background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
                  <path d="M8 10h5M8 13.5h3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>AI Asistan</p>
                {isEventMode && eventTitle ? (
                  <p style={{
                    fontSize: 11, color: "var(--color-text-3)", margin: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{eventTitle}</p>
                ) : (
                  <p style={{ fontSize: 11, color: "var(--color-text-3)", margin: 0 }}>Yapay zeka destekli · Medya İzle</p>
                )}
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--color-text-3)", fontSize: 18, lineHeight: 1, padding: 4,
              }}>✕</button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "14px 14px 6px",
              display: "flex", flexDirection: "column", gap: 10,
              minHeight: 200, maxHeight: 320,
            }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", paddingTop: 10 }}>
                  <div style={{
                  width: 48, height: 48, borderRadius: "50%", margin: "0 auto 10px",
                  background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff",
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M8 10h5M8 13.5h3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: "0 0 4px" }}>
                    AI Asistan
                  </p>
                  <p style={{ fontSize: 12, color: "var(--color-text-3)", margin: "0 0 14px", lineHeight: 1.5 }}>
                    {isEventMode
                      ? "Bu haber veya başka konular hakkında soru sorun"
                      : "Haberleri sorun, gündem hakkında bilgi alın"}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {suggestions.map(s => (
                      <button key={s} onClick={() => send(s)} style={{
                        fontSize: 12, padding: "8px 12px", textAlign: "left",
                        background: "var(--color-surface-2)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 10, color: "var(--color-text-2)",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <span style={{ fontSize: 14 }}>💬</span>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 6, alignItems: "flex-end" }}>
                    {msg.role === "assistant" && (
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff",
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                          <path d="M8 10h5M8 13.5h3.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                    )}
                    <div style={{
                      maxWidth: "82%", padding: "9px 13px",
                      borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: msg.role === "user"
                        ? "var(--color-accent)"
                        : "var(--color-surface-2)",
                      color: msg.role === "user" ? "#fff" : "var(--color-text)",
                      fontSize: 13, lineHeight: 1.65,
                      border: msg.role === "assistant" ? "1px solid var(--color-border)" : "none",
                      wordBreak: "break-word", overflowWrap: "break-word",
                    }}>
                      {msg.text}
                    </div>
                  </div>

                  {msg.events && msg.events.length > 0 && (
                    <div style={{ marginTop: 7, marginLeft: 30, display: "flex", flexDirection: "column", gap: 4 }}>
                      {msg.events.slice(0, 4).map(ev => (
                        <Link key={ev.id} href={eventUrl(ev.id, ev.title_tr, ev.category)} onClick={() => setOpen(false)} style={{
                          fontSize: 11, padding: "6px 10px",
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 8,
                          color: "var(--color-text-2)", textDecoration: "none",
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                          <span style={{ opacity: 0.5, flexShrink: 0 }}>→</span>
                          <span style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                            {ev.title_tr}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff",
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M8 10h5M8 13.5h3.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{
                    padding: "9px 14px",
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "14px 14px 14px 4px",
                    display: "flex", gap: 4, alignItems: "center",
                  }}>
                    {[0, 1, 2].map(j => (
                      <div key={j} style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "var(--color-text-3)",
                        animation: `dotBounce 1.2s ease-in-out ${j * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--color-border)",
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
                  borderRadius: "var(--radius-md, 10px)",
                  color: "var(--color-text)", fontSize: 13,
                  outline: "none", maxHeight: 80, lineHeight: 1.5,
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: loading || !input.trim()
                    ? "var(--color-surface-3, var(--color-border))"
                    : "var(--color-accent)",
                  border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8L2 2l2 6-2 6 12-6z" fill="white"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Hint balonu */}
      {showHint && !open && (
        <div style={{
          position: "absolute", right: 66, bottom: 14,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          color: "#fff", borderRadius: 99,
          padding: "8px 14px",
          fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
          animation: "hintSlide 0.3s ease",
          pointerEvents: "none",
        }}>
          {HINTS[hintIdx]}
          <span style={{
            position: "absolute", right: -5, top: "50%", transform: "translateY(-50%)",
            width: 0, height: 0,
            borderTop: "5px solid transparent", borderBottom: "5px solid transparent",
            borderLeft: "6px solid #8b5cf6",
          }} />
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="AI Asistan"
        style={{
          width: 50, height: 50, borderRadius: "50%",
          background: open
            ? "var(--color-surface-2)"
            : "linear-gradient(135deg, #3b82f6, #7c3aed)",
          border: open ? "1px solid var(--color-border)" : "none",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: open ? "none" : "0 4px 20px rgba(59,130,246,0.4)",
          color: open ? "var(--color-text)" : "#fff",
          transition: "all 0.2s ease",
          animation: open ? "none" : "btnPulse 3.5s ease-in-out infinite",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.transform = "scale(1.1)" }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)" }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M8 10h5M8 13.5h3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="18.5" cy="5.5" r="2" fill="white" fillOpacity="0.9"/>
            <path d="M17.8 4.8l1.4 1.4M19.2 4.8l-1.4 1.4" stroke="rgba(124,58,237,1)" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      <style>{`
        @keyframes chatOpen {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes hintSlide {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(59,130,246,0.4), 0 0 0 0 rgba(59,130,246,0.3); }
          50% { box-shadow: 0 4px 20px rgba(59,130,246,0.4), 0 0 0 8px rgba(59,130,246,0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}
