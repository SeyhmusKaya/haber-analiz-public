import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Hakkımızda | Medya İzle",
  description: "Medya İzle, aynı haberin farklı ülkelerde nasıl yorumlandığını göstermek amacıyla kurulmuştur.",
}

const COUNTRIES = [
  { code: "TR", name: "Türkiye",         flag: "🇹🇷", sources: 10 },
  { code: "US", name: "ABD",             flag: "🇺🇸", sources: 10 },
  { code: "GB", name: "İngiltere",       flag: "🇬🇧", sources: 10 },
  { code: "DE", name: "Almanya",         flag: "🇩🇪", sources: 10 },
  { code: "RU", name: "Rusya",           flag: "🇷🇺", sources: 10 },
  { code: "CN", name: "Çin",             flag: "🇨🇳", sources: 10 },
  { code: "IR", name: "İran",            flag: "🇮🇷", sources: 10 },
  { code: "IL", name: "İsrail",          flag: "🇮🇱", sources: 10 },
  { code: "SA", name: "Suudi Arabistan", flag: "🇸🇦", sources: 10 },
  { code: "EG", name: "Mısır",           flag: "🇪🇬", sources: 10 },
]

const STEPS = [
  {
    num: "01", icon: "📡",
    title: "Haber Toplama",
    desc: "10 ülkeden 100'den fazla haber kaynağının RSS beslemelerini 2 saatte bir otomatik olarak tarıyoruz. Her ülkeden hem yandaş hem muhalif kaynak izlenir.",
    color: "#3b82f6",
  },
  {
    num: "02", icon: "🧠",
    title: "Akıllı Gruplama",
    desc: "Gemini embedding teknolojisiyle farklı kaynaklardan gelen haberleri aynı olaya göre otomatik gruplandırıyoruz. Anlambilimsel benzerlik yüksek doğrulukla tespit edilir.",
    color: "#8b5cf6",
  },
  {
    num: "03", icon: "🤖",
    title: "AI Analiz",
    desc: "Google Gemini modeli, her ülkenin yandaş ve muhalif medyasının haberi nasıl yorumladığını analiz eder ve kapsamlı Türkçe özetler üretir.",
    color: "#ec4899",
  },
  {
    num: "04", icon: "⚖️",
    title: "Karşılaştırmalı Sunum",
    desc: "Kullanıcılar haberi seçtikleri ülkenin perspektifinden görür; yandaş ve muhalif bakış açılarını yan yana karşılaştırabilir.",
    color: "#10b981",
  },
]

const VALUES = [
  { icon: "🔍", title: "Şeffaflık", desc: "Hangi kaynaktan ne aldığımızı, nasıl işlediğimizi açıkça paylaşıyoruz." },
  { icon: "⚖️", title: "Tarafsızlık", desc: "Taraf tutmak değil, tarafları göstermek. Hiçbir siyasi görüşü desteklemiyoruz." },
  { icon: "📚", title: "Medya Okuryazarlığı", desc: "Haberlerin arkasındaki anlatıları görünür kılarak eleştirel düşünceyi güçlendiriyoruz." },
  { icon: "🌍", title: "Küresel Bakış", desc: "Tek bir ülkenin değil, dünyanın farklı köşelerinden perspektifler sunuyoruz." },
]

