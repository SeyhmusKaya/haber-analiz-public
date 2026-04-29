import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Çerez Politikası | Medya İzle",
  description: "Medya İzle web sitesi çerez (cookie) politikası.",
}

const SECTIONS = [
  { id: "nedir",        num: "1", title: "Çerez Nedir?" },
  { id: "turler",       num: "2", title: "Kullandığımız Çerez Türleri" },
  { id: "ucuncu-taraf", num: "3", title: "Üçüncü Taraf Çerezleri" },
  { id: "yonetme",      num: "4", title: "Çerezleri Yönetme" },
  { id: "local-storage",num: "5", title: "Yerel Depolama" },
  { id: "degisiklikler",num: "6", title: "Değişiklikler" },
  { id: "iletisim",     num: "7", title: "İletişim" },
]

const COOKIE_TYPES = [
  {
    type: "Zorunlu Çerezler",
    icon: "🔐",
    purpose: "Sitenin temel işlevlerinin çalışması için gereklidir. Oturum yönetimi, güvenlik ve kimlik doğrulama işlemleri bu çerezler aracılığıyla yapılır.",
    duration: "Oturum süresi",
    optional: false,
    color: "#10b981",
  },
  {
    type: "Tercih Çerezleri",
    icon: "⚙️",
    purpose: "Kullanıcı tercihlerini (tema: açık/koyu mod, dil tercihi vb.) hatırlamak için kullanılır. Her ziyarette tercihlerinizi yeniden ayarlamanız gerekmez.",
    duration: "1 yıl",
    optional: true,
    color: "#3b82f6",
  },
  {
    type: "Analitik Çerezler",
    icon: "📊",
    purpose: "Sitenin nasıl kullanıldığını anlamamıza yardımcı olur. Ziyaretçi sayısı, sayfa görüntülenmeleri ve sitede geçirilen süre gibi anonim istatistiksel veriler toplar.",
    duration: "2 yıl",
    optional: true,
    color: "#8b5cf6",
  },
  {
    type: "Performans Çerezleri",
    icon: "⚡",
    purpose: "Sitenin performansını ölçmek ve iyileştirmek için kullanılır. Sayfaların yüklenme süreleri ve hata raporları gibi teknik veriler toplar.",
    duration: "1 yıl",
    optional: true,
    color: "#f59e0b",
  },
]

const BROWSERS = [
  { name: "Chrome",  icon: "🌐", path: "Ayarlar › Gizlilik ve güvenlik › Çerezler ve diğer site verileri" },
  { name: "Firefox", icon: "🦊", path: "Ayarlar › Gizlilik ve Güvenlik › Çerezler ve Site Verileri" },
  { name: "Safari",  icon: "🧭", path: "Tercihler › Gizlilik › Çerezleri ve web sitesi verilerini yönet" },
  { name: "Edge",    icon: "🔷", path: "Ayarlar › Çerezler ve site izinleri › Çerezleri ve site verilerini yönetin" },
]

