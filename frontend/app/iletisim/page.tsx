"use client"

import { useState } from "react"

const API_URL = ""

const SUBJECTS = [
  { value: "genel",      label: "Genel Soru",       icon: "💬" },
  { value: "oneri",      label: "Öneri",             icon: "💡" },
  { value: "hata",       label: "Hata Bildirimi",    icon: "🐛" },
  { value: "kvkk",       label: "KVKK Başvurusu",   icon: "🔒" },
  { value: "api-erisim", label: "API Erişimi",       icon: "🔑" },
  { value: "isbirligi",  label: "İş Birliği",        icon: "🤝" },
  { value: "diger",      label: "Diğer",             icon: "📌" },
]

const CONTACT_ITEMS = [
  {
    icon: "✉️", title: "E-posta",
    value: "destek@medyaizle.com",
    sub: "Genellikle 24 saat içinde yanıt",
    color: "#3b82f6",
  },
  {
    icon: "📞", title: "Telefon",
    value: "+90 540 059 40 40",
    sub: "Hafta içi 09:00 — 18:00",
    color: "#f59e0b",
  },
  {
    icon: "🔒", title: "KVKK Başvuruları",
    value: "kvkk@medyaizle.com",
    sub: "En geç 30 gün içinde yanıt",
    color: "#8b5cf6",
  },
  {
    icon: "📍", title: "Adres",
    value: "Altıeylül, Balıkesir",
    sub: "Türkiye Cumhuriyeti kanunlarına tabi",
    color: "#10b981",
  },
]

const FAQ = [
  {
    q: "İçerikler nasıl üretiliyor?",
    a: "Haberler 10 farklı ülkeden 100'den fazla kaynağın RSS beslemelerinden 2 saatte bir toplanıyor. Yapay zeka ile aynı olaya ait haberler gruplandırılıp Türkçe özetleniyor. Her ülkenin yandaş ve muhalif medyasının o haberi nasıl yorumladığı karşılaştırmalı olarak sunuluyor. Metodolojimizin tamamı /metodoloji sayfasında belgelidir.",
  },
  {
    q: "Yapay zeka özetleri güvenilir mi?",
    a: "Yapay zeka özetleri hata içerebilir; bu nedenle her özetin üzerinde 'Yapay Zeka Özeti' etiketi bulunur ve orijinal kaynağa bağlantı verilir. Önemli kararlar için mutlaka orijinal kaynakları kontrol edin. Hata bildirimi için iletişim formundan 'Hata Bildirimi' seçebilirsiniz — bildirimler 72 saat içinde değerlendirilir.",
  },
  {
    q: "Yandaş / muhalif sınıflandırması nasıl yapılıyor?",
    a: "Sınıflandırmalar Reporters Without Borders, Freedom House, AllSides Media Bias Ratings ve Ad Fontes Media Bias Chart gibi bağımsız referanslara dayanır. Bu sınıflandırmaların öznel olabileceğini kabul ediyoruz; itirazlar için bize yazabilirsiniz.",
  },
  {
    q: "Kaynak eklemek veya çıkarmak mümkün mü?",
    a: "Evet. İletişim formundan 'Öneri' seçerek kaynak önerinizi iletebilirsiniz. Öneriler editöryal değerlendirmeden geçer; en az 3 yıllık yayın geçmişi olan, düzenli haber üreten ve açık RSS beslemesi sunan kaynaklar değerlendirmeye alınır.",
  },
  {
    q: "Ücretsiz kullanabilir miyim?",
    a: "Evet, tüm haberler ve ülke karşılaştırmaları ücretsizdir. Pro üyelik (aylık ₺79) yalnızca AI sohbet, detaylı ülke analizi ve özel rapor üretimi gibi gelişmiş özelliklere erişim sağlar.",
  },
  {
    q: "Bir haberin silinmesini veya düzeltilmesini talep edebilir miyim?",
    a: "KVKK kapsamında kişisel verilerinizin işlenmesine itiraz etme hakkınız vardır. Kaldırma/düzeltme talepleri için kvkk@medyaizle.com adresine yazabilirsiniz. Başvurular en geç 30 gün içinde yanıtlanır.",
  },
  {
    q: "Reklam vermek istiyorum, nasıl iletişime geçerim?",
    a: "Reklam işbirlikleri için iletişim formundan 'İş Birliği' seçerek bizimle iletişime geçin. Reklam içerikleri 'Sponsorlu' olarak etiketlenir ve editöryal içerikten net biçimde ayrıştırılır. Reklam verenler editöryal kararları etkileyemez.",
  },
  {
    q: "API erişimi var mı?",
    a: "API erişimi için bu sayfadaki iletişim formundan 'API Erişimi' konusunu seçerek bizimle iletişime geçebilirsiniz. Talebinizi değerlendirip size özel bir API anahtarı oluşturacağız. API dokümantasyonu /api-docs sayfasında mevcut.",
  },
  {
    q: "Medya İzle herhangi bir siyasi görüşü destekliyor mu?",
    a: "Hayır. Medya İzle hiçbir siyasi parti, hükümet, devlet kurumu veya medya grubundan finansman almaz ve hiçbir ideolojiyi desteklemez. Amacımız taraf tutmak değil, tarafları göstermektir.",
  },
  {
    q: "Verilerimi nasıl koruyorsunuz?",
    a: "Şifreler bcrypt ile hashlenir, hiçbir zaman düz metin olarak saklanmaz. Kişisel veriler yalnızca hesap işlemleri için kullanılır; üçüncü taraflarla paylaşılmaz. Detaylar için /gizlilik sayfasını inceleyebilirsiniz.",
  },
]

