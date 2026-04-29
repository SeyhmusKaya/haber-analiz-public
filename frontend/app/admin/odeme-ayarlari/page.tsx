"use client"
import { useState, useEffect } from "react"

const API = ""

export default function OdemeAyarlariPage() {
  const [key, setKey]         = useState("")
  const [hasKey, setHasKey]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState("")
  const [stats, setStats]     = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    fetch(`${API}/api/admin/payment-settings`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      .then(r => r.json()).then(d => { setHasKey(d.has_key); if (d.has_key) setKey(d.verodika_payment_key) }).catch(() => {})

    fetch(`${API}/api/admin/subscriptions/stats`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      .then(r => r.json()).then(d => setStats(d)).catch(() => {})
  }, [])

  async function handleSave() {
    if (!key || key.startsWith("***")) { setError("Geçerli bir API anahtarı girin."); return }
    setLoading(true); setError(""); setSaved(false)
    const token = localStorage.getItem("auth_token")
    try {
      const res  = await fetch(`${API}/api/admin/payment-settings`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ verodika_payment_key: key }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Hata oluştu."); return }
      setSaved(true); setHasKey(true)
    } catch { setError("Sunucuya bağlanılamadı.") }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "clamp(20px,4vw,40px) 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Ödeme Ayarları</h1>
      <p style={{ color: "var(--color-text-2)", marginBottom: 32 }}>
        Verodika Payment Gateway entegrasyonu — <a href="https://payments.verodika.com" target="_blank" rel="noopener" style={{ color: "var(--color-accent)" }}>payments.verodika.com</a>
      </p>

      {/* İstatistik kartları */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 32 }}>
          {[
            { label: "Aktif Abone",  value: stats.total_active,    color: "#2563eb" },
            { label: "Pro",          value: stats.pro,             color: "#7c3aed" },
            { label: "Toplam Gelir", value: `₺${(stats.monthly_revenue || 0).toLocaleString("tr")}`, color: "#16a34a" },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "var(--color-text-2)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* API Key formu */}
      <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 14, padding: "28px 24px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Verodika API Anahtarı</h2>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-2)", display: "block", marginBottom: 6 }}>API Key</label>
          <input
            type="password"
            value={key}
            onChange={e => { setKey(e.target.value); setSaved(false); setError("") }}
            placeholder="vrd_xxxxxxxxxxxxxxxx"
            style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-bg-2)", fontSize: 14, color: "var(--color-text-1)", boxSizing: "border-box" }}
          />
        </div>

        {hasKey && (
          <p style={{ fontSize: 12, color: "#16a34a", marginBottom: 12 }}>✓ API anahtarı kayıtlı - değiştirmek için yeni key girin</p>
        )}

        {error && <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{error}</p>}
        {saved && <p style={{ fontSize: 13, color: "#16a34a", marginBottom: 12 }}>✓ API anahtarı başarıyla kaydedildi.</p>}

        <button
          onClick={handleSave}
          disabled={loading}
          style={{ padding: "11px 28px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--color-border)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Webhook URL</h3>
          <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 8 }}>
            Verodika panelinde bu URL'i webhook olarak tanımlayın:
          </p>
          <code style={{ display: "block", background: "var(--color-bg-2)", padding: "10px 14px", borderRadius: 8, fontSize: 13, wordBreak: "break-all" }}>
            {typeof window !== "undefined" ? window.location.origin.replace(":3000", ":8000") : "https://medyaizle.com"}/api/payment/webhook
          </code>
          <p style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 8 }}>
            Desteklenen event'ler: payment.completed, payment.failed, payment.refunded,
            subscription.renewal_pending, subscription.renewed, subscription.failed,
            subscription.cancelled, subscription.expired
          </p>
        </div>
      </div>
    </div>
  )
}