export default function CerezPolitikasiPage() {
  return (
    <>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, rgba(245,158,11,0.07), rgba(37,99,235,0.05))",
        borderBottom: "1px solid var(--color-border)",
        padding: "48px 16px 40px",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Link href="/" style={{ fontSize: 13, color: "var(--color-text-3)", textDecoration: "none" }}>Ana Sayfa</Link>
            <span style={{ color: "var(--color-text-3)" }}>›</span>
            <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>Çerez Politikası</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>🍪</div>
            <div>
              <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em", marginBottom: 8 }}>
                Çerez Politikası
              </h1>
              <p style={{ fontSize: 13, color: "var(--color-text-3)" }}>
                Son güncelleme: <strong style={{ color: "var(--color-text-2)" }}>25 Mart 2026</strong>
                {" · "}<strong style={{ color: "var(--color-text-2)" }}>4</strong> farklı çerez türü
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 16px 80px" }}>
        <div className="legal-grid" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 40, alignItems: "start" }}>

          {/* TOC */}
          <aside className="legal-toc" style={{
            position: "sticky", top: 80,
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: 16, padding: "20px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-3)", marginBottom: 14 }}>
              İçindekiler
            </p>
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`} className="toc-link" style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
                fontSize: 12, color: "var(--color-text-2)", textDecoration: "none",
                borderBottom: "1px solid var(--color-border)", transition: "color 0.15s",
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-3)", minWidth: 18 }}>{s.num}.</span>
                {s.title}
              </a>
            ))}
            <div style={{ marginTop: 16 }}>
              <Link href="/iletisim" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: "rgba(37,99,235,0.08)", color: "var(--color-accent)",
                textDecoration: "none", border: "1px solid rgba(37,99,235,0.2)",
              }}>
                💬 Soru Sor
              </Link>
            </div>
          </aside>

          {/* Content */}
          <article>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--color-text-2)", marginBottom: 32, padding: "20px 24px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14 }}>
              Medya İzle web sitesi, kullanıcı deneyimini iyileştirmek, sitenin düzgün çalışmasını sağlamak
              ve kullanımını analiz etmek amacıyla çerezler kullanmaktadır.
            </p>

            <CSection id="nedir" num="1" title="Çerez Nedir?" color="#f59e0b">
              <p>
                Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınız tarafından cihazınıza kaydedilen küçük metin dosyalarıdır.
                Çerezler, siteyi bir sonraki ziyaretinizde sizi tanımasına, tercihlerinizi hatırlamasına ve daha iyi bir deneyim
                sunmasına yardımcı olur.
              </p>
            </CSection>

            <CSection id="turler" num="2" title="Kullandığımız Çerez Türleri" color="#3b82f6">
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 4 }}>
                {COOKIE_TYPES.map(cookie => (
                  <div key={cookie.type} style={{
                    background: "var(--color-surface)", border: "1px solid var(--color-border)",
                    borderRadius: 14, padding: "20px",
                    borderLeft: `3px solid ${cookie.color}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{cookie.icon}</span>
                        <strong style={{ fontSize: 14, color: "var(--color-text)" }}>{cookie.type}</strong>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                          background: cookie.optional ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)",
                          color: cookie.optional ? "#d97706" : "#059669",
                        }}>
                          {cookie.optional ? "İsteğe Bağlı" : "Zorunlu"}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                          background: "var(--color-surface-2)", color: "var(--color-text-2)",
                        }}>
                          ⏱ {cookie.duration}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--color-text-2)", margin: 0 }}>
                      {cookie.purpose}
                    </p>
                  </div>
                ))}
              </div>
            </CSection>

            <CSection id="ucuncu-taraf" num="3" title="Üçüncü Taraf Çerezleri" color="#8b5cf6">
              <p>Sitemizde aşağıdaki üçüncü taraf hizmet sağlayıcılarının çerezleri kullanılabilir:</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                {[
                  { name: "Vercel Analytics", icon: "▲", desc: "Site performansı ve kullanıcı deneyimi takibi", color: "#000" },
                  { name: "Google Fonts", icon: "G", desc: "Yazı tipi yüklemesi için HTTP istekleri", color: "#4285f4" },
                ].map(item => (
                  <div key={item.name} style={{
                    padding: "16px", borderRadius: 12,
                    background: "var(--color-surface)", border: "1px solid var(--color-border)",
                    display: "flex", gap: 12, alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: `${item.color}15`, border: `1px solid ${item.color}25`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 900, color: item.color,
                    }}>{item.icon}</div>
                    <div>
                      <strong style={{ fontSize: 13, color: "var(--color-text)", display: "block", marginBottom: 3 }}>{item.name}</strong>
                      <span style={{ fontSize: 12, color: "var(--color-text-2)" }}>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CSection>

            <CSection id="yonetme" num="4" title="Çerezleri Yönetme" color="#10b981">
              <p>Çerezleri tarayıcı ayarlarınız üzerinden yönetebilirsiniz:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                {BROWSERS.map(browser => (
                  <div key={browser.name} style={{
                    padding: "14px 16px", borderRadius: 10,
                    background: "var(--color-surface)", border: "1px solid var(--color-border)",
                    display: "flex", gap: 12, alignItems: "flex-start",
                  }}>
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{browser.icon}</span>
                    <div>
                      <strong style={{ fontSize: 13, color: "var(--color-text)", display: "block", marginBottom: 2 }}>{browser.name}</strong>
                      <code style={{ fontSize: 12, color: "var(--color-text-2)", background: "var(--color-surface-2)", padding: "2px 6px", borderRadius: 5 }}>
                        {browser.path}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 16, padding: "14px 16px",
                background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10,
              }}>
                <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
                  ⚠️ Dikkat
                </p>
                <p style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.6, margin: 0 }}>
                  Çerezleri devre dışı bırakmanız durumunda oturum yönetimi ve tema tercihi gibi işlevler
                  düzgün çalışmayabilir.
                </p>
              </div>
            </CSection>

            <CSection id="local-storage" num="5" title="Yerel Depolama (Local Storage)" color="#6366f1">
              <p>
                Çerezlere ek olarak, sitemiz tarayıcınızın yerel depolama (localStorage) özelliğini de kullanmaktadır.
                Bu alan, oturum belirtecinizi (token) ve tema tercihinizi saklamak için kullanılır.
              </p>
              <div style={{
                marginTop: 12, padding: "14px 16px",
                background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 10,
              }}>
                <p style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.65, margin: 0 }}>
                  💡 Yerel depolama verileri tarayıcınızın geliştirici araçları (<code>F12 › Application › Local Storage</code>) üzerinden görüntülenebilir ve silinebilir.
                </p>
              </div>
            </CSection>

            <CSection id="degisiklikler" num="6" title="Değişiklikler" color="#f59e0b">
              <p>
                Bu çerez politikasını herhangi bir zamanda güncelleme hakkımızı saklı tutarız. Değişiklikler
                bu sayfada yayınlanarak yürürlüğe girer. Güncel versiyonu düzenli olarak kontrol etmenizi öneririz.
              </p>
            </CSection>

            <CSection id="iletisim" num="7" title="İletişim" color="#3b82f6" last>
              <div style={{
                padding: "20px 24px",
                background: "linear-gradient(135deg, rgba(37,99,235,0.07), rgba(139,92,246,0.05))",
                border: "1px solid rgba(37,99,235,0.15)", borderRadius: 14,
              }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", marginBottom: 8 }}>
                  Çerez politikamızla ilgili sorularınız için:
                </p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <a href="mailto:destek@medyaizle.com" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                    background: "var(--color-accent)", color: "#fff", textDecoration: "none",
                  }}>
                    ✉️ destek@medyaizle.com
                  </a>
                  <Link href="/iletisim" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                    background: "var(--color-surface)", color: "var(--color-text)",
                    border: "1px solid var(--color-border)", textDecoration: "none",
                  }}>
                    💬 İletişim Formu
                  </Link>
                </div>
              </div>
            </CSection>
          </article>
        </div>
      </div>
      <style>{`.toc-link:hover { color: var(--color-accent) !important; }`}</style>
    </>
  )
}

function CSection({ id, num, title, children, color, last }: {
  id: string; num: string; title: string; children: React.ReactNode; color: string; last?: boolean
}) {
  return (
    <section id={id} style={{ marginBottom: last ? 0 : 40, scrollMarginTop: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: `${color}20`, border: `1px solid ${color}35`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, color,
        }}>{num}</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{title}</h2>
      </div>
      <div style={{ paddingLeft: 44, fontSize: 15, lineHeight: 1.8, color: "var(--color-text-2)" }}>
        {children}
      </div>
      {!last && <div style={{ height: 1, background: "var(--color-border)", marginTop: 40 }} />}
    </section>
  )
}
