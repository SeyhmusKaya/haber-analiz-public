"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"

const API_URL = ""

const CATEGORIES = [
  { key: "siyaset", label: "Siyaset" },
  { key: "ekonomi", label: "Ekonomi" },
  { key: "savas-catisma", label: "Savaş-Çatışma" },
  { key: "diplomasi", label: "Diplomasi" },
  { key: "teknoloji", label: "Teknoloji" },
  { key: "saglik", label: "Sağlık" },
  { key: "cevre", label: "Çevre" },
  { key: "spor", label: "Spor" },
  { key: "kultur", label: "Kültür" },
]

const COUNTRIES = [
  { code: "TR", name: "Türkiye", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "US", name: "ABD", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "GB", name: "İngiltere", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "DE", name: "Almanya", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "RU", name: "Rusya", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "CN", name: "Çin", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "IR", name: "İran", flag: "\u{1F1EE}\u{1F1F7}" },
  { code: "IL", name: "İsrail", flag: "\u{1F1EE}\u{1F1F1}" },
  { code: "SA", name: "S. Arabistan", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "EG", name: "Mısır", flag: "\u{1F1EA}\u{1F1EC}" },
]

const FREQUENCIES = [
  { value: "daily", label: "Günlük" },
  { value: "weekly", label: "Haftalık" },
  { value: "biweekly", label: "İki Haftada Bir" },
  { value: "monthly", label: "Aylık" },
]

interface NewsletterSettings {
  enabled: boolean
  frequency: string
  categories: string[]
  countries: string[]
  min_importance: number
}

export default function BultenPage() {
  const { user, token, loading } = useAuth()
  const router = useRouter()

  const [settings, setSettings] = useState<NewsletterSettings>({
    enabled: false,
    frequency: "weekly",
    categories: [],
    countries: [],
    min_importance: 5,
  })
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  useEffect(() => {
    if (!loading && !user) return
    if (!token) return
    setFetching(true)
    fetch(`${API_URL}/api/user/newsletter`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data: NewsletterSettings) => setSettings(data))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [user, token, loading])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`${API_URL}/api/user/newsletter`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error("Kaydetme başarısız.")
      setMsg({ type: "ok", text: "Bülten ayarları kaydedildi." })
    } catch (err: unknown) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Bir hata oluştu." })
    } finally {
      setSaving(false)
    }
  }

  function toggleCategory(key: string) {
    setSettings(s => ({
      ...s,
      categories: s.categories.includes(key)
        ? s.categories.filter(c => c !== key)
        : [...s.categories, key],
    }))
  }

  function toggleCountry(code: string) {
    setSettings(s => ({
      ...s,
      countries: s.countries.includes(code)
        ? s.countries.filter(c => c !== code)
        : [...s.countries, code],
    }))
  }

  if (loading) return null
  if (!user) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ color: "var(--color-text-2)", fontSize: 14, textAlign: "center" }}>
            Bu sayfayı görüntülemek için{" "}
            <span onClick={() => router.push("/giris")} style={{ color: "var(--color-accent)", cursor: "pointer", fontWeight: 600 }}>
              giriş yapmanız
            </span>{" "}
            gerekmektedir.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>{"\u{1F4E7}"} Bülten Ayarları</h1>

      {fetching ? (
        <div style={cardStyle}>
          <div style={skeletonStyle} />
          <div style={{ ...skeletonStyle, width: "60%" }} />
          <div style={{ ...skeletonStyle, width: "80%" }} />
        </div>
      ) : (
        <form onSubmit={handleSave}>
          {msg && <Alert type={msg.type}>{msg.text}</Alert>}

          {/* Bülten aktif/pasif */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}>Bülten</div>
                <div style={{ fontSize: 13, color: "var(--color-text-3)", marginTop: 2 }}>
                  E-posta ile haber özeti alın
                </div>
              </div>
              <ToggleSwitch
                checked={settings.enabled}
                onChange={v => setSettings(s => ({ ...s, enabled: v }))}
              />
            </div>
          </div>

          {/* Sıklık */}
          <div style={cardStyle}>
            <label style={sectionLabel}>Gönderim Sıklığı</label>
            <select
              value={settings.frequency}
              onChange={e => setSettings(s => ({ ...s, frequency: e.target.value }))}
              style={inputStyle}
            >
              {FREQUENCIES.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Kategoriler */}
          <div style={cardStyle}>
            <label style={sectionLabel}>Kategoriler</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map(cat => (
                <label key={cat.key} style={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.categories.includes(cat.key)}
                    onChange={() => toggleCategory(cat.key)}
                    style={checkboxStyle}
                  />
                  {cat.label}
                </label>
              ))}
            </div>
          </div>

          {/* Ülkeler */}
          <div style={cardStyle}>
            <label style={sectionLabel}>Ülkeler</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {COUNTRIES.map(c => (
                <label key={c.code} style={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.countries.includes(c.code)}
                    onChange={() => toggleCountry(c.code)}
                    style={checkboxStyle}
                  />
                  {c.flag} {c.name}
                </label>
              ))}
            </div>
          </div>

          {/* Min importance */}
          <div style={cardStyle}>
            <label style={sectionLabel}>
              Minimum Önem Seviyesi: <strong>{settings.min_importance}</strong>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={settings.min_importance}
              onChange={e => setSettings(s => ({ ...s, min_importance: parseInt(e.target.value) }))}
              style={{ width: "100%", accentColor: "var(--color-accent)" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-3)", marginTop: 4 }}>
              <span>1 (Tümü)</span>
              <span>10 (Sadece en önemli)</span>
            </div>
          </div>

          {/* Kaydet */}
          <button type="submit" disabled={saving} style={btnStyle}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
      )}
    </div>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 48,
        height: 26,
        borderRadius: 13,
        background: checked ? "var(--color-accent)" : "var(--color-border)",
        cursor: "pointer",
        position: "relative",
        transition: "background 200ms ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 3,
          left: checked ? 25 : 3,
          transition: "left 200ms ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
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
  width: "100%",
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

const sectionLabel: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 600,
  color: "var(--color-text)",
  marginBottom: 12,
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

const checkboxLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  color: "var(--color-text-2)",
  cursor: "pointer",
  padding: "6px 12px",
  borderRadius: "var(--radius-md)",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  userSelect: "none",
}

const checkboxStyle: React.CSSProperties = {
  accentColor: "var(--color-accent)",
  width: 16,
  height: 16,
  cursor: "pointer",
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
  width: "100%",
}

const skeletonStyle: React.CSSProperties = {
  height: 16,
  borderRadius: 8,
  background: "var(--color-border)",
  marginBottom: 12,
  animation: "pulse 1.5s ease-in-out infinite",
}
