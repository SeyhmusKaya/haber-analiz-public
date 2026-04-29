"use client"

import { Suspense, useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"

const API_URL = ""

function EmbedEventInner() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const theme = searchParams.get("theme") || "dark"
  const [event, setEvent] = useState<any>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/events/${id}`, { headers: { Accept: "application/json" } })
      .then(r => r.json())
      .then(d => setEvent(d))
      .catch(() => {})
  }, [id])

  const bg = theme === "light" ? "#fff" : "#1a1a1a"
  const text = theme === "light" ? "#111" : "#f5f5f5"
  const text2 = theme === "light" ? "#666" : "#a0a0a0"
  const border = theme === "light" ? "#e5e5e5" : "#333"

  if (!event) return <div style={{ padding: 20, background: bg, color: text2, fontSize: 13 }}>Yukleniyor...</div>

  return (
    <div style={{ padding: 20, background: bg, fontFamily: "system-ui, sans-serif", minHeight: "100vh" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
        Medya İzle
      </div>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: text, marginBottom: 8, lineHeight: 1.3 }}>
        {event.title_tr}
      </h1>
      <p style={{ fontSize: 13, color: text2, lineHeight: 1.6, marginBottom: 16 }}>
        {event.summary_tr}
      </p>
      {event.available_countries && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {event.available_countries.map((c: any) => (
            <span key={c.code} style={{
              padding: "3px 8px", fontSize: 11, borderRadius: 99,
              border: `1px solid ${border}`, color: text2,
            }}>
              {c.flag} {c.name}
            </span>
          ))}
        </div>
      )}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${border}`, fontSize: 11, color: text2 }}>
        <a href={`${typeof window !== "undefined" ? window.location.origin : ""}/haber/${id}`}
          target="_blank" rel="noopener" style={{ color: "#3b82f6", textDecoration: "none" }}>
          Medya İzle'de incele →
        </a>
      </div>
    </div>
  )
}

export default function EmbedEventPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, fontSize: 13 }}>Yükleniyor...</div>}>
      <EmbedEventInner />
    </Suspense>
  )
}