export default function IletisimPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function fieldStyle(name: string): React.CSSProperties {
    return {
      width: "100%", padding: "12px 14px",
      background: "var(--color-surface)",
      border: `1.5px solid ${focusedField === name ? "var(--color-accent)" : "var(--color-border)"}`,
      borderRadius: 10, color: "var(--color-text)", fontSize: 14,
      outline: "none", boxSizing: "border-box",
      transition: "border-color 0.15s, box-shadow 0.15s",
      boxShadow: focusedField === name ? "0 0 0 3px rgba(37,99,235,0.1)" : "none",
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || "Mesaj gönderilemedi."); return }
      setSuccess(true)
      setForm({ name: "", email: "", subject: "", message: "" })
    } catch {
      setError("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, rgba(37,99,235,0.07) 0%, rgba(139,92,246,0.06) 100%)",
        borderBottom: "1px solid var(--color-border)",
        padding: "52px 16px 48px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)",
            borderRadius: 99, padding: "5px 14px", marginBottom: 20,
          }}>
            <span style={{ fontSize: 12 }}>✉️</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-accent)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              İletişim
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 14 }}>
            Size nasıl yardımcı{" "}
            <span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              olabiliriz?
            </span>
          </h1>
          <p style={{ fontSize: 16, color: "var(--color-text-2)", lineHeight: 1.6 }}>
            Soru, öneri veya geri bildirimleriniz için bize yazın. En kısa sürede dönüş yapıyoruz.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 16px 80px" }}>

        {/* Success */}
        {success && (
          <div style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 16, padding: "20px 24px",
            marginBottom: 32, display: "flex", alignItems: "flex-start", gap: 16,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: "rgba(16,185,129,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>✅</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#059669", margin: "0 0 4px" }}>Mesajınız gönderildi!</p>
              <p style={{ fontSize: 13, color: "var(--color-text-2)", margin: 0 }}>En kısa sürede size dönüş yapacağız. Teşekkürler!</p>
            </div>
            <button onClick={() => setSuccess(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-3)", fontSize: 18 }}>×</button>
          </div>
        )}

        <div className="iletisim-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, alignItems: "start" }}>

          {/* Form */}
          <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 20, padding: "36px 32px",
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>Mesaj Gönder</h2>
            <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 28 }}>
              Tüm alanları eksiksiz doldurun, en kısa sürede yanıt vereceğiz.
            </p>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#ef4444", marginBottom: 20,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Adınız *
                  </label>
                  <input
                    type="text" required value={form.name} onChange={set("name")}
                    placeholder="Adınız"
                    style={fieldStyle("name")}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    E-posta *
                  </label>
                  <input
                    type="email" required value={form.email} onChange={set("email")}
                    placeholder="ornek@email.com"
                    style={fieldStyle("email")}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Konu *
                </label>
                <select required value={form.subject} onChange={set("subject")} style={fieldStyle("subject")}
                  onFocus={() => setFocusedField("subject")} onBlur={() => setFocusedField(null)}>
                  <option value="" disabled>Bir konu seçin...</option>
                  {SUBJECTS.map(s => (
                    <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Mesajınız *
                </label>
                <textarea
                  required value={form.message} onChange={set("message")}
                  placeholder="Mesajınızı buraya yazın... Detaylı açıklamanız daha hızlı yanıt almanızı sağlar."
                  rows={6}
                  style={{ ...fieldStyle("message"), resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                  onFocus={() => setFocusedField("message")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>

              <button type="submit" disabled={loading} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 32px", fontSize: 15, fontWeight: 700,
                background: loading ? "var(--color-surface-3)" : "var(--color-accent)",
                color: "#fff", border: "none", borderRadius: 12,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1, transition: "opacity 0.15s",
                alignSelf: "flex-start",
              }}>
                {loading ? (
                  <><span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Gönderiliyor...</>
                ) : (
                  <>✉️ Mesaj Gönder</>
                )}
              </button>
            </form>
          </div>

          {/* Right panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Contact cards */}
            {CONTACT_ITEMS.map(item => (
              <div key={item.title} style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 16, padding: "20px",
                display: "flex", gap: 14, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: `${item.color}15`, border: `1px solid ${item.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>{item.icon}</div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-text-3)", margin: "0 0 4px" }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: "0 0 3px" }}>
                    {item.value}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-text-3)", margin: 0 }}>{item.sub}</p>
                </div>
              </div>
            ))}

            {/* KVKK note */}
            <div style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.04))",
              border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: 16, padding: "18px 20px",
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                🔒 KVKK Bilgisi
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-2)", lineHeight: 1.7, margin: 0 }}>
                KVKK başvuruları için konu olarak <strong style={{ color: "var(--color-text)" }}>KVKK Başvurusu</strong> seçin.
                Başvurular en geç <strong style={{ color: "var(--color-text)" }}>30 gün</strong> içinde yanıtlanır.
              </p>
            </div>

            {/* Veri sorumlusu / yasal bilgiler */}
            <div style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 16, padding: "18px 20px",
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-3)", margin: "0 0 10px" }}>
                Veri Sorumlusu
              </p>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-text-2)" }}>
                <p style={{ margin: 0 }}><strong style={{ color: "var(--color-text)" }}>Medya İzle</strong></p>
                <p style={{ margin: "2px 0 0" }}>Altıeylül, Balıkesir / Türkiye</p>
                <p style={{ margin: "2px 0 0" }}>Vergi Dairesi: Kurtdereli</p>
                <p style={{ margin: "2px 0 0" }}>VKN: 1400185229</p>
                <p style={{ margin: "2px 0 0" }}>+90 540 059 40 40</p>
                <p style={{ margin: "2px 0 0" }}>kvkk@medyaizle.com</p>
              </div>
              <p style={{ fontSize: 11, color: "var(--color-text-3)", lineHeight: 1.6, margin: "10px 0 0", paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
                6698 sayılı KVKK kapsamında veri sorumlusuyla iletişim bilgileri. KVKK aydınlatma metni için{" "}
                <a href="/gizlilik" style={{ color: "var(--color-accent)", textDecoration: "none" }}>Gizlilik Politikası</a>.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em", marginBottom: 24 }}>
            Sık Sorulan Sorular
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 14, padding: "20px 24px",
              }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 8px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    background: "rgba(37,99,235,0.12)", fontSize: 11, fontWeight: 800, color: "var(--color-accent)",
                  }}>?</span>
                  {item.q}
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-text-2)", margin: 0, paddingLeft: 32 }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .iletisim-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
