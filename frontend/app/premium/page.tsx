"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"

const API = ""

const FREE_FEATURES = [
  { text: "Günde 3 ülke analizi", available: true },
  { text: "Temel arama", available: true },
  { text: "Yorum yapabilme", available: true },
  { text: "1 katalog (max 10 haber)", available: true },
  { text: "AI Soru Sor", available: false },
  { text: "AI Asistan (Chatbot)", available: false },
  { text: "Propaganda skoru", available: false },
  { text: "Karşılaştırma modu", available: false },
  { text: "Doğal dil arama", available: false },
  { text: "Reklamsız deneyim", available: false },
  { text: "Haftalık rapor PDF", available: false },
  { text: "API erişimi", available: false },
]

const PRO_FEATURES = [
  { text: "Sınırsız ülke analizi", available: true },
  { text: "Gelişmiş arama", available: true },
  { text: "Yorum yapabilme", available: true },
  { text: "Sınırsız katalog", available: true },
  { text: "Sınırsız AI Soru Sor", available: true },
  { text: "Sınırsız AI Asistan (Chatbot)", available: true },
  { text: "Propaganda skoru + Radar grafik", available: true },
  { text: "Karşılaştırma modu", available: true },
  { text: "Doğal dil arama", available: true },
  { text: "Reklamsız deneyim", available: true },
  { text: "Aylık rapor PDF", available: true },
  { text: "API erişimi (günde 1000 istek)", available: true },
]

interface CheckoutData {
  transaction_id: number
  process_card_url: string
  form_fields: { ThreeDSessionId: string }
}

function formatCardNo(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
}
function formatExpire(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2)
  return digits
}

