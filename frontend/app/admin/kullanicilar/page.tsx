"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { adminGetUsers, adminUpdateUser, adminGiftPlan } from "@/lib/api"

interface UserRow {
  id: number
  name: string
  email: string
  phone: string | null
  age: number | null
  is_admin: boolean
  is_active: boolean
  google_id: string | null
  created_at: string
  plan?: string
  plan_expires_at?: string | null
}

interface GiftModal {
  user: UserRow
  months: number
  role: "none" | "admin" | "pro"
}

const MONTH_OPTIONS = [1, 3, 6, 12]

export default function AdminKullanicilar() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [giftModal, setGiftModal] = useState<GiftModal | null>(null)
  const [giftLoading, setGiftLoading] = useState(false)
  const [giftError, setGiftError] = useState("")
  const [giftSuccess, setGiftSuccess] = useState("")

  const load = useCallback(async (p: number, q: string, inactive: boolean) => {
    setLoading(true)
    setError("")
    try {
      const data = await adminGetUsers(p, q, inactive)
      setUsers(data.users)
      setTotal(data.total)
      setPage(data.page)
      setPages(data.pages)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(1, search, showInactive)
  }, [search, showInactive])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
  }

  async function toggleActive(user: UserRow) {
    try {
      const result = await adminUpdateUser(user.id, { is_active: !user.is_active })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: result.user.is_active } : u))
    } catch (e: any) {
      alert(e.message)
    }
  }

  function openGiftModal(user: UserRow) {
    setGiftModal({ user, months: 1, role: "pro" })
    setGiftError("")
    setGiftSuccess("")
  }

  async function handleGift() {
    if (!giftModal) return
    setGiftLoading(true)
    setGiftError("")
    setGiftSuccess("")
    try {
      if (giftModal.role === "admin") {
        const result = await adminUpdateUser(giftModal.user.id, { is_admin: true })
        setUsers(prev => prev.map(u => u.id === giftModal.user.id ? { ...u, is_admin: result.user.is_admin } : u))
        setGiftSuccess(`${giftModal.user.name} kullanıcısına admin yetkisi verildi.`)
      } else if (giftModal.role === "pro") {
        const result = await adminGiftPlan(giftModal.user.id, "pro", giftModal.months)
        setUsers(prev => prev.map(u => u.id === giftModal.user.id ? {
          ...u,
          plan: result.plan ?? "pro",
          plan_expires_at: result.plan_expires_at ?? null,
        } : u))
        setGiftSuccess(`${giftModal.user.name} kullanıcısına ${giftModal.months} aylık Pro üyelik hediye edildi.`)
      }
    } catch (e: any) {
      setGiftError(e.message)
    } finally {
      setGiftLoading(false)
    }
  }

  if (error === "FORBIDDEN") {
    return <div style={{ textAlign: "center", padding: "48px 0", color: "#ef4444" }}>Bu sayfaya erişim yetkiniz yok.</div>
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)" }}>
          Kullanıcılar <span style={{ fontSize: 14, fontWeight: 400, color: "var(--color-text-3)" }}>({total})</span>
        </h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-text-2)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
            />
            Pasif kullanıcılar
          </label>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 6 }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="İsim veya e-posta ara..."
              style={{
                padding: "7px 12px", fontSize: 13,
                background: "var(--color-surface)", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)", color: "var(--color-text)", outline: "none",
                width: 220,
              }}
            />
            <button type="submit" style={{
              padding: "7px 14px", fontSize: 13, fontWeight: 500,
              background: "var(--color-accent)", color: "#fff", border: "none",
              borderRadius: "var(--radius-md)", cursor: "pointer",
            }}>Ara</button>
          </form>
        </div>
      </div>

      {error && <div style={{ color: "#ef4444", marginBottom: 16, fontSize: 13 }}>{error}</div>}

      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflowX: "auto",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-2)" }}>
              {["ID", "İsim", "E-posta", "Kayıt Tarihi", "Durum", "Rol / Plan", "İşlem"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--color-text-2)", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ padding: "32px 14px", textAlign: "center", color: "var(--color-text-3)" }}>
                  Yükleniyor...
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "32px 14px", textAlign: "center", color: "var(--color-text-3)" }}>
                  Kullanıcı bulunamadı.
                </td>
              </tr>
            )}
            {!loading && users.map((user, i) => (
              <tr key={user.id} style={{
                borderBottom: i < users.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
              }}>
                <td style={{ padding: "10px 14px", color: "var(--color-text-3)" }}>{user.id}</td>
                <td style={{ padding: "10px 14px" }}>
                  <Link href={`/admin/kullanici/${user.id}`} style={{ color: "var(--color-text)", textDecoration: "none", fontWeight: 500 }}>
                    {user.name || "—"}
                  </Link>
                  {user.google_id && <span style={{ marginLeft: 6, fontSize: 11, color: "var(--color-text-3)" }}>G</span>}
                </td>
                <td style={{ padding: "10px 14px", color: "var(--color-text-2)" }}>{user.email}</td>
                <td style={{ padding: "10px 14px", color: "var(--color-text-3)", whiteSpace: "nowrap" }}>
                  {new Date(user.created_at).toLocaleDateString("tr-TR")}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99,
                    background: user.is_active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)",
                    color: user.is_active ? "#16a34a" : "#ef4444",
                  }}>
                    {user.is_active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {user.is_admin && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99,
                        background: "rgba(59,130,246,0.12)", color: "#3b82f6",
                      }}>Admin</span>
                    )}
                    {user.plan === "pro" ? (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99,
                        background: "rgba(124,58,237,0.12)", color: "#7c3aed",
                      }}>
                        💎 Pro
                        {user.plan_expires_at && (
                          <span style={{ fontWeight: 400, marginLeft: 4 }}>
                            ({new Date(user.plan_expires_at).toLocaleDateString("tr-TR")}'e kadar)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99,
                        background: "rgba(107,114,128,0.1)", color: "var(--color-text-3)",
                      }}>Ücretsiz</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/admin/kullanici/${user.id}`} style={{
                      fontSize: 12, color: "var(--color-accent)", textDecoration: "none",
                    }}>Detay</Link>
                    <button
                      onClick={() => toggleActive(user)}
                      style={{
                        fontSize: 12, background: "none", border: "none", cursor: "pointer",
                        color: user.is_active ? "#ef4444" : "#16a34a", padding: 0,
                      }}
                    >
                      {user.is_active ? "Engelle" : "Aktif Et"}
                    </button>
                    <button
                      onClick={() => openGiftModal(user)}
                      style={{
                        fontSize: 12, background: "none", border: "none", cursor: "pointer",
                        color: "#7c3aed", padding: 0, fontWeight: 500,
                      }}
                    >
                      🎁 Hediye
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => load(p, search, showInactive)}
              style={{
                width: 32, height: 32, borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: p === page ? "var(--color-accent)" : "var(--color-surface)",
                color: p === page ? "#fff" : "var(--color-text-2)",
                cursor: "pointer", fontSize: 13, fontWeight: 500,
              }}
            >{p}</button>
          ))}
        </div>
      )}

      {/* Gift Modal */}
      {giftModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setGiftModal(null) }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16, padding: "28px 28px 24px",
            width: "100%", maxWidth: 440,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)" }}>
                🎁 Hediye Et
              </h2>
              <button onClick={() => setGiftModal(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--color-text-3)" }}>×</button>
            </div>

            <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 20 }}>
              <strong style={{ color: "var(--color-text)" }}>{giftModal.user.name}</strong> ({giftModal.user.email}) kullanıcısına hediye verilecek.
            </p>

            {/* Role selection */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Hediye Türü
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setGiftModal(m => m ? { ...m, role: "pro" } : m)}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    borderColor: giftModal.role === "pro" ? "#7c3aed" : "var(--color-border)",
                    background: giftModal.role === "pro" ? "rgba(124,58,237,0.1)" : "var(--color-surface-2)",
                    color: giftModal.role === "pro" ? "#7c3aed" : "var(--color-text-2)",
                  }}
                >
                  💎 Pro Üyelik
                </button>
                <button
                  onClick={() => setGiftModal(m => m ? { ...m, role: "admin" } : m)}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    borderColor: giftModal.role === "admin" ? "#3b82f6" : "var(--color-border)",
                    background: giftModal.role === "admin" ? "rgba(59,130,246,0.1)" : "var(--color-surface-2)",
                    color: giftModal.role === "admin" ? "#3b82f6" : "var(--color-text-2)",
                  }}
                >
                  🔑 Admin Yetkisi
                </button>
              </div>
            </div>

            {/* Duration — only for Pro */}
            {giftModal.role === "pro" && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Süre
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                  {MONTH_OPTIONS.map(m => (
                    <button
                      key={m}
                      onClick={() => setGiftModal(prev => prev ? { ...prev, months: m } : prev)}
                      style={{
                        padding: "10px 0", borderRadius: 10, border: "1.5px solid",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        borderColor: giftModal.months === m ? "#7c3aed" : "var(--color-border)",
                        background: giftModal.months === m ? "rgba(124,58,237,0.1)" : "var(--color-surface-2)",
                        color: giftModal.months === m ? "#7c3aed" : "var(--color-text-2)",
                      }}
                    >
                      {m} ay
                    </button>
                  ))}
                </div>
              </div>
            )}

            {giftModal.role === "admin" && (
              <div style={{
                marginBottom: 24, padding: "12px 14px",
                background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10, fontSize: 13, color: "#dc2626",
              }}>
                ⚠️ Bu işlem geri alınabilir. Kullanıcıya tam admin erişimi verilecektir.
              </div>
            )}

            {giftError && (
              <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 12 }}>⚠️ {giftError}</p>
            )}
            {giftSuccess && (
              <p style={{ fontSize: 13, color: "#16a34a", marginBottom: 12 }}>✓ {giftSuccess}</p>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setGiftModal(null)}
                style={{
                  padding: "9px 20px", fontSize: 13, fontWeight: 500,
                  background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
                  borderRadius: 10, cursor: "pointer", color: "var(--color-text-2)",
                }}
              >İptal</button>
              <button
                onClick={handleGift}
                disabled={giftLoading}
                style={{
                  padding: "9px 24px", fontSize: 13, fontWeight: 600,
                  background: giftModal.role === "admin" ? "#2563eb" : "#7c3aed",
                  color: "#fff", border: "none", borderRadius: 10,
                  cursor: giftLoading ? "not-allowed" : "pointer",
                  opacity: giftLoading ? 0.7 : 1,
                }}
              >
                {giftLoading ? "İşleniyor..." : "Hediye Et"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
