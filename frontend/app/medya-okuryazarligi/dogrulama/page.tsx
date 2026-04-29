"use client"

export default function DogrulamaPage() {
  const steps = [
    { title: "Kaynağın Güvenilirliğini Kontrol Et", desc: "Haberi yayınlayan kaynağı araştırın. Kim finanse ediyor? Geçmişte yanlış haberler yayınladı mı? Diğer kaynaklar aynı haberi doğruluyor mu?" },
    { title: "Birden Fazla Kaynak Kontrol Et", desc: "Bir haberi en az 3 farklı bağımsız kaynaktan doğrulayın. Tek bir kaynağa güvenmek yanılgıya düşmenize neden olabilir." },
    { title: "Tarihi ve Bağlamı Kontrol Et", desc: "Haber ne zaman yayınlandı? Eski bir haber yeni gibi sunuluyor olabilir. Haberin bağlamı nedir?" },
    { title: "Görselleri Doğrula", desc: "Google Reverse Image Search ile görsellerin özgün olup olmadığını kontrol edin. Görseller başka bir olaydan alınmış olabilir." },
    { title: "Duygu Manipülasyonuna Dikkat Et", desc: "Aşırı duygusal dil kullanan haberler genellikle manipülatiftir. Haber sizi korkutmak, kızdırmak veya üzmeye mi çalışıyor?" },
    { title: "Uzman Görüşlerini Ara", desc: "Konuyla ilgili bağımsız uzmanlar ne diyor? Akademik makaleler var mı? Fact-check kuruluşları konuyu inceledi mi?" },
  ]

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>Kaynak Doğrulama Rehberi</h1>
      <p style={{ fontSize: 14, color: "var(--color-text-3)", marginBottom: 32, lineHeight: 1.6 }}>
        Bir haberin doğruluğundan emin olmak için atılması gereken adımlar
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 16, position: "relative" }}>
            {i < steps.length - 1 && (
              <div style={{ position: "absolute", left: 19, top: 40, bottom: 0, width: 2, background: "var(--color-border)" }} />
            )}
            <div style={{
              width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
              background: "var(--color-accent)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, zIndex: 1,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, paddingBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
