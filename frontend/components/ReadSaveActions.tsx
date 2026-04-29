"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { apiMarkRead, apiToggleSave, apiEventStatus } from "@/lib/api"

interface Props {
  eventId: number
}

export default function ReadSaveActions({ eventId }: Props) {
  const { user } = useAuth()
  const [read, setRead] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingToggle, setSavingToggle] = useState(false)

  useEffect(() => {
    if (!user) return

    // Mark as read immediately
    apiMarkRead(eventId).then(() => setRead(true))

    // Fetch current status
    apiEventStatus(eventId).then(s => {
      setRead(s.read)
      setSaved(s.saved)
    })
  }, [eventId, user])

  async function handleToggleSave() {
    if (!user || savingToggle) return
    setSavingToggle(true)
    try {
      const result = await apiToggleSave(eventId)
      setSaved(result.saved)
    } finally {
      setSavingToggle(false)
    }
  }

  if (!user) return null

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {read && (
        <span style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 12, fontWeight: 500,
          color: "#22c55e",
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.2)",
          padding: "4px 10px", borderRadius: 99,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Okundu
        </span>
      )}
      <button
        onClick={handleToggleSave}
        disabled={savingToggle}
        title={saved ? "Kaydedilenlerden çıkar" : "Kaydet"}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 12, fontWeight: 500,
          color: saved ? "#f59e0b" : "var(--color-text-3)",
          background: saved ? "rgba(245,158,11,0.1)" : "var(--color-surface)",
          border: `1px solid ${saved ? "rgba(245,158,11,0.3)" : "var(--color-border)"}`,
          padding: "4px 10px", borderRadius: 99,
          cursor: savingToggle ? "wait" : "pointer",
          transition: "all 0.15s",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill={saved ? "currentColor" : "none"}>
          <path d="M6.5 1.5l1.4 3h3.1l-2.5 1.8 1 3-3-2.2-3 2.2 1-3L2 4.5h3.1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
        {saved ? "Kaydedildi" : "Kaydet"}
      </button>
    </div>
  )
}