export default function HakkimizdaPage() {
  return (
    <>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(139,92,246,0.08) 50%, rgba(236,72,153,0.06) 100%)",
        borderBottom: "1px solid var(--color-border)",
        padding: "64px 16px 56px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 50%, #8b5cf6 0%, transparent 50%)",
        }} />
        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)",
            borderRadius: 99, padding: "6px 16px", marginBottom: 24,
          }}>
            <span style={{ fontSize: 13 }}>🌐</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-accent)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Medya İzle Hakkında
            </span>
          </div>
          <h1 style={{
            fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800,
            color: "var(--color-text)", letterSpacing: "-0.03em",
            lineHeight: 1.15, marginBottom: 20,
          }}>
            Haberi değil,{" "}
            <span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              bakış açısını
            </span>{" "}oku
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "var(--color-text-2)", maxWidth: 560, margin: "0 auto 32px" }}>
            Dünya genelindeki yandaş ve muhalif medya kaynaklarını yapay zeka ile analiz ederek
            aynı olayın farklı perspektiflerden nasıl aktarıldığını karşılaştırmalı sunan bir platform.
          </p>
          <Link href="/iletisim" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 28px", borderRadius: 12,
            background: "var(--color-accent)", color: "#fff",
            fontSize: 14, fontWeight: 600, textDecoration: "none",
            transition: "opacity 0.15s",
          }}>
            Bize Ulaşın →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 16px 80px" }}>
        {/* Stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16, margin: "40px 0 64px",
        }}>
          {[
            { num: "10", label: "Ülke", sub: "Aktif medya takibi", icon: "🌍" },
            { num: "100+", label: "Kaynak", sub: "Haber ajansı ve gazete", icon: "📰" },
            { num: "50+", label: "Haber/Gün", sub: "Ortalama günlük analiz", icon: "📊" },
            { num: "Ücretsiz", label: "Temel Erişim", sub: "Tüm analizler açık", icon: "✨" },
          ].map(s => (
            <div key={s.label} style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 16, padding: "24px 20px",
              textAlign: "center",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {s.num}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="hakkimizda-mv-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 64 }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(37,99,235,0.02))",
            border: "1px solid rgba(37,99,235,0.15)",
            borderRadius: 20, padding: "32px 28px",
          }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🎯</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>Misyonumuz</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--color-text-2)", margin: 0 }}>
              Dünya genelindeki önemli olayları 10 farklı ülkenin yandaş ve muhalif medyasından
              derleyerek tarafsız, karşılaştırmalı biçimde Türkçe sunmak. Her haberin arkasındaki
              farklı anlatıları görünür kılmak ve medya okuryazarlığını artırmak.
            </p>
          </div>
          <div style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(139,92,246,0.02))",
            border: "1px solid rgba(139,92,246,0.15)",
            borderRadius: 20, padding: "32px 28px",
          }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🔭</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>Vizyonumuz</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--color-text-2)", margin: 0 }}>
              Bilgiye erişimin demokratikleştirilmesine katkı sağlamak. Tek bir haber kaynağına
              bağlı kalmadan, farklı ülkelerin medya perspektiflerini bir arada sunarak
              okuyucuların kendi görüşlerini özgürce oluşturmasına yardımcı olmak.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-accent)", marginBottom: 8 }}>
              Süreç
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
              Nasıl Çalışır?
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {STEPS.map((step) => (
              <div key={step.num} style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 20, padding: "28px 24px",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: -10, right: -10,
                  fontSize: 64, opacity: 0.06, fontWeight: 900, lineHeight: 1,
                  color: step.color, userSelect: "none",
                }}>{step.num}</div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                  background: `${step.color}18`, border: `1px solid ${step.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>{step.icon}</div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: step.color,
                  letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8,
                }}>Adım {step.num}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 10 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-text-2)", margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Countries */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-accent)", marginBottom: 8 }}>
              Kapsam
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
              Takip Ettiğimiz Ülkeler
            </h2>
            <p style={{ fontSize: 15, color: "var(--color-text-2)", marginTop: 10 }}>
              Her ülkeden 5 yandaş + 5 muhalif kaynak — toplamda 100 kaynak
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {COUNTRIES.map(c => (
              <div key={c.code} style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 14, padding: "16px",
                display: "flex", alignItems: "center", gap: 12,
                transition: "border-color 0.15s, transform 0.15s",
              }}>
                <span style={{ fontSize: 24, lineHeight: 1 }}>{c.flag}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 1 }}>{c.sources} kaynak</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-accent)", marginBottom: 8 }}>
              İlkelerimiz
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
              Değerlerimiz
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {VALUES.map(v => (
              <div key={v.title} style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 16, padding: "24px",
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{v.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>{v.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-text-2)", margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Warning box */}
        <div style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))",
          border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 20, padding: "28px 32px",
          display: "flex", gap: 20, alignItems: "flex-start",
          marginBottom: 48,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: "rgba(245,158,11,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>⚠️</div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
              Önemli Uyarı
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--color-text-2)", margin: 0 }}>
              Medya İzle herhangi bir siyasi görüşü veya ideolojiyi savunmaz. Amacımız taraf tutmak değil,
              tarafları göstermektir. Sitedeki özetler ve analizler yapay zeka tarafından otomatik olarak
              üretilmektedir; hata içerebilir. İçerikler bilgilendirme amacıyla sunulmakta olup kesin bilgi
              kaynağı olarak değerlendirilmemelidir.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(139,92,246,0.08))",
          border: "1px solid rgba(37,99,235,0.2)",
          borderRadius: 24, padding: "48px 32px",
          textAlign: "center",
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", marginBottom: 12, letterSpacing: "-0.02em" }}>
            Sorunuz mu var?
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-2)", marginBottom: 28 }}>
            Her türlü soru, öneri veya iş birliği talepleriniz için bize ulaşın.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/iletisim" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 12,
              background: "var(--color-accent)", color: "#fff",
              fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              ✉️ İletişim Formu
            </Link>
            <a href="mailto:destek@medyaizle.com" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 12,
              background: "var(--color-surface)", color: "var(--color-text)",
              border: "1px solid var(--color-border)",
              fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              destek@medyaizle.com
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .hakkimizda-mv-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
