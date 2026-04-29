"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"

const API_URL = ""

interface SmtpSettings {
  host: string
  port: number
  username: string
  password: string
  from_email: string
  from_name: string
}

export default function AdminBultenPage() {
  const { token, loading } = useAuth()

  const [settings, setSettings] = useState<SmtpSettings>({
    host: "",
    port: 587,
    username: "",
    password: "",
    from_email: "",
    from_name: "",
  })
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [testMsg, setTestMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  useEffect(() => {
    if (loading || !token) return
    setFetching(true)
    fetch(`${API_URL}/api/admin/smtp`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data: SmtpSettings) => setSettings(data))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [token, loading])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/smtp`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error("Kaydetme başarısız.")
      setMsg({ type: "ok", text: "SMTP ayarları kaydedildi." })
    } catch (err: unknown) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Bir hata oluştu." })
    } finally {
      setSaving(false)
    }
  }

  async function handleTestMail() {
    setTesting(true)
    setTestMsg(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/smtp/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error("Test maili gönderilemedi.")
      setTestMsg({ type: "ok", text: "Test maili başarıyla gönderildi." })
    } catch (err: unknown) {
      setTestMsg({ type: "err", text: err instanceof Error ? err.message : "Mail gönderilemedi." })
    } finally {
      setTesting(false)
    }
  }

  function updateField(key: keyof SmtpSettings, value: string | number) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  if (loading) return null

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>{"\u{1F4E7}"} SMTP Ayarları</h1>

      {fetching ? (
        <div style={cardStyle}>
          <div style={skeletonStyle} />
          <div style={{ ...skeletonStyle, width: "60%" }} />
          <div style={{ ...skeletonStyle, width: "80%" }} />
          <div style={{ ...skeletonStyle, width: "40%" }} />
        </div>
      ) : (
        <form onSubmit={handleSave}>
          {msg && <Alert type={msg.type}>{msg.text}</Alert>}

          <div style={cardStyle}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Host & Port */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <Field label="SMTP Host">
                  <input
                    value={settings.host}
                    onChange={e => updateField("host", e.target.value)}
                    placeholder="smtp.gmail.com"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Port">
                  <input
                    type="number"
                    value={settings.port}
                    onChange={e => updateField("port", parseInt(e.target.value) || 0)}
                    placeholder="587"
                    style={inputStyle}
                  />
                </Field>
              </div>

              {/* Username */}
              <Field label="Kullanıcı Adı">
                <input
                  value={settings.username}
                  onChange={e => updateField("username", e.target.value)}
                  placeholder="info@medyaizle.com"
                  style={inputStyle}
                />
              </Field>

              {/* Password */}
              <Field label="Şifre">
                <input
                  type="password"
                  value={settings.password}
                  onChange={e => updateField("password", e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </Field>

              {/* From Email & From Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Gönderici E-posta">
                  <input
                    type="email"
                    value={settings.from_email}
                    onChange={e => updateField("from_email", e.target.value)}
                    placeholder="noreply@medyaizle.com"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Gönderici Adı">
                  <input
                    value={settings.from_name}
                    onChange={e => updateField("from_name", e.target.value)}
                    placeholder="Medya İzle"
                    style={inputStyle}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" disabled={saving} style={btnStyle}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={handleTestMail}
              disabled={testing}
              style={testBtnStyle}
            >
              {testing ? "Gönderiliyor..." : "Test Mail Gönder"}
            </button>
          </div>

          {testMsg && (
            <div style={{ marginTop: 12 }}>
              <Alert type={testMsg.type}>{testMsg.text}</Alert>
            </div>
          )}
        </form>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-2)", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Alert({ type, children }: { type: "ok" | "err"; children: React.ReactNode }) {
  const ok = type === "ok"
  return (
    <div style={{
      background: ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
      border: `1px solid ${ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
      borderRadius: "var(--radius-md)", padding: "10px 14px",
      fontSize: 13, color: ok ? "#22c55e" : "#ef4444", marginBottom: 16,
    }}>
      {children}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: "48px auto",
  padding: "0 20px",
}

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "var(--color-text)",
  marginBottom: 24,
}

const cardStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: 24,
  marginBottom: 16,
}

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
}

const btnStyle: React.CSSProperties = {
  padding: "12px 24px",
  background: "var(--color-accent)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-md)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  flex: 1,
}

const testBtnStyle: React.CSSProperties = {
  padding: "12px 24px",
  background: "transparent",
  color: "var(--color-accent)",
  border: "1px solid var(--color-accent)",
  borderRadius: "var(--radius-md)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  flex: 1,
}

const skeletonStyle: React.CSSProperties = {
  height: 16,
  borderRadius: 8,
  background: "var(--color-border)",
  marginBottom: 12,
  animation: "pulse 1.5s ease-in-out infinite",
}
