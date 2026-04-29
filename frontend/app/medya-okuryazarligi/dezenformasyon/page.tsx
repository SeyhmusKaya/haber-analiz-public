"use client"

export default function DezenformasyonPage() {
  const types = [
    { name: "Dezenformasyon", desc: "Kasıtlı olarak yanlış bilgi yayma. Belirli bir amaç için uydurulmuş veya çarpıtılmış bilgiler.", icon: "🎯", color: "#ef4444" },
    { name: "Misenformasyon", desc: "Kasıt olmadan yanlış bilgi yayma. Paylaşan kişi bilginin yanlış olduğunu bilmiyor.", icon: "❓", color: "#eab308" },
    { name: "Malenformasyon", desc: "Gerçek bilginin zarar vermek amacıyla paylaşımı. Bilgi doğru ama amaç kötü.", icon: "⚠️", color: "#f97316" },
  ]

  const tactics = [
    "Sahte web siteleri ve haber kaynakları oluşturma",
    "Deepfake video ve ses kayıtları",
    "Bot hesaplarla yapay gündem oluşturma",
    "Gerçek haberlerin bağlamdan koparılması",
    "Eski haberlerin yeni gibi sunulması",
    "Komplo teorileriyle gerçeklerin karıştırılması",
    "Resmî kurumların taklit edilmesi",
    "Duygusal manipülasyon için sahte görseller",
  ]

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>Dezenformasyon ile Mücadele</h1>
      <p style={{ fontSize: 14, color: "var(--color-text-3)", marginBottom: 32, lineHeight: 1.6 }}>
        Dijital çağda yanlış bilgi türleri ve bunlardan korunma yolları
      </p>

      {/* Türler */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        {types.map(t => (
          <div key={t.name} style={{
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", padding: 24, textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{t.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: t.color, marginBottom: 8 }}>{t.name}</div>
            <div style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.6 }}>{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Taktikler */}
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)", padding: 24,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", marginBottom: 16 }}>
          Yaygın Dezenformasyon Taktikleri
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tactics.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0,
              }} />
              <span style={{ fontSize: 14, color: "var(--color-text-2)" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
