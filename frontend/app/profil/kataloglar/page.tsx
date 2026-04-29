"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import {
  getCatalogs,
  createCatalog,
  deleteCatalog,
  getCatalogEvents,
  removeFromCatalog,
  CatalogData,
} from "@/lib/api"
import { Event } from "@/types"
import { timeAgo, CATEGORY_LABELS } from "@/lib/utils"

// Gradient palette for catalog icons
const ICON_GRADIENTS = [
  "linear-gradient(135deg, #3b82f6, #6366f1)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #8b5cf6, #ec4899)",
  "linear-gradient(135deg, #06b6d4, #3b82f6)",
  "linear-gradient(135deg, #f97316, #eab308)",
]

export default function KataloglarPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [catalogs, setCatalogs] = useState<CatalogData[]>([])
  const [fetching, setFetching] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [expandedEvents, setExpandedEvents] = useState<Event[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  // New catalog form
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [creating, setCreating] = useState(false)

  // Delete confirm
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push("/giris")
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      getCatalogs().then((data) => {
        setCatalogs(data)
        setFetching(false)
      })
    }
  }, [user])

  const handleExpand = async (catId: number) => {
    if (expandedId === catId) {
      setExpandedId(null)
      setExpandedEvents([])
      return
    }
    setExpandedId(catId)
    setLoadingEvents(true)
    try {
      const data = await getCatalogEvents(catId)
      setExpandedEvents(data.events as Event[])
    } catch {
      setExpandedEvents([])
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const cat = await createCatalog(newName.trim(), newDesc.trim() || undefined)
      setCatalogs((prev) => [cat, ...prev])
      setNewName("")
      setNewDesc("")
      setShowNew(false)
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteCatalog(id)
      setCatalogs((prev) => prev.filter((c) => c.id !== id))
      if (expandedId === id) {
        setExpandedId(null)
        setExpandedEvents([])
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  const handleRemoveEvent = async (catalogId: number, eventId: number) => {
    try {
      await removeFromCatalog(catalogId, eventId)
      setExpandedEvents((prev) => prev.filter((e) => e.id !== eventId))
      setCatalogs((prev) =>
        prev.map((c) =>
          c.id === catalogId ? { ...c, event_count: Math.max(0, c.event_count - 1) } : c
        )
      )
    } catch {
      // ignore
    }
  }

  if (loading || !user) return null

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(20px,4vw,40px) 0" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
            Kataloglarım
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-3)", margin: 0 }}>
            {catalogs.length > 0
              ? `${catalogs.length} katalog · ${catalogs.reduce((s, c) => s + c.event_count, 0)} haber`
              : "Haberlerinizi kataloglarda düzenleyin"}
          </p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          style={{
            padding: "9px 18px",
            background: showNew ? "var(--color-surface-2, rgba(0,0,0,0.07))" : "var(--color-accent)",
            color: showNew ? "var(--color-text-2)" : "#fff",
            border: showNew ? "1px solid var(--color-border)" : "none",
            borderRadius: "var(--radius-md)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
        >
          {showNew ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              İptal
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Yeni Katalog
            </>
          )}
        </button>
      </div>

      {/* ── New catalog form ── */}
      {showNew && (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-accent)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 22px",
          marginBottom: 16,
          boxShadow: "0 0 0 3px rgba(37,99,235,0.08)",
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 16px" }}>
            Yeni Katalog Oluştur
          </h3>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Katalog Adı <span style={{ color: "var(--color-accent)" }}>*</span>
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                maxLength={100}
                placeholder="Örneğin: Ukrayna Savaşı"
                autoFocus
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Açıklama <span style={{ color: "var(--color-text-3)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(isteğe bağlı)</span>
              </label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                maxLength={500}
                placeholder="Bu katalog ne hakkında?"
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                style={{
                  padding: "9px 20px",
                  background: "var(--color-accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: creating ? "not-allowed" : "pointer",
                  opacity: creating || !newName.trim() ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {creating ? "Oluşturuluyor..." : "Oluştur"}
              </button>
              <button
                type="button"
                onClick={() => { setShowNew(false); setNewName(""); setNewDesc("") }}
                style={{
                  padding: "9px 18px",
                  background: "transparent",
                  color: "var(--color-text-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Vazgeç
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Catalogs list ── */}
      {fetching ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 70, borderRadius: "var(--radius-lg)", background: "var(--color-border)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        </div>
      ) : catalogs.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 24px",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px dashed var(--color-border)",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "var(--color-surface-2, rgba(0,0,0,0.05))",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: 28,
          }}>
            📁
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", margin: "0 0 8px" }}>
            Henüz kataloğunuz yok
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-3)", margin: "0 0 20px", lineHeight: 1.6 }}>
            Haber sayfalarındaki &quot;Katalog&quot; butonuyla haberleri kataloglara ekleyebilirsiniz.
          </p>
          <button
            onClick={() => setShowNew(true)}
            style={{
              padding: "10px 22px",
              background: "var(--color-accent)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            İlk Kataloğumu Oluştur
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {catalogs.map((cat, idx) => {
            const isExpanded = expandedId === cat.id
            const isDeleting = deletingId === cat.id
            const gradient = ICON_GRADIENTS[idx % ICON_GRADIENTS.length]
            const initials = cat.name.slice(0, 2).toUpperCase()
            return (
              <div
                key={cat.id}
                style={{
                  background: "var(--color-surface)",
                  border: `1px solid ${isExpanded ? "var(--color-accent)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                  boxShadow: isExpanded ? "0 0 0 3px rgba(37,99,235,0.08)" : "none",
                }}
              >
                {/* Catalog header row */}
                <div
                  onClick={() => !isDeleting && handleExpand(cat.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "14px 18px",
                    cursor: "pointer",
                    gap: 14,
                  }}
                >
                  {/* Gradient icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: gradient,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: "#fff",
                    flexShrink: 0,
                  }}>
                    {initials}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cat.name}
                    </div>
                    {cat.description ? (
                      <div style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cat.description}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 2 }}>
                        {cat.event_count === 0 ? "Boş katalog" : `${cat.event_count} haber kaydedildi`}
                      </div>
                    )}
                  </div>

                  <span style={{
                    fontSize: 12, color: "var(--color-text-2)",
                    background: "var(--color-surface-2, rgba(0,0,0,0.06))",
                    padding: "4px 12px", borderRadius: 99, flexShrink: 0,
                    fontWeight: 500,
                  }}>
                    {cat.event_count} haber
                  </span>

                  {/* Delete confirmation or button */}
                  {isDeleting ? (
                    <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        style={{
                          padding: "5px 12px",
                          background: "rgba(239,68,68,0.12)",
                          color: "#ef4444",
                          border: "1px solid rgba(239,68,68,0.3)",
                          borderRadius: "var(--radius-md)",
                          fontSize: 11, fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        Evet, sil
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        style={{
                          padding: "5px 10px",
                          background: "transparent",
                          color: "var(--color-text-2)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-md)",
                          fontSize: 11, cursor: "pointer",
                        }}
                      >
                        Hayır
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingId(cat.id) }}
                      title="Kataloğu sil"
                      style={{
                        background: "none", border: "none",
                        padding: "6px 8px", cursor: "pointer",
                        color: "var(--color-text-3)", borderRadius: "var(--radius-md)",
                        flexShrink: 0, opacity: 0.6, transition: "opacity 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}

                  {/* Chevron */}
                  <svg
                    width="15" height="15"
                    viewBox="0 0 24 24" fill="none"
                    stroke="var(--color-text-3)" strokeWidth="2.5"
                    style={{
                      transform: isExpanded ? "rotate(90deg)" : "rotate(0)",
                      transition: "transform 0.2s", flexShrink: 0,
                    }}
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>

                {/* Expanded events */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--color-border)" }}>
                    {loadingEvents ? (
                      <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                        {[1, 2, 3].map(i => (
                          <div key={i} style={{ height: 36, borderRadius: 8, background: "var(--color-border)", animation: "pulse 1.5s ease-in-out infinite" }} />
                        ))}
                      </div>
                    ) : expandedEvents.length === 0 ? (
                      <div style={{ padding: "28px 18px", textAlign: "center" }}>
                        <p style={{ fontSize: 13, color: "var(--color-text-3)", margin: 0 }}>
                          Bu katalogda henüz haber yok.
                        </p>
                      </div>
                    ) : (
                      expandedEvents.map((evt, ei) => (
                        <div
                          key={evt.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "11px 18px 11px 20px",
                            borderTop: ei > 0 ? "1px solid var(--color-border)" : "none",
                            background: "var(--color-surface)",
                          }}
                        >
                          {/* Left accent */}
                          <div style={{ width: 3, height: 32, borderRadius: 2, background: gradient, flexShrink: 0 }} />

                          {evt.category && (
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              textTransform: "uppercase",
                              color: "var(--color-accent)",
                              flexShrink: 0,
                              letterSpacing: "0.04em",
                            }}>
                              {CATEGORY_LABELS[evt.category] || evt.category}
                            </span>
                          )}

                          <Link
                            href={`/haber/${evt.id}`}
                            style={{
                              flex: 1,
                              color: "var(--color-text)",
                              textDecoration: "none",
                              fontWeight: 500,
                              fontSize: 13,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {evt.title_tr}
                          </Link>

                          <span style={{ fontSize: 11, color: "var(--color-text-3)", flexShrink: 0 }} suppressHydrationWarning>
                            {evt.created_at ? timeAgo(evt.created_at) : ""}
                          </span>

                          <button
                            onClick={() => handleRemoveEvent(cat.id, evt.id)}
                            title="Katalogdan çıkar"
                            style={{
                              background: "none", border: "none",
                              padding: "4px 6px", cursor: "pointer",
                              color: "var(--color-text-3)", flexShrink: 0,
                              borderRadius: "var(--radius-md)",
                              opacity: 0.6, transition: "opacity 0.15s, color 0.15s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#ef4444" }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.color = "var(--color-text-3)" }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  color: "var(--color-text)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
}
