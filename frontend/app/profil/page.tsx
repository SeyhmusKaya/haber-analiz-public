"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { apiUpdateProfile, apiChangePassword } from "@/lib/api"
import { PhoneInput } from "@/components/PhoneInput"

export default function ProfilPage() {
  const { user, loading, refresh, logout } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState({ name: "", phone: "", age: "" })
  const [pwForm, setPwForm] = useState({ current_password: "", password: "", confirm: "" })
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/giris")
    if (user) setForm({ name: user.name, phone: user.phone || "", age: user.age?.toString() || "" })
  }, [user, loading, router])

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setProfileMsg(null)
    try {
      await apiUpdateProfile({ name: form.name, phone: form.phone, age: form.age ? parseInt(form.age) : undefined })
      await refresh()
      setProfileMsg({ type: "ok", text: "Profil bilgileri güncellendi." })
    } catch (err: unknown) {
      setProfileMsg({ type: "err", text: err instanceof Error ? err.message : "Güncelleme başarısız." })
    } finally {
      setSaving(false)
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.password !== pwForm.confirm) {
      setPwMsg({ type: "err", text: "Şifreler eşleşmiyor." })
      return
    }
    setSavingPw(true)
    setPwMsg(null)
    try {
      await apiChangePassword(pwForm.current_password, pwForm.password)
      setPwForm({ current_password: "", password: "", confirm: "" })
      setPwMsg({ type: "ok", text: "Şifreniz başarıyla değiştirildi." })
    } catch (err: unknown) {
      setPwMsg({ type: "err", text: err instanceof Error ? err.message : "Şifre değiştirilemedi." })
    } finally {
      setSavingPw(false)
    }
  }

  if (loading || !user) return null

  const avatarUrl = user.avatar_url || user.avatar || null

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Profil bilgileri */}
      <Card title="Profil Bilgileri" icon="👤">
        <form onSubmit={handleProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {profileMsg && <Alert type={profileMsg.type}>{profileMsg.text}</Alert>}
          <Field label="Ad Soyad">
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              style={inputStyle}
            />
          </Field>
          <Field label="E-posta" hint="Değiştirilemez">
            <input
              value={user.email}
              disabled
              style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }}
            />
          </Field>
          <div className="profil-phone-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <Field label="Telefon">
              <PhoneInput
                value={form.phone}
                onChange={val => setForm(f => ({ ...f, phone: val }))}
              />
            </Field>
            <Field label="Yaş">
              <input
                type="number" min={13} max={120}
                value={form.age}
                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                placeholder="—"
                style={inputStyle}
              />
            </Field>
          </div>
          <div>
            <button type="submit" disabled={saving} style={btnStyle}>
              {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
          </div>
        </form>
      </Card>

      {/* Şifre değiştir — Google kullanıcıları şifre değiştiremez (google_id varsa avatar_url var) */}
      {!avatarUrl && (
        <Card title="Şifre Değiştir" icon="🔒">
          <form onSubmit={handlePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {pwMsg && <Alert type={pwMsg.type}>{pwMsg.text}</Alert>}
            <Field label="Mevcut Şifre">
              <input
                type="password" required
                value={pwForm.current_password}
                onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                placeholder="••••••••"
                style={inputStyle}
              />
            </Field>
            <Field label="Yeni Şifre">
              <input
                type="password" required minLength={8}
                value={pwForm.password}
                onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                style={inputStyle}
              />
            </Field>
            <Field label="Yeni Şifre (Tekrar)">
              <input
                type="password" required
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="••••••••"
                style={inputStyle}
              />
            </Field>
            <div>
              <button type="submit" disabled={savingPw} style={btnStyle}>
                {savingPw ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Tehlikeli bölge — çıkış */}
      <Card title="Hesap İşlemleri" icon="⚙️">
        <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 16 }}>
          Hesabınızdan çıkış yaparak oturumu sonlandırabilirsiniz.
        </p>
        <button
          onClick={async () => { await logout(); router.push("/") }}
          style={dangerBtnStyle}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(239,68,68,0.1)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent"
          }}
        >
          Çıkış Yap
        </button>
      </Card>
    </div>
  )
}

// ─── Helper components ────────────────────────────────────────────────────────

function Card({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      marginBottom: 16,
    }}>
      {/* Subtle top gradient line */}
      <div style={{ height: 3, background: "linear-gradient(90deg, var(--color-accent), transparent)" }} />

      <div style={{ padding: "20px 24px 24px" }}>
        <h2 style={{
          fontSize: 14, fontWeight: 600,
          color: "var(--color-text)",
          marginBottom: 20,
          display: "flex", alignItems: "center", gap: 7,
        }}>
          {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-2)" }}>{label}</label>
        {hint && (
          <span style={{
            fontSize: 11, color: "var(--color-text-3)",
            background: "var(--color-surface-2)",
            padding: "2px 8px", borderRadius: 99,
            border: "1px solid var(--color-border)",
          }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function Alert({ type, children }: { type: "ok" | "err"; children: React.ReactNode }) {
  const ok = type === "ok"
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      background: ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
      border: `1px solid ${ok ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
      borderRadius: "var(--radius-md)",
      padding: "10px 14px",
      fontSize: 13,
      color: ok ? "#16a34a" : "#dc2626",
    }}>
      <span style={{ flexShrink: 0, fontSize: 15, lineHeight: 1.4 }}>
        {ok ? "✓" : "✕"}
      </span>
      <span>{children}</span>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  color: "var(--color-text)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
}

const btnStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "var(--color-accent)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-md)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
}

const dangerBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "transparent",
  border: "1.5px solid rgba(239,68,68,0.45)",
  borderRadius: "var(--radius-md)",
  color: "#ef4444",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.15s",
}
