"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"

const API_URL = ""

const CATEGORIES = [
  { key: "siyaset", label: "Siyaset", icon: "🏛️" },
  { key: "ekonomi", label: "Ekonomi", icon: "📈" },
  { key: "savas-catisma", label: "Savaş-Çatışma", icon: "⚔️" },
  { key: "diplomasi", label: "Diplomasi", icon: "🤝" },
  { key: "teknoloji", label: "Teknoloji", icon: "💡" },
  { key: "saglik", label: "Sağlık", icon: "🩺" },
  { key: "cevre", label: "Çevre", icon: "🌿" },
  { key: "spor", label: "Spor", icon: "⚽" },
  { key: "kultur", label: "Kültür", icon: "🎭" },
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

interface NotificationSettings {
  // Existing
  new_event: boolean
  comment_reply: boolean
  comment_like: boolean
  newsletter: boolean
  categories: string[]
  countries: string[]
  min_importance: number
  // New: Email channel
  email_enabled: boolean
  email_new_event: boolean
  email_weekly_digest: boolean
  // New: Push/Mobile channel
  push_enabled: boolean
  push_breaking_news: boolean
  push_comment_replies: boolean
}

const DEFAULT_SETTINGS: NotificationSettings = {
  new_event: true,
  comment_reply: true,
  comment_like: false,
  newsletter: true,
  categories: [],
  countries: [],
  min_importance: 5,
  email_enabled: true,
  email_new_event: true,
  email_weekly_digest: true,
  push_enabled: false,
  push_breaking_news: true,
  push_comment_replies: true,
}

export default function AyarlarPage() {
  const { user, token, loading } = useAuth()
  const router = useRouter()

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  useEffect(() => {
    if (!loading && !user) return
    if (!token) return
    setFetching(true)
    fetch(`${API_URL}/api/user/notification-settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data: any) => setSettings({
        new_event:           data.new_event           ?? true,
        comment_reply:       data.comment_reply       ?? true,
        comment_like:        data.comment_like        ?? false,
        newsletter:          data.newsletter          ?? true,
        categories:          data.categories          ?? data.filter_categories ?? [],
        countries:           data.countries           ?? data.filter_countries  ?? [],
        min_importance:      data.min_importance      ?? 5,
        email_enabled:       data.email_enabled       ?? true,
        email_new_event:     data.email_new_event     ?? true,
        email_weekly_digest: data.email_weekly_digest ?? true,
        push_enabled:        data.push_enabled        ?? false,
        push_breaking_news:  data.push_breaking_news  ?? true,
        push_comment_replies:data.push_comment_replies?? true,
      }))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [user, token, loading])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`${API_URL}/api/user/notification-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error("Kaydetme başarısız.")
      setMsg({ type: "ok", text: "Bildirim ayarları başarıyla kaydedildi." })
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

  function set<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  if (loading) return null
  if (!user) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ color: "var(--color-text-2)", fontSize: 14, textAlign: "center" }}>
            Bu sayfayı görüntülemek için{" "}
            <span
              onClick={() => router.push("/giris")}
              style={{ color: "var(--color-accent)", cursor: "pointer", fontWeight: 600 }}
            >
              giriş yapmanız
            </span>{" "}
            gerekmektedir.
          </p>
        </div>
      </div>
    )
  }

  const NOTIFICATION_TOGGLES: {
    key: keyof Pick<NotificationSettings, "new_event" | "comment_reply" | "comment_like" | "newsletter">
    label: string
    desc: string
    icon: string
  }[] = [
    { key: "new_event",      label: "Yeni Haber",    desc: "Önemli haberler yayınlandığında bildirim alın",    icon: "📰" },
    { key: "comment_reply",  label: "Yorum Yanıtı",  desc: "Yorumunuza yanıt geldiğinde bildirim alın",        icon: "💬" },
    { key: "comment_like",   label: "Yorum Beğeni",  desc: "Yorumunuz beğenildiğinde bildirim alın",           icon: "👍" },
    { key: "newsletter",     label: "Bülten",        desc: "E-posta bülteni bildirimleri",                     icon: "📩" },
  ]

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ayarlar-sub-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 10px;
          background: var(--color-surface-2, rgba(0,0,0,0.03));
          border: 1px solid var(--color-border);
          transition: opacity 200ms ease;
        }
        .ayarlar-sub-row.disabled {
          opacity: 0.38;
          pointer-events: none;
        }
        .ayarlar-channel-card {
          border-radius: 14px;
          border: 1.5px solid var(--color-border);
          overflow: hidden;
          margin-bottom: 14px;
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }
        .ayarlar-channel-card.active {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.10);
        }
        .ayarlar-channel-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 20px;
          cursor: default;
        }
        .ayarlar-channel-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .ayarlar-channel-body {
          padding: 0 20px 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: fadeIn 180ms ease;
        }
        .ayarlar-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .ayarlar-section-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .ayarlar-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--color-border);
        }
        .ayarlar-toggle-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .ayarlar-toggle-row:first-child {
          padding-top: 0;
        }
        .chip-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--color-text-2);
          cursor: pointer;
          padding: 7px 12px;
          border-radius: 999px;
          border: 1.5px solid var(--color-border);
          background: var(--color-surface-2, rgba(0,0,0,0.03));
          user-select: none;
          transition: border-color 180ms ease, background 180ms ease, color 180ms ease;
          font-weight: 500;
        }
        .chip-label.checked {
          border-color: var(--color-accent);
          background: rgba(37,99,235,0.09);
          color: var(--color-accent);
        }
        .chip-label input {
          display: none;
        }
        .save-btn {
          width: 100%;
          padding: 14px 24px;
          background: var(--color-accent);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: opacity 200ms ease, transform 100ms ease;
        }
        .save-btn:hover:not(:disabled) {
          opacity: 0.9;
        }
        .save-btn:active:not(:disabled) {
          transform: scale(0.99);
        }
        .save-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .importance-track {
          position: relative;
          margin-top: 20px;
          margin-bottom: 8px;
        }
        input[type=range] {
          width: 100%;
          accent-color: var(--color-accent);
          cursor: pointer;
          height: 6px;
        }
        .importance-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--color-text-3, #888);
          margin-top: 6px;
        }
        .importance-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--color-accent);
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          margin-left: 8px;
          vertical-align: middle;
        }
        .info-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(37,99,235,0.06);
          border: 1px solid rgba(37,99,235,0.18);
          font-size: 12px;
          color: var(--color-text-2);
          line-height: 1.5;
        }
      `}</style>

      <div style={containerStyle}>
        {/* Page Title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={pageTitleStyle}>Bildirim Ayarları</h1>
          <p style={{ fontSize: 14, color: "var(--color-text-3, #888)", marginTop: 4 }}>
            Hangi kanallardan, hangi tür bildirimleri alacağınızı özelleştirin.
          </p>
        </div>

        {fetching ? (
          <div style={cardStyle}>
            {[100, 60, 80, 45, 70].map((w, i) => (
              <div key={i} style={{ height: 16, borderRadius: 8, background: "var(--color-border)", marginBottom: 14, width: `${w}%`, animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSave}>
            {msg && (
              <div style={{
                background: msg.type === "ok" ? "rgba(34,197,94,0.09)" : "rgba(239,68,68,0.09)",
                border: `1px solid ${msg.type === "ok" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                borderRadius: 12, padding: "12px 16px",
                fontSize: 13, fontWeight: 500,
                color: msg.type === "ok" ? "#16a34a" : "#dc2626",
                marginBottom: 20,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>{msg.type === "ok" ? "✓" : "✕"}</span>
                {msg.text}
              </div>
            )}

            {/* ─── SECTION 1: Bildirim Kanalları ─────────────────── */}
            <div style={cardStyle}>
              <div className="ayarlar-section-header">
                <div className="ayarlar-section-icon" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  📡
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>Bildirim Kanalları</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-3, #888)", marginTop: 1 }}>Bildirimleri nereden almak istediğinizi seçin</div>
                </div>
              </div>

              {/* Email Channel Card */}
              <div className={`ayarlar-channel-card${settings.email_enabled ? " active" : ""}`}>
                <div className="ayarlar-channel-header" style={{ background: settings.email_enabled ? "rgba(37,99,235,0.04)" : "transparent" }}>
                  <div className="ayarlar-channel-icon" style={{ background: settings.email_enabled ? "linear-gradient(135deg,#2563eb,#3b82f6)" : "var(--color-surface-2, rgba(0,0,0,0.05))" }}>
                    <span style={{ filter: settings.email_enabled ? "none" : "grayscale(1) opacity(0.5)" }}>✉️</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>E-posta Bildirimleri</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-3, #888)", marginTop: 2 }}>
                      Seçili haberleri ve özetleri e-posta ile alın
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.email_enabled}
                    onChange={v => set("email_enabled", v)}
                    color="#2563eb"
                  />
                </div>

                {settings.email_enabled && (
                  <div className="ayarlar-channel-body">
                    <div className={`ayarlar-sub-row${!settings.email_enabled ? " disabled" : ""}`}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>Yeni Önemli Haber</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-3, #888)", marginTop: 2 }}>Belirlediğiniz önem eşiğini geçen haberler</div>
                      </div>
                      <ToggleSwitch
                        checked={settings.email_new_event}
                        onChange={v => set("email_new_event", v)}
                        color="#2563eb"
                        small
                      />
                    </div>
                    <div className={`ayarlar-sub-row${!settings.email_enabled ? " disabled" : ""}`}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>Haftalık Özet</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-3, #888)", marginTop: 2 }}>Her pazar haftanın en önemli haberleri</div>
                      </div>
                      <ToggleSwitch
                        checked={settings.email_weekly_digest}
                        onChange={v => set("email_weekly_digest", v)}
                        color="#2563eb"
                        small
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Push/Mobile Channel Card */}
              <div className={`ayarlar-channel-card${settings.push_enabled ? " active" : ""}`} style={{ marginBottom: 0 }}>
                <div className="ayarlar-channel-header" style={{ background: settings.push_enabled ? "rgba(16,185,129,0.04)" : "transparent" }}>
                  <div className="ayarlar-channel-icon" style={{ background: settings.push_enabled ? "linear-gradient(135deg,#059669,#10b981)" : "var(--color-surface-2, rgba(0,0,0,0.05))" }}>
                    <span style={{ filter: settings.push_enabled ? "none" : "grayscale(1) opacity(0.5)" }}>📱</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>Mobil Bildirimler</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-3, #888)", marginTop: 2 }}>
                      Anlık push bildirimleri alın
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.push_enabled}
                    onChange={v => set("push_enabled", v)}
                    color="#10b981"
                  />
                </div>

                {settings.push_enabled ? (
                  <div className="ayarlar-channel-body">
                    <div className="ayarlar-sub-row">
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>Son Dakika Haberleri</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-3, #888)", marginTop: 2 }}>Kritik gelişmelerde anında bildirim</div>
                      </div>
                      <ToggleSwitch
                        checked={settings.push_breaking_news}
                        onChange={v => set("push_breaking_news", v)}
                        color="#10b981"
                        small
                      />
                    </div>
                    <div className="ayarlar-sub-row">
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>Yorum Yanıtları</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-3, #888)", marginTop: 2 }}>Yorumlarınıza gelen yanıtlar</div>
                      </div>
                      <ToggleSwitch
                        checked={settings.push_comment_replies}
                        onChange={v => set("push_comment_replies", v)}
                        color="#10b981"
                        small
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "0 20px 18px 20px" }}>
                    <div className="info-note">
                      <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
                      <span>
                        <strong>Mobil uygulamayı indirerek</strong> anlık bildirim alabilirsiniz.
                        {" "}Etkinleştirmek için yukarıdaki butonu açın.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── SECTION 2: Bildirim Türleri ─────────────────────── */}
            <div style={cardStyle}>
              <div className="ayarlar-section-header">
                <div className="ayarlar-section-icon" style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}>
                  🔔
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>Bildirim Türleri</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-3, #888)", marginTop: 1 }}>Hangi olaylar için bildirim almak istediğinizi seçin</div>
                </div>
              </div>

              <div>
                {NOTIFICATION_TOGGLES.map((t, idx) => (
                  <div key={t.key} className="ayarlar-toggle-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{t.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{t.label}</div>
                        <div style={{ fontSize: 12, color: "var(--color-text-3, #888)", marginTop: 2 }}>{t.desc}</div>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings[t.key]}
                      onChange={v => set(t.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ─── SECTION 3: Ülke Filtresi ─────────────────────────── */}
            <div style={cardStyle}>
              <div className="ayarlar-section-header">
                <div className="ayarlar-section-icon" style={{ background: "linear-gradient(135deg,#0ea5e9,#6366f1)" }}>
                  🌍
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>Ülke Filtresi</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-3, #888)", marginTop: 1 }}>
                    Sadece seçili ülkelerden bildirim alın — boş bırakırsanız tümünden gelir
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {COUNTRIES.map(c => {
                  const checked = settings.countries.includes(c.code)
                  return (
                    <label key={c.code} className={`chip-label${checked ? " checked" : ""}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCountry(c.code)}
                      />
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </label>
                  )
                })}
              </div>
              {settings.countries.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--color-text-3, #888)" }}>
                  {settings.countries.length} ülke seçili —{" "}
                  <span
                    style={{ color: "var(--color-accent)", cursor: "pointer", fontWeight: 600 }}
                    onClick={() => setSettings(s => ({ ...s, countries: [] }))}
                  >
                    Temizle
                  </span>
                </div>
              )}
            </div>

            {/* ─── SECTION 4: Kategori Filtresi ─────────────────────── */}
            <div style={cardStyle}>
              <div className="ayarlar-section-header">
                <div className="ayarlar-section-icon" style={{ background: "linear-gradient(135deg,#ec4899,#f43f5e)" }}>
                  🏷️
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>Kategori Filtresi</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-3, #888)", marginTop: 1 }}>
                    Sadece seçili kategorilerden bildirim alın — boş bırakırsanız tümünden gelir
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map(cat => {
                  const checked = settings.categories.includes(cat.key)
                  return (
                    <label key={cat.key} className={`chip-label${checked ? " checked" : ""}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(cat.key)}
                      />
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </label>
                  )
                })}
              </div>
              {settings.categories.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--color-text-3, #888)" }}>
                  {settings.categories.length} kategori seçili —{" "}
                  <span
                    style={{ color: "var(--color-accent)", cursor: "pointer", fontWeight: 600 }}
                    onClick={() => setSettings(s => ({ ...s, categories: [] }))}
                  >
                    Temizle
                  </span>
                </div>
              )}
            </div>

            {/* ─── SECTION 5: Önem Seviyesi ─────────────────────────── */}
            <div style={cardStyle}>
              <div className="ayarlar-section-header">
                <div className="ayarlar-section-icon" style={{ background: "linear-gradient(135deg,#84cc16,#22c55e)" }}>
                  ⚡
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", display: "flex", alignItems: "center", gap: 4 }}>
                    Minimum Önem Seviyesi
                    <span className="importance-badge">{settings.min_importance}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-3, #888)", marginTop: 2 }}>
                    Bu seviyenin altındaki haberler için bildirim gönderilmez
                  </div>
                </div>
              </div>

              <div className="importance-track">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={settings.min_importance}
                  onChange={e => set("min_importance", parseInt(e.target.value))}
                />
              </div>
              <div className="importance-labels">
                <span>1 — Tüm haberler</span>
                <span>
                  {settings.min_importance <= 3 ? "Düşük eşik" :
                   settings.min_importance <= 6 ? "Orta eşik" :
                   settings.min_importance <= 8 ? "Yüksek eşik" : "Sadece kritik"}
                </span>
                <span>10 — Yalnızca kritik</span>
              </div>

              {/* Visual importance band */}
              <div style={{ marginTop: 16, display: "flex", gap: 4 }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <div
                    key={n}
                    onClick={() => set("min_importance", n)}
                    title={`Seviye ${n}`}
                    style={{
                      flex: 1, height: 6, borderRadius: 3, cursor: "pointer",
                      background: n >= settings.min_importance
                        ? (n <= 3 ? "#84cc16" : n <= 6 ? "#f59e0b" : n <= 8 ? "#f97316" : "#ef4444")
                        : "var(--color-border)",
                      transition: "background 150ms ease",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ─── Save Button ─────────────────────────────────────── */}
            <button type="submit" disabled={saving} className="save-btn">
              {saving ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Kaydediliyor...
                </span>
              ) : "Ayarları Kaydet"}
            </button>
          </form>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

// ─── Toggle Switch Component ─────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  color = "var(--color-accent)",
  small = false,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  color?: string
  small?: boolean
}) {
  const w = small ? 40 : 48
  const h = small ? 22 : 26
  const r = h / 2
  const d = h - 6
  const on = d + 3
  const off = 3

  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={e => (e.key === " " || e.key === "Enter") && onChange(!checked)}
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: checked ? color : "var(--color-border)",
        cursor: "pointer",
        position: "relative",
        transition: "background 200ms ease",
        flexShrink: 0,
        outline: "none",
      }}
    >
      <div
        style={{
          width: d,
          height: d,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 3,
          left: checked ? on : off,
          transition: "left 200ms ease",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        }}
      />
    </div>
  )
}

// ─── Style Constants ─────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  maxWidth: 740,
  width: "100%",
  margin: "48px auto",
  padding: "0 20px 60px",
}

const pageTitleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  color: "var(--color-text)",
  letterSpacing: "-0.02em",
}

const cardStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 16,
  padding: 24,
  marginBottom: 16,
}
