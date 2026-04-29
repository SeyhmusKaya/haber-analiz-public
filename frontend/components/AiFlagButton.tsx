"use client"

import { useState } from "react"

const API_URL = ""

const REASONS = [
  "Yanlış bilgi içeriyor",
  "Taraflı veya yanıltıcı",
  "Özet eksik veya yarım kalmış",
  "İçerik ilgisiz",
  "Diğer",
]

interface Props {
  eventId: number
  type: "summary" | "analysis"
  countryCode?: string
}

export default function AiFlagButton({ eventId, type, countryCode }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!reason) return
    setLoading(true)
    try {
      await fetch(`${API_URL}/api/events/${eventId}/flag-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, country_code: countryCode, reason }),
      })
    } catch {
      // sessizce devam et
    } finally {
      setLoading(false)
      setSent(true)
    }
  }

  if (sent) {
    return (
      <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>
        ✓ Bildiriminiz alındı
      </span>
    )
  }

  return (
    <div style={{ display: "inline-block" }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 11,
            color: "var(--color-text-3)",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 10 }}>⚑</span>
          Hatalı AI içeriği bildir
        </button>
      ) : (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{
              fontSize: 11,
              padding: "3px 6px",
              borderRadius: 4,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text-2)",
              cursor: "pointer",
            }}
          >
            <option value="">Neden seç...</option>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            onClick={handleSubmit}
            disabled={!reason || loading}
            style={{
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 4,
              border: "1px solid var(--color-border)",
              background: reason ? "var(--color-accent)" : "var(--color-surface)",
              color: reason ? "#fff" : "var(--color-text-3)",
              cursor: reason ? "pointer" : "default",
            }}
          >
            Bildir
          </button>
          <button
            onClick={() => setOpen(false)}
            style={{
              fontSize: 11,
              padding: "3px 8px",
              borderRadius: 4,
              border: "1px solid var(--color-border)",
              background: "none",
              color: "var(--color-text-3)",
              cursor: "pointer",
            }}
          >
            İptal
          </button>
        </div>
      )}
    </div>
  )
}
