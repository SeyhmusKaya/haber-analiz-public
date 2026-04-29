import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Medya İzle",
  description: "Medya İzle gizlilik politikası ve KVKK aydınlatma metni.",
}

const SECTIONS = [
  { id: "veri-sorumlusu",  num: "1",  title: "Veri Sorumlusu" },
  { id: "toplanan-veriler", num: "2", title: "Toplanan Kişisel Veriler" },
  { id: "isleme-amac",     num: "3",  title: "Verilerin İşlenme Amaçları" },
  { id: "hukuki-sebep",    num: "4",  title: "Hukuki Sebep" },
  { id: "cerezler",        num: "5",  title: "Çerezler" },
  { id: "ucuncu-taraf",    num: "6",  title: "Üçüncü Taraf Paylaşımı" },
  { id: "guvenlik",        num: "7",  title: "Veri Güvenliği" },
  { id: "haklariniz",      num: "8",  title: "KVKK Kapsamındaki Haklarınız" },
  { id: "basvuru",         num: "9",  title: "Başvuru Yöntemi" },
  { id: "saklama",         num: "10", title: "Verilerin Saklanma Süresi" },
  { id: "degisiklikler",   num: "11", title: "Değişiklikler" },
  { id: "iletisim",        num: "12", title: "İletişim" },
]

