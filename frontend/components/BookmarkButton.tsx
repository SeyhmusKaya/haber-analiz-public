"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"
import {
  getCatalogs, createCatalog, addToCatalog,
  removeFromCatalog, getEventCatalogs, CatalogData,
} from "@/lib/api"

interface Props { eventId: number }

export default function BookmarkButton({ eventId }: Props) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [catalogs, setCatalogs] = useState<CatalogData[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowNewForm(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [cats, eventCats] = await Promise.all([getCatalogs(), getEventCatalogs(eventId)])
      setCatalogs(cats)
      setCheckedIds(new Set(eventCats.catalog_ids))
    } catch { }
    finally { setLoading(false) }
  }, [user, eventId])

  const handleToggle = () => {
    if (!open && user) loadData()
    setOpen(!open)
  }

  const handleCheck = async (catalogId: number) => {
    const isChecked = checkedIds.has(catalogId)
    setCheckedIds(prev => {
      const next = new Set(prev)
      isChecked ? next.delete(catalogId) : next.add(catalogId)
      return next
    })
    try {
      isChecked ? await removeFromCatalog(catalogId, eventId) : await addToCatalog(catalogId, eventId)
    } catch {
      setCheckedIds(prev => {
        const next = new Set(prev)
        isChecked ? next.add(catalogId) : next.delete(catalogId)
        return next
      })
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const cat = await createCatalog(newName.trim())
      setCatalogs(prev => [cat, ...prev])
      await addToCatalog(cat.id, eventId)
      setCheckedIds(prev => new Set([...prev, cat.id]))
      setNewName("")
      setShowNewForm(false)
    } catch { }
    finally { setCreating(false) }
  }

  const isBookmarked = checkedIds.size > 0

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={handleToggle}
        title="Kataloğa ekle"
        style={{
          background: isBookmarked ? "rgba(37,99,235,0.1)" : "none",
          border: `1px solid ${isBookmarked ? "var(--color-accent)" : "var(--color-border)"}`,
          borderRadius: 8, cursor: "pointer", padding: "6px 12px",
          display: "flex", alignItems: "center", gap: 6,
          color: isBookmarked ? "var(--color-accent)" : "var(--color-text-2)",
          fontSize: 13, fontWeight: isBookmarked ? 600 : 400,
          transition: "all 0.15s",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24"
          fill={isBookmarked ? "currentColor" : "none"}
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        {isBookmarked ? "Kaydedildi" : "Kaydet"}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
          minWidth: 280, maxWidth: 320, zIndex: 200,
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 16px 12px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15 }}>🔖</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>
                Kataloğa Ekle
              </span>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--color-text-3)", fontSize: 18, lineHeight: 1, padding: 2,
            }}>×</button>
          </div>

          {!user ? (
            <div style={{ padding: "20px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--color-text-2)", margin: "0 0 12px" }}>
                Kaydetmek için giriş yapmalısınız.
              </p>
              <a href="/giris" style={{
                display: "inline-block", padding: "8px 20px",
                background: "var(--color-accent)", color: "#fff",
                borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none",
              }}>Giriş Yap</a>
            </div>
          ) : loading ? (
            <div style={{ padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>⏳</div>
              <span style={{ fontSize: 13, color: "var(--color-text-3)" }}>Yükleniyor...</span>
            </div>
          ) : (
            <>
              {/* Catalog list */}
              <div style={{ maxHeight: 220, overflowY: "auto" }}>
                {catalogs.length === 0 && !showNewForm ? (
                  <div style={{ padding: "24px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>📂</div>
                    <p style={{ fontSize: 13, color: "var(--color-text-3)", margin: 0 }}>
                      Henüz kataloğunuz yok.
                    </p>
                  </div>
                ) : (
                  catalogs.map(cat => {
                    const checked = checkedIds.has(cat.id)
                    return (
                      <label key={cat.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 16px", cursor: "pointer",
                        background: checked ? "rgba(37,99,235,0.06)" : "transparent",
                        transition: "background 0.12s",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                        onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "var(--color-surface-2)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = checked ? "rgba(37,99,235,0.06)" : "transparent" }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                          border: `2px solid ${checked ? "var(--color-accent)" : "var(--color-border)"}`,
                          background: checked ? "var(--color-accent)" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}>
                          {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>}
                        </div>
                        <input type="checkbox" checked={checked} onChange={() => handleCheck(cat.id)} style={{ display: "none" }} />
                        <span style={{
                          flex: 1, fontSize: 13, fontWeight: checked ? 600 : 400,
                          color: checked ? "var(--color-accent)" : "var(--color-text)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{cat.name}</span>
                        <span style={{
                          fontSize: 11, color: "var(--color-text-3)",
                          background: "var(--color-surface-2)",
                          padding: "1px 6px", borderRadius: 99,
                        }}>{cat.event_count}</span>
                      </label>
                    )
                  })
                )}
              </div>

              {/* New catalog */}
              <div style={{ padding: "10px 16px", borderTop: "1px solid var(--color-border)" }}>
                {!showNewForm ? (
                  <button onClick={() => setShowNewForm(true)} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--color-accent)", fontSize: 13, fontWeight: 600, padding: 0,
                  }}>
                    <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
                    Yeni Katalog Oluştur
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text" value={newName} onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCreate()}
                      placeholder="Katalog adı..." autoFocus
                      style={{
                        flex: 1, padding: "7px 10px", fontSize: 13, borderRadius: 8,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-surface-2)", color: "var(--color-text)",
                        outline: "none",
                      }}
                    />
                    <button onClick={handleCreate} disabled={creating || !newName.trim()} style={{
                      padding: "7px 14px", fontSize: 12, fontWeight: 700, borderRadius: 8,
                      border: "none", background: "var(--color-accent)", color: "#fff",
                      cursor: creating || !newName.trim() ? "not-allowed" : "pointer",
                      opacity: creating || !newName.trim() ? 0.5 : 1,
                      transition: "opacity 0.15s",
                    }}>
                      {creating ? "..." : "Ekle"}
                    </button>
                    <button onClick={() => { setShowNewForm(false); setNewName("") }} style={{
                      padding: "7px 10px", fontSize: 12, borderRadius: 8,
                      border: "1px solid var(--color-border)", background: "none",
                      color: "var(--color-text-3)", cursor: "pointer",
                    }}>İptal</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
