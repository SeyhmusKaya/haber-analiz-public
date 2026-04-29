"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth"

const API_URL = ""

interface Catalog {
  id: number
  name: string
  description?: string
  has_event?: boolean
}

export default function CatalogPicker({ eventId, onClose }: { eventId: number; onClose: () => void }) {
  const { token } = useAuth()
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!token) return
    fetch(`${API_URL}/api/events/${eventId}/catalogs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setCatalogs(d.catalogs || d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, eventId])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  const toggleCatalog = async (catalogId: number, hasEvent: boolean) => {
    if (!token) return
    const method = hasEvent ? "DELETE" : "POST"
    await fetch(`${API_URL}/api/catalogs/${catalogId}/events/${eventId}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    })
    setCatalogs(prev =>
      prev.map(c => c.id === catalogId ? { ...c, has_event: !hasEvent } : c)
    )
  }

  const createCatalog = async () => {
    if (!token || !newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/api/catalogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setCatalogs(prev => [...prev, { ...data.catalog, has_event: false }])
        setNewName("")
      }
    } catch {}
    setCreating(false)
  }

  return (
    <div ref={ref} style={{
      position: "absolute", top: "100%", right: 0, marginTop: 8,
      width: "min(280px, calc(100vw - 32px))", background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      zIndex: 100, overflow: "hidden",
    }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
        Kataloga Kaydet
      </div>

      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: 16, fontSize: 13, color: "var(--color-text-3)" }}>Yükleniyor...</div>
        ) : catalogs.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: "var(--color-text-3)" }}>Henüz katalog yok</div>
        ) : (
          catalogs.map(c => (
            <div
              key={c.id}
              onClick={() => toggleCatalog(c.id, !!c.has_event)}
              style={{
                padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                fontSize: 13, color: "var(--color-text)", transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-surface-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{
                width: 18, height: 18, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                border: c.has_event ? "none" : "1.5px solid var(--color-border)",
                background: c.has_event ? "var(--color-accent)" : "transparent",
                color: "#fff", fontSize: 11,
              }}>
                {c.has_event ? "✓" : ""}
              </span>
              {c.name}
            </div>
          ))
        )}
      </div>

      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 6 }}>
        <input
          type="text"
          placeholder="Yeni katalog adı"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && createCatalog()}
          style={{
            flex: 1, padding: "6px 10px", fontSize: 12, background: "var(--color-bg)",
            border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
            color: "var(--color-text)", outline: "none",
          }}
        />
        <button
          onClick={createCatalog}
          disabled={creating || !newName.trim()}
          style={{
            padding: "6px 12px", fontSize: 11, fontWeight: 600,
            background: "var(--color-accent)", color: "#fff", border: "none",
            borderRadius: "var(--radius-md)", cursor: "pointer",
            opacity: creating || !newName.trim() ? 0.5 : 1,
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}