export default function PremiumPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)

  const [cardHolder, setCardHolder] = useState("")
  const [cardNo, setCardNo] = useState("")
  const [expireDate, setExpireDate] = useState("")
  const [cvv, setCvv] = useState("")
  const cardFormRef = useRef<HTMLFormElement>(null)
  const cardSectionRef = useRef<HTMLDivElement>(null)

  async function handleCheckout() {
    setLoading(true)
    setError("")
    setCheckoutData(null)
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    if (!token) {
      setError("Ödeme yapabilmek için giriş yapmanız gerekiyor.")
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`${API}/api/subscription/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ plan: "pro", period: "monthly", taksit: 1 }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Ödeme başlatılamadı."); return }
      setCheckoutData(data)
      setTimeout(() => cardSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
    } catch {
      setError("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "1px solid var(--color-border)", background: "var(--color-bg)",
    fontSize: 15, color: "var(--color-text)", outline: "none", boxSizing: "border-box",
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", display: "block", marginBottom: 6,
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(28px,5vw,60px) 16px" }}>

      {/* Başlık */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{
          display: "inline-block", padding: "4px 14px", borderRadius: 99,
          background: "rgba(124,58,237,0.12)", color: "#7c3aed",
          fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 14,
        }}>PRO PLAN</div>
        <h1 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 12 }}>
          Daha Derin Bir Bakış Açısı İçin
        </h1>
        <p style={{ fontSize: 16, color: "var(--color-text-2)", maxWidth: 520, margin: "0 auto" }}>
          Propaganda skorları, tam ülke karşılaştırmaları ve AI asistan ile haberin arkasını okuyun.
        </p>
      </div>

      {/* Karşılaştırma kartları */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 40 }}>

        {/* Ücretsiz plan */}
        <div style={{
          border: "1px solid var(--color-border)", borderRadius: 16,
          background: "var(--color-surface)", overflow: "hidden",
        }}>
          <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Ücretsiz</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 800 }}>₺0</span>
              <span style={{ fontSize: 13, color: "var(--color-text-3)" }}>/ay</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--color-text-3)", margin: "8px 0 0" }}>Temel özellikler dahil</p>
          </div>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 9 }}>
            {FREE_FEATURES.map(f => (
              <div key={f.text} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  background: f.available ? "#dcfce7" : "var(--color-surface-2,rgba(0,0,0,0.06))",
                  color: f.available ? "#16a34a" : "var(--color-text-3)",
                }}>
                  {f.available ? "✓" : "✕"}
                </span>
                <span style={{ fontSize: 13, color: f.available ? "var(--color-text)" : "var(--color-text-3)" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pro plan */}
        <div style={{
          border: "2px solid #7c3aed", borderRadius: 16,
          background: "rgba(124,58,237,0.04)", overflow: "hidden",
          position: "relative",
          boxShadow: "0 4px 24px rgba(124,58,237,0.15)",
        }}>
          <div style={{
            position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
            background: "#7c3aed", color: "#fff", fontSize: 11, fontWeight: 700,
            padding: "4px 16px", borderRadius: "0 0 10px 10px", letterSpacing: "0.06em",
          }}>EN POPÜLER</div>

          <div style={{ padding: "32px 24px 20px", borderBottom: "1px solid rgba(124,58,237,0.2)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Pro</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#7c3aed" }}>₺79</span>
              <span style={{ fontSize: 13, color: "var(--color-text-3)" }}>/ay</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--color-text-2)", margin: "8px 0 0" }}>Tüm özelliklere tam erişim</p>
          </div>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 9 }}>
            {PRO_FEATURES.map(f => (
              <div key={f.text} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  background: "#dcfce7", color: "#16a34a",
                }}>✓</span>
                <span style={{ fontSize: 13, color: "var(--color-text)" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Satın al butonu */}
      {!checkoutData && (
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          {error && (
            <div style={{ marginBottom: 14, padding: "10px 16px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 10, fontSize: 13, color: "#dc2626", display: "inline-block" }}>
              {error}
            </div>
          )}
          <div>
            <button
              onClick={handleCheckout}
              disabled={loading}
              style={{
                padding: "16px 56px", fontSize: 17, fontWeight: 700, borderRadius: 14, border: "none",
                background: loading ? "var(--color-border)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "#fff", cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 20px rgba(124,58,237,0.4)", transition: "all 0.2s",
              }}
            >
              {loading ? "Hazırlanıyor..." : "Pro'ya Geç — ₺79/ay"}
            </button>
            <p style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 12 }}>
              Güvenli ödeme · SSL şifreli · İstediğiniz zaman iptal edebilirsiniz
            </p>
          </div>
        </div>
      )}

      {/* 3DS Kart Formu */}
      {checkoutData && (
        <div ref={cardSectionRef} style={{
          background: "var(--color-surface)", border: "2px solid #7c3aed",
          borderRadius: 16, padding: "32px 28px", maxWidth: 480, margin: "0 auto 48px",
          boxShadow: "0 4px 24px rgba(124,58,237,0.15)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Kart Bilgilerini Girin</h2>
            <p style={{ fontSize: 13, color: "var(--color-text-2)" }}>
              Bilgileriniz 3D Secure ile güvence altında işlenir.
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 10, fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}

          <form method="POST" action={checkoutData.process_card_url} ref={cardFormRef}>
            <input type="hidden" name="ThreeDSessionId" value={checkoutData.form_fields.ThreeDSessionId} />

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Kart Üzerindeki İsim</label>
              <input type="text" name="CardHolderName" value={cardHolder}
                onChange={e => setCardHolder(e.target.value.toUpperCase())}
                placeholder="AD SOYAD" required autoComplete="cc-name" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Kart Numarası</label>
              <input type="text" name="CardNo" value={cardNo}
                onChange={e => setCardNo(formatCardNo(e.target.value))}
                placeholder="0000 0000 0000 0000" required autoComplete="cc-number"
                inputMode="numeric" style={inputStyle} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>Son Kullanma</label>
                <input type="text" name="ExpireDate" value={expireDate}
                  onChange={e => setExpireDate(formatExpire(e.target.value))}
                  placeholder="AA/YY" required autoComplete="cc-exp" inputMode="numeric" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>CVV</label>
                <input type="text" name="Cvv" value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="000" required autoComplete="cc-csc" inputMode="numeric" style={inputStyle} />
              </div>
            </div>

            <button type="submit" style={{
              width: "100%", padding: "14px", fontSize: 15, fontWeight: 700,
              borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "#fff", cursor: "pointer",
              boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
            }}>
              Ödemeyi Tamamla — ₺79
            </button>
          </form>

          <button onClick={() => { setCheckoutData(null); setError("") }} style={{
            width: "100%", marginTop: 10, padding: "10px", fontSize: 13,
            border: "1px solid var(--color-border)", borderRadius: 10,
            background: "transparent", color: "var(--color-text-3)", cursor: "pointer",
          }}>İptal</button>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
            {["VISA", "MASTERCARD", "TROY", "3D SECURE"].map(c => (
              <div key={c} style={{ fontSize: 10, color: "var(--color-text-3)", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>{c}</div>
            ))}
          </div>
        </div>
      )}

      {/* SSS */}
      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 28 }}>Sıkça Sorulan Sorular</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {[
            { q: "İstediğim zaman iptal edebilir miyim?", a: "Evet. Aboneliğinizi profil ayarlarından istediğiniz zaman iptal edebilirsiniz. İptal sonrası dönem sonuna kadar erişiminiz devam eder." },
            { q: "Ödeme güvenli mi?", a: "Tüm ödemeler 3D Secure ile korunmakta, kart bilgileriniz bankacılık altyapısı üzerinden işlenmektedir. Sunucularımıza ulaşmaz." },
            { q: "Aboneliği nasıl yönetirim?", a: "Profil > Premium Üyelik sayfasından abonelik durumunuzu görüntüleyebilir ve iptal edebilirsiniz." },
            { q: "İlk ay deneme var mı?", a: "Şu an ücretsiz deneme sunmuyoruz. Ancak ilk ay memnun kalmazsanız tam iade yapıyoruz." },
          ].map(faq => (
            <div key={faq.q} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{faq.q}</div>
              <div style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.65 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Giriş yap linki — sadece giriş yapmamış kullanıcılara göster */}
      {!user && (
        <p style={{ textAlign: "center", marginTop: 32, fontSize: 13, color: "var(--color-text-3)" }}>
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>Giriş yapın</Link>
        </p>
      )}
    </div>
  )
}
