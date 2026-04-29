"use client"

import { useState } from "react"

const API_URL = ""

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

interface Props {
  eventId: number
}

export default function LongSummary({ eventId }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (expanded) {
      setExpanded(false)
      return
    }

    if (text) {
      setExpanded(true)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      const headers: Record<string, string> = {}
      if (token) headers["Authorization"] = `Bearer ${token}`
      const res = await fetch(`${API_URL}/api/events/${eventId}/long-summary`, { headers })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Özet üretilemedi, lütfen tekrar deneyin.")
      }
      const data = await res.json()
      setText(data.long_summary_tr)
      setExpanded(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 13, fontWeight: 500,
          color: expanded ? "var(--color-text-2)" : "var(--color-accent)",
          background: "none", border: "none",
          cursor: loading ? "wait" : "pointer",
          padding: 0,
          transition: "color 0.15s",
        }}
      >
        {loading ? (
          <>
            <div style={{
              width: 14, height: 14, borderRadius: "50%",
              border: "2px solid var(--color-border)",
              borderTopColor: "var(--color-accent)",
              animation: "spin 0.7s linear infinite",
            }} />
            Uzun özet hazırlanıyor...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none" }}>
              <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {expanded ? "Uzun özeti gizle" : "📖 Uzun özeti gör"}
          </>
        )}
      </button>

      {error && (
        <p style={{ marginTop: 10, fontSize: 13, color: "#ef4444" }}>{error}</p>
      )}

      {/* Content */}
      {expanded && text && (
        <div style={{
          marginTop: 16,
          padding: "20px 22px",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          animation: "fadeIn 0.3s ease",
        }}>
          <p style={{ fontSize: 15, lineHeight: 1.85, color: "var(--color-text-2)" }}>
            {text}
          </p>
        </div>
      )}
    </div>
  )
}
