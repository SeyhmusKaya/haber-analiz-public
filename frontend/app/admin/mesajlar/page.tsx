"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"

const API_URL = ""

const SUBJECT_LABELS: Record<string, string> = {
  genel:      "Genel Soru",
  oneri:      "Öneri",
  hata:       "Hata Bildirimi",
  kvkk:       "KVKK Başvurusu",
  isbirligi:  "İş Birliği",
  diger:      "Diğer",
}

interface ContactMessage {
  id: number
  name: string
  email: string
  subject: string
  message: string
  ip: string
  is_read: boolean
  created_at: string
}

interface Paginated {
  data: ContactMessage[]
  current_page: number
  last_page: number
  total: number
}

export default function AdminMesajlarPage() {
  const { token } = useAuth()
  const [data, setData]         = useState<Paginated | null>(null)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  const fetchMessages = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/contact?page=${p}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      })
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchMessages(page) }, [page, fetchMessages])

  async function markRead(id: number) {
    await fetch(`${API_URL}/api/admin/contact/${id}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
    setData(prev => prev ? {
      ...prev,
      data: prev.data.map(m => m.id === id ? { ...m, is_read: true } : m),
    } : prev)
    if (selected?.id === id) setSelected(s => s ? { ...s, is_read: true } : s)
  }

  async function deleteMessage(id: number) {
    if (!confirm("Bu mesajı silmek istediğinize emin misiniz?")) return
    setDeleting(id)
    try {
      await fetch(`${API_URL}/api/admin/contact/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      })
      setData(prev => prev ? { ...prev, data: prev.data.filter(m => m.id !== id), total: prev.total - 1 } : prev)
      if (selected?.id === id) setSelected(null)
    } finally {
      setDeleting(null)
    }
  }

  function openMessage(msg: ContactMessage) {
    setSelected(msg)
    if (!msg.is_read) markRead(msg.id)
  }

  const unread = data?.data.filter(m => !m.is_read).length ?? 0

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
          İletişim Mesajları
        </h1>
        {unread > 0 && (
          <span style={{
            background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700,
            borderRadius: 99, padding: "2px 8px",
          }}>
            {unread} yeni
          </span>
        )}
        {data && (
          <span style={{ fontSize: 13, color: "var(--color-text-3)", marginLeft: "auto" }}>
            Toplam {data.total} mesaj
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1.2fr" : "1fr", gap: 20 }}>
        {/* Mesaj Listesi */}
        <div style={{
          background: "var(--color-surface)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)", overflow: "hidden",
        }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-3)", fontSize: 14 }}>
              Yükleniyor...
            </div>
          ) : !data?.data.length ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-3)", fontSize: 14 }}>
              Henüz mesaj yok.
            </div>
          ) : (
            data.data.map((msg, i) => (
              <div
                key={msg.id}
                onClick={() => openMessage(msg)}
                style={{
                  padding: "14px 16px",
                  borderBottom: i < data.data.length - 1 ? "1px solid var(--color-border)" : "none",
                  cursor: "pointer",
                  background: selected?.id === msg.id
                    ? "rgba(37,99,235,0.06)"
                    : !msg.is_read
                      ? "rgba(37,99,235,0.03)"
                      : "transparent",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  {!msg.is_read && (
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb", flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 14, fontWeight: msg.is_read ? 400 : 600, color: "var(--color-text)", flex: 1 }}>
                    {msg.name}
                  </span>
                  <span style={{
                    fontSize: 11, padding: "2px 7px", borderRadius: 99,
                    background: "var(--color-surface-2)", color: "var(--color-text-2)",
                  }}>
                    {SUBJECT_LABELS[msg.subject] ?? msg.subject}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-2)", marginLeft: !msg.is_read ? 15 : 0 }}>
                  {msg.email}
                </div>
                <div style={{
                  fontSize: 12, color: "var(--color-text-3)", marginTop: 4,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  marginLeft: !msg.is_read ? 15 : 0,
                }}>
                  {msg.message}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 6, marginLeft: !msg.is_read ? 15 : 0 }}>
                  {new Date(msg.created_at).toLocaleString("tr-TR")}
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {data && data.last_page > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px", borderTop: "1px solid var(--color-border)",
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={paginationBtn(page === 1)}
              >
                ← Önceki
              </button>
              <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>
                {page} / {data.last_page}
              </span>
              <button
                onClick={() => setPage(p => Math.min(data.last_page, p + 1))}
                disabled={page === data.last_page}
                style={paginationBtn(page === data.last_page)}
              >
                Sonraki →
              </button>
            </div>
          )}
        </div>

        {/* Mesaj Detay */}
        {selected && (
          <div style={{
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", padding: "24px", position: "sticky", top: 20,
            alignSelf: "start",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 99,
                background: "rgba(37,99,235,0.1)", color: "#2563eb",
              }}>
                {SUBJECT_LABELS[selected.subject] ?? selected.subject}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {!selected.is_read && (
                  <button
                    onClick={() => markRead(selected.id)}
                    style={{
                      fontSize: 12, padding: "5px 12px", borderRadius: "var(--radius-md)",
                      background: "rgba(22,163,74,0.1)", color: "#16a34a",
                      border: "1px solid rgba(22,163,74,0.3)", cursor: "pointer",
                    }}
                  >
                    Okundu İşaretle
                  </button>
                )}
                <button
                  onClick={() => deleteMessage(selected.id)}
                  disabled={deleting === selected.id}
                  style={{
                    fontSize: 12, padding: "5px 12px", borderRadius: "var(--radius-md)",
                    background: "rgba(239,68,68,0.1)", color: "#ef4444",
                    border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer",
                    opacity: deleting === selected.id ? 0.6 : 1,
                  }}
                >
                  {deleting === selected.id ? "Siliniyor..." : "Sil"}
                </button>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    fontSize: 16, padding: "4px 8px", borderRadius: "var(--radius-md)",
                    background: "none", color: "var(--color-text-3)",
                    border: "1px solid var(--color-border)", cursor: "pointer", lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Row label="Ad Soyad" value={selected.name} />
              <Row label="E-posta">
                <a
                  href={`mailto:${selected.email}`}
                  style={{ color: "var(--color-accent)", textDecoration: "none", fontSize: 14 }}
                >
                  {selected.email}
                </a>
              </Row>
              <Row label="IP Adresi" value={selected.ip} />
              <Row label="Tarih" value={new Date(selected.created_at).toLocaleString("tr-TR")} />
            </div>

            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 8 }}>
                Mesaj
              </p>
              <div style={{
                background: "var(--color-bg)", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)", padding: "14px 16px",
                fontSize: 14, color: "var(--color-text)", lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}>
                {selected.message}
              </div>
            </div>

            <a
              href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(SUBJECT_LABELS[selected.subject] ?? selected.subject)}`}
              style={{
                display: "inline-block", marginTop: 16,
                padding: "10px 20px", fontSize: 14, fontWeight: 600,
                background: "var(--color-accent)", color: "#fff",
                border: "none", borderRadius: "var(--radius-md)", textDecoration: "none",
              }}
            >
              Yanıtla →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", width: 90, flexShrink: 0 }}>
        {label}
      </span>
      {children ?? <span style={{ fontSize: 14, color: "var(--color-text)" }}>{value}</span>}
    </div>
  )
}

function paginationBtn(disabled: boolean): React.CSSProperties {
  return {
    fontSize: 13, padding: "6px 14px", borderRadius: "var(--radius-md)",
    background: disabled ? "var(--color-surface-2)" : "var(--color-accent)",
    color: disabled ? "var(--color-text-3)" : "#fff",
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  }
}
