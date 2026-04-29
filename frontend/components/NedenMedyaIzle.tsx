import Link from "next/link"

const FEATURES = [
  {
    icon: "📊",
    title: "Propaganda ve Yanlılık Skoru",
    desc: "Her haber için dört metrik üzerinden yapay zeka değerlendirmesi: propaganda dozu, duygusal yükleme, olgusallık ve kaynak çeşitliliği. Kullanılan retorik teknikleri etiketlenir.",
    href: "/medya-okuryazarligi/propaganda",
    color: "#ef4444",
  },
  {
    icon: "🗺️",
    title: "Anlatı Takipçisi",
    desc: "Aynı olayın anlatısının gün gün, ülke ülke nasıl değiştiğini zaman çizelgesinde görün. Yandaş ve muhalif medyanın anlatı sapmasını görsel olarak karşılaştırın.",
    href: "/medya-okuryazarligi",
    color: "#8b5cf6",
  },
  {
    icon: "🌡️",
    title: "Jeopolitik Gerilim Endeksi",
    desc: "Medya tonundan hesaplanan ülke çifti gerilim barometresi. ABD-Çin, Rusya-İngiltere, İsrail-İran gibi ikililer için dinamik ısı haritası ve haftalık trend grafikleri.",
    href: "/",
    color: "#f59e0b",
  },
  {
    icon: "🔇",
    title: "Suskunluk Tespiti",
    desc: "Hangi ülkenin hangi haberleri kasıtlı olarak işlemediğini raporluyoruz. Bir haberin yayımlanmaması da bir editoryal karardır — bunu analiz ediyoruz.",
    href: "/raporlar",
    color: "#64748b",
  },
  {
    icon: "☁️",
    title: "Kelime Bulutu Karşılaştırması",
    desc: "Aynı olay için farklı ülkelerin kullandığı dilin görsel karşılaştırması. Bir taraf 'terörist' derken diğer tarafın 'özgürlük savaşçısı' demesi gibi ayrımlar net görünür.",
    href: "/",
    color: "#10b981",
  },
  {
    icon: "📝",
    title: "Haftalık Editöryal Raporlar",
    desc: "Her hafta yapay zeka destekli ama editöryal süzgeçten geçmiş analiz raporları. Önemli olayların medya yansımaları, ülke bazlı perspektif farkları ve eğilimler.",
    href: "/raporlar",
    color: "#3b82f6",
  },
]

export default function NedenMedyaIzle() {
  return (
    <section style={{ margin: "48px 0 32px", padding: "0 4px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 8,
        }}>
          Sadece Medya İzle'de
        </p>
        <h2 style={{
          fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800,
          color: "var(--color-text)", letterSpacing: "-0.02em", marginBottom: 10,
        }}>
          Haberi değil, medyayı analiz ediyoruz
        </h2>
        <p style={{
          fontSize: 14, color: "var(--color-text-2)",
          maxWidth: 620, margin: "0 auto", lineHeight: 1.7,
        }}>
          Türkiye'de benzeri olmayan altı analiz aracıyla haberin kendisini değil, haberin nasıl
          anlatıldığını inceliyoruz. Her araç 10 ülkenin 100 medya kaynağıyla beslenir.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 14,
      }}>
        {FEATURES.map(f => (
          <Link key={f.title} href={f.href} style={{
            textDecoration: "none",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16, padding: "22px 22px 20px",
            display: "flex", flexDirection: "column", gap: 10,
            transition: "transform 0.15s, border-color 0.15s, box-shadow 0.15s",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -24, right: -24,
              width: 90, height: 90, borderRadius: "50%",
              background: `${f.color}10`, filter: "blur(20px)",
            }} />
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${f.color}18`, border: `1px solid ${f.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, position: "relative",
            }}>{f.icon}</div>
            <h3 style={{
              fontSize: 15, fontWeight: 700, color: "var(--color-text)",
              margin: 0, lineHeight: 1.4,
            }}>{f.title}</h3>
            <p style={{
              fontSize: 13, lineHeight: 1.65, color: "var(--color-text-2)",
              margin: 0, flex: 1,
            }}>{f.desc}</p>
            <div style={{
              fontSize: 12, fontWeight: 600, color: f.color,
              marginTop: 4, display: "flex", alignItems: "center", gap: 4,
            }}>
              İncele →
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
