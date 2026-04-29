"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { adminGetUser, adminUpdateUser, adminChangeUserPassword } from "@/lib/api"

const FEATURE_LABELS: Record<string, string> = {
  chat: "AI Sohbet",
  analysis: "Ülke Analizi",
  long_summary: "Uzun Özet",
}

interface UserDetail {
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    age: number | null
    is_admin: boolean
    is_active: boolean
    google_id: string | null
    avatar: string | null
    created_at: string
  }
  chat_total: number
  chat_today: number
  saved_count: number
  tokens_by_feature: Record<string, number>
  recent_chats: { message: string; created_at: string }[]
}

export default function AdminKullaniciDetay() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<UserDetail | null>(null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [pwModal, setPwModal] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState("")

  useEffect(() => {
    adminGetUser(Number(id))
      .then(setData)
      .catch(e => setError(e.message))
  }, [id])

  async function changePassword() {
    if (newPassword.length < 8) { setPwMsg("Şifre en az 8 karakter olmalı."); return }
    setPwSaving(true); setPwMsg("")
    try {
      await adminChangeUserPassword(data!.user.id, newPassword)
      setPwMsg("✓ Şifre güncellendi.")
      setNewPassword("")
    } catch (e: any) {
      setPwMsg(e.message)
    } finally {
      setPwSaving(false)
    }
  }

  async function toggle(field: "is_active" | "is_admin") {
    if (!data) return
    setSaving(true)
    try {
      const result = await adminUpdateUser(data.user.id, { [field]: !data.user[field] })
      setData(prev => prev ? { ...prev, user: { ...prev.user, [field]: result.user[field] } } : prev)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (error === "FORBIDDEN") {
    return <div style={{ textAlign: "center", padding: "48px 0", color: "#ef4444" }}>Bu sayfaya erişim yetkiniz yok.</div>
  }
  if (error) {
    return <div style={{ textAlign: "center", padding: "48px 0", color: "#ef4444" }}>{error}</div>
  }
  if (!data) {
    return <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-3)" }}>Yükleniyor...</div>
  }

  const { user, chat_total, chat_today, saved_count, tokens_by_feature, recent_chats } = data

  return (
    <div>
      {/* Şifre Değiştir Modal */}
      {pwModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setPwModal(false)}>
          <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "28px 28px 24px",
            width: 360,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }} onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: "var(--color-text)" }}>
              Şifre Değiştir
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 18 }}>
              {data?.user.name || data?.user.email}
            </p>
            <input
              type="password"
              placeholder="Yeni şifre (en az 8 karakter)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && changePassword()}
              style={{
                width: "100%", padding: "10px 12px", fontSize: 14,
                border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
                background: "var(--color-surface-2)", color: "var(--color-text)",
                boxSizing: "border-box", marginBottom: 12, outline: "none",
              }}
            />
            {pwMsg && (
              <p style={{
                fontSize: 13, marginBottom: 12,
                color: pwMsg.startsWith("✓") ? "#16a34a" : "#ef4444",
              }}>{pwMsg}</p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={changePassword}
                disabled={pwSaving}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: "var(--radius-md)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
                  color: "#fff", border: "none",
                  opacity: pwSaving ? 0.6 : 1,
                }}
              >
                {pwSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button
                onClick={() => setPwModal(false)}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: "var(--radius-md)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: "var(--color-surface-2)", color: "var(--color-text-2)",
                  border: "1px solid var(--color-border)",
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <Link href="/admin/kullanicilar" style={{ color: "var(--color-text-3)", textDecoration: "none", fontSize: 13 }}>
          ← Kullanıcılar
        </Link>
        <span style={{ color: "var(--color-border)" }}>›</span>
        <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>{user.name || user.email}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>
        {/* Profile card */}
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
        }}>
          {/* Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 20 }}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 700, color: "#fff",
              }}>
                {(user.name || user.email)[0].toUpperCase()}
              </div>
            )}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--color-text)" }}>{user.name || "—"}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 2 }}>{user.email}</div>
            </div>
          </div>

          {/* Info rows */}
          {[
            { label: "ID", value: String(user.id) },
            { label: "Telefon", value: user.phone || "—" },
            { label: "Yaş", value: user.age ? String(user.age) : "—" },
            { label: "Giriş Yöntemi", value: user.google_id ? "Google" : "E-posta" },
            { label: "Kayıt Tarihi", value: new Date(user.created_at).toLocaleDateString("tr-TR") },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: "1px solid var(--color-border-subtle)",
              fontSize: 13,
            }}>
              <span style={{ color: "var(--color-text-3)" }}>{label}</span>
              <span style={{ color: "var(--color-text-2)", fontWeight: 500 }}>{value}</span>
            </div>
          ))}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}>
            <button
              onClick={() => toggle("is_active")}
              disabled={saving}
              style={{
                padding: "9px 0", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600,
                cursor: "pointer", border: "1px solid var(--color-border)",
                background: user.is_active ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                color: user.is_active ? "#ef4444" : "#16a34a",
              }}
            >
              {user.is_active ? "Hesabı Engelle" : "Hesabı Aktif Et"}
            </button>
            <button
              onClick={() => toggle("is_admin")}
              disabled={saving}
              style={{
                padding: "9px 0", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600,
                cursor: "pointer", border: "1px solid var(--color-border)",
                background: "var(--color-surface-2)",
                color: user.is_admin ? "#ef4444" : "#3b82f6",
              }}
            >
              {user.is_admin ? "Admin Yetkisini Kaldır" : "Admin Yap"}
            </button>
            <button
              onClick={() => { setPwModal(true); setPwMsg(""); setNewPassword("") }}
              style={{
                padding: "9px 0", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600,
                cursor: "pointer", border: "1px solid var(--color-border)",
                background: "var(--color-surface-2)", color: "var(--color-text-2)",
              }}
            >
              Şifre Değiştir
            </button>
          </div>

          {/* Badges */}
          <div style={{ display: "flex", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99,
              background: user.is_active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)",
              color: user.is_active ? "#16a34a" : "#ef4444",
            }}>{user.is_active ? "Aktif" : "Pasif"}</span>
            {user.is_admin && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99,
                background: "rgba(59,130,246,0.12)", color: "#3b82f6",
              }}>Admin</span>
            )}
          </div>
        </div>

        {/* Stats & activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Toplam Chat", value: chat_total },
              { label: "Bugün Chat", value: chat_today },
              { label: "Kaydedilen Haber", value: saved_count },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "var(--color-surface)", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)", padding: "16px 18px", textAlign: "center",
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text)" }}>{value}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Token usage */}
          <div style={{
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", padding: "20px 22px",
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginBottom: 12 }}>Token Kullanımı</p>
            {Object.entries(tokens_by_feature).length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--color-text-3)" }}>Henüz token kullanımı yok.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(tokens_by_feature).map(([feature, total]) => (
                  <div key={feature} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--color-text-2)" }}>{FEATURE_LABELS[feature] || feature}</span>
                    <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{Number(total).toLocaleString("tr-TR")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent chats */}
          <div style={{
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", padding: "20px 22px",
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginBottom: 12 }}>
              Son Sohbet Mesajları
            </p>
            {recent_chats.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--color-text-3)" }}>Henüz mesaj yok.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recent_chats.map((chat, i) => (
                  <div key={i} style={{
                    padding: "8px 12px",
                    background: "var(--color-surface-2)",
                    borderRadius: "var(--radius-md)",
                    fontSize: 12,
                  }}>
                    <p style={{ color: "var(--color-text-2)", lineHeight: 1.5, marginBottom: 4 }}>
                      {chat.message.length > 120 ? chat.message.slice(0, 120) + "..." : chat.message}
                    </p>
                    <p style={{ color: "var(--color-text-3)" }}>
                      {new Date(chat.created_at).toLocaleString("tr-TR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