export default function GizlilikPage() {
  return (
    <>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.07), rgba(37,99,235,0.05))",
        borderBottom: "1px solid var(--color-border)",
        padding: "48px 16px 40px",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Link href="/" style={{ fontSize: 13, color: "var(--color-text-3)", textDecoration: "none" }}>Ana Sayfa</Link>
            <span style={{ color: "var(--color-text-3)" }}>›</span>
            <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>Gizlilik Politikası</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>🔒</div>
            <div>
              <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em", marginBottom: 8 }}>
                Gizlilik Politikası & KVKK
              </h1>
              <p style={{ fontSize: 13, color: "var(--color-text-3)" }}>
                Son güncelleme: <strong style={{ color: "var(--color-text-2)" }}>25 Mart 2026</strong>
                {" · "}6698 sayılı <strong style={{ color: "var(--color-text-2)" }}>KVKK</strong> kapsamında
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
            <div style={{ marginTop: 16, padding: "14px", background: "rgba(139,92,246,0.07)", borderRadius: 10, border: "1px solid rgba(139,92,246,0.15)" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", margin: "0 0 6px" }}>🔒 KVKK Başvurusu</p>
              <p style={{ fontSize: 11, color: "var(--color-text-3)", lineHeight: 1.5, margin: "0 0 8px" }}>
                Haklarınızı kullanmak için başvurun.
              </p>
              <Link href="/iletisim" style={{
                display: "block", textAlign: "center", padding: "8px",
                background: "rgba(139,92,246,0.1)", borderRadius: 8, fontSize: 11,
                fontWeight: 600, color: "#7c3aed", textDecoration: "none",
              }}>
                Başvuru Formu →
              </Link>
            </div>
          </aside>

          {/* Content */}
          <article>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--color-text-2)", marginBottom: 32, padding: "20px 24px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14 }}>
              Medya İzle olarak kişisel verilerinizin korunmasına büyük önem veriyoruz. Bu politika,
              6698 sayılı KVKK kapsamında kişisel verilerinizin nasıl toplandığını, işlendiğini ve
              korunduğunu açıklamaktadır.
            </p>

            <GSection id="veri-sorumlusu" num="1" title="Veri Sorumlusu" color="#7c3aed">
              <p>Kişisel verileriniz bakımından veri sorumlusu Medya İzle&apos;dir.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                {[
                  { label: "E-posta", val: "destek@medyaizle.com", icon: "✉️" },
                  { label: "Konum", val: "İstanbul, Türkiye", icon: "📍" },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: "14px 16px", borderRadius: 10,
                    background: "var(--color-surface)", border: "1px solid var(--color-border)",
                    display: "flex", gap: 10, alignItems: "center",
                  }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-3)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</p>
                      <p style={{ fontSize: 13, color: "var(--color-text)", fontWeight: 500, margin: 0 }}>{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GSection>

            <GSection id="toplanan-veriler" num="2" title="Toplanan Kişisel Veriler" color="#3b82f6">
              <p>Sitemizi kullandığınızda aşağıdaki kişisel veriler toplanabilir:</p>
              <GList items={[
                { icon: "👤", title: "Hesap Bilgileri", desc: "Ad, soyad, e-posta adresi, telefon numarası (kayıt sırasında)" },
                { icon: "📊", title: "Kullanım Verileri", desc: "Okunan haberler, kaydedilen içerikler, arama geçmişi, site içi etkileşimler" },
                { icon: "💻", title: "Teknik Veriler", desc: "IP adresi, tarayıcı türü, işletim sistemi, erişim zamanları" },
                { icon: "🍪", title: "Çerez Verileri", desc: "Oturum, tercih ve analitik çerezler aracılığıyla toplanan veriler" },
              ]} />
            </GSection>

            <GSection id="isleme-amac" num="3" title="Verilerin İşlenme Amaçları" color="#10b981">
              <GBullets items={[
                "Hesap oluşturma ve yönetimi",
                "Size kişiselleştirilmiş haber içerikleri sunulması",
                "Site kullanımının analiz edilmesi ve iyileştirilmesi",
                "Güvenlik önlemlerinin alınması ve dolandırıcılık önlenmesi",
                "Yasal yükümlülüklerin yerine getirilmesi",
                "İletişim taleplerinizin yanıtlanması",
                "Anonim istatistiksel analizler yapılması",
              ]} />
            </GSection>

            <GSection id="hukuki-sebep" num="4" title="Verilerin İşlenmesinin Hukuki Sebebi" color="#f59e0b">
              <p>Kişisel verileriniz KVKK&apos;nin 5. maddesi kapsamında şu hukuki sebeplere dayanılarak işlenmektedir:</p>
              <GBullets items={[
                "Açık rızanızın bulunması",
                "Sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması",
                "Veri sorumlusunun hukuki yükümlülüğünün yerine getirilmesi",
                "Temel hak ve özgürlüklere zarar vermemek kaydıyla meşru menfaatler",
              ]} />
            </GSection>

            <GSection id="cerezler" num="5" title="Çerezler" color="#ec4899">
              <p>
                Sitemiz deneyiminizi iyileştirmek için çerezler kullanmaktadır. Detaylı bilgi için{" "}
                <Link href="/cerez-politikasi" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>
                  Çerez Politikası
                </Link>{" "}
                sayfamızı inceleyebilirsiniz.
              </p>
              <GBullets items={[
                "Zorunlu çerezler: Oturum yönetimi, kimlik doğrulama",
                "Tercih çerezleri: Tema tercihi (açık/koyu mod)",
                "Analitik çerezler: Site kullanımı istatistikleri",
              ]} />
            </GSection>

            <GSection id="ucuncu-taraf" num="6" title="Üçüncü Taraf Paylaşımı" color="#6366f1">
              <InfoBox2 type="success" icon="🛡️" title="Verileriniz Satılmaz">
                Kişisel verileriniz hiçbir koşulda reklam veya pazarlama amacıyla üçüncü taraflara satılmaz.
              </InfoBox2>
              <p>Kişisel verileriniz yalnızca şu durumlarda paylaşılır:</p>
              <GBullets items={[
                "Yasal zorunluluk (mahkeme kararı, resmi kurum talebi)",
                "Teknik altyapı sağlayıcıları (Railway, Vercel) — sınırlı kapsamda",
                "Açık rızanızın bulunması",
              ]} />
            </GSection>

            <GSection id="guvenlik" num="7" title="Veri Güvenliği" color="#0ea5e9">
              <p>
                Kişisel verilerinizin güvenliğini sağlamak için uygun teknik ve idari önlemler alınmaktadır.
                Şifreler hash edilerek saklanır, veri iletimi şifreli kanallar üzerinden gerçekleştirilir
                ve yetkisiz erişime karşı koruma mekanizmaları uygulanmaktadır.
              </p>
            </GSection>

            <GSection id="haklariniz" num="8" title="KVKK Kapsamındaki Haklarınız" color="#7c3aed">
              <InfoBox2 type="info" icon="⚖️" title="KVKK Madde 11">
                Aşağıdaki haklarınızı kullanmak için iletişim formundan &quot;KVKK Başvurusu&quot; konusu ile başvurabilirsiniz.
              </InfoBox2>
              <GBullets items={[
                "Kişisel verilerinizin işlenip işlenmediğini öğrenme",
                "Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme",
                "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme",
                "Yurt içinde/dışında verilerin aktarıldığı üçüncü kişileri bilme",
                "Eksik/yanlış işlenmiş verilerin düzeltilmesini isteme",
                "Koşullar çerçevesinde kişisel verilerin silinmesini/yok edilmesini isteme",
                "Düzeltme ve silme işlemlerinin üçüncü kişilere bildirilmesini isteme",
                "Otomatik sistemlerle analiz sonucu aleyhe çıkan kararlara itiraz etme",
                "Kanuna aykırı işleme sebebiyle uğranılan zararın giderilmesini talep etme",
              ]} />
            </GSection>

            <GSection id="basvuru" num="9" title="Başvuru Yöntemi" color="#10b981">
              <p>Haklarınızı kullanmak için aşağıdaki yöntemlerden biriyle başvurabilirsiniz:</p>
              <GBullets items={[
                "E-posta: destek@medyaizle.com",
                "İletişim formu üzerinden (konu: KVKK Başvurusu)",
              ]} />
              <p>Başvurunuz en geç <strong style={{ color: "var(--color-text)" }}>30 gün</strong> içinde ücretsiz olarak yanıtlanacaktır.</p>
            </GSection>

            <GSection id="saklama" num="10" title="Verilerin Saklanma Süresi" color="#f59e0b">
              <p>
                Kişisel verileriniz, toplanma amacının gerektirdiği süre veya yasal yükümlülükler dahilinde saklanır.
                Hesabınızı sildiğinizde kişisel verileriniz makul bir süre içinde sistemlerimizden kaldırılır
                (yasal saklama yükümlülüklerine tabi veriler hariç).
              </p>
            </GSection>

            <GSection id="degisiklikler" num="11" title="Değişiklikler" color="#6366f1">
              <p>
                Bu gizlilik politikasını herhangi bir zamanda güncelleme hakkımızı saklı tutarız.
                Önemli değişiklikler olması durumunda sitemiz üzerinden bildirim yapılacaktır.
              </p>
            </GSection>

            <GSection id="iletisim" num="12" title="İletişim" color="#3b82f6" last>
              <InfoBox2 type="info" icon="✉️" title="Sorularınız için">
                <Link href="/iletisim" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>İletişim formunu</Link> kullanabilir
                veya <a href="mailto:destek@medyaizle.com" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>destek@medyaizle.com</a> adresine yazabilirsiniz.
              </InfoBox2>
            </GSection>
          </article>
        </div>
      </div>
      <style>{`.toc-link:hover { color: var(--color-accent) !important; }`}</style>
    </>
  )
}

function GSection({ id, num, title, children, color, last }: {
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

function GList({ items }: { items: { icon: string; title: string; desc: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: "flex", gap: 12, alignItems: "flex-start",
          padding: "14px 16px", borderRadius: 10,
          background: "var(--color-surface)", border: "1px solid var(--color-border)",
        }}>
          <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>{item.icon}</span>
          <div>
            <strong style={{ fontSize: 13, color: "var(--color-text)", display: "block", marginBottom: 2 }}>{item.title}</strong>
            <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>{item.desc}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function GBullets({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "12px 0 0", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}>
          <span style={{ color: "var(--color-accent)", fontWeight: 700, flexShrink: 0, marginTop: 2 }}>›</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function InfoBox2({ type, icon, title, children }: {
  type: "info" | "success" | "warning"; icon: string; title: string; children: React.ReactNode
}) {
  const colors = {
    info: { bg: "rgba(37,99,235,0.07)", border: "rgba(37,99,235,0.2)", icon: "rgba(37,99,235,0.12)", text: "#2563eb" },
    success: { bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.2)", icon: "rgba(16,185,129,0.12)", text: "#059669" },
    warning: { bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.2)", icon: "rgba(245,158,11,0.12)", text: "#d97706" },
  }[type]
  return (
    <div style={{
      background: colors.bg, border: `1px solid ${colors.border}`,
      borderRadius: 12, padding: "14px 16px", marginBottom: 14,
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: colors.icon,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
      }}>{icon}</div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: colors.text, margin: "0 0 4px" }}>{title}</p>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--color-text-2)", margin: 0 }}>{children}</p>
      </div>
    </div>
  )
}
