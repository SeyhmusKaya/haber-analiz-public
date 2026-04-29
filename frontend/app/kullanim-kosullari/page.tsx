import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Kullanım Koşulları | Medya İzle",
  description: "Medya İzle web sitesinin kullanım koşulları ve şartları.",
}

const SECTIONS = [
  { id: "tanimlar",        num: "1", title: "Tanımlar" },
  { id: "hizmet",          num: "2", title: "Hizmet Tanımı" },
  { id: "yapay-zeka",      num: "3", title: "Yapay Zeka İçerik Uyarısı" },
  { id: "kullanim",        num: "4", title: "Kullanım Kuralları" },
  { id: "hesap",           num: "5", title: "Hesap Kullanımı" },
  { id: "fikri-mulkiyet",  num: "6", title: "Fikri Mülkiyet Hakları" },
  { id: "sorumluluk",      num: "7", title: "Sorumluluk Sınırlaması" },
  { id: "ucuncu-taraf",    num: "8", title: "Üçüncü Taraf Bağlantıları" },
  { id: "degisiklikler",   num: "9", title: "Değişiklikler" },
  { id: "hukuk",           num: "10", title: "Uygulanacak Hukuk" },
  { id: "iletisim",        num: "11", title: "İletişim" },
]

export default function KullanimKosullariPage() {
  return (
    <>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, rgba(37,99,235,0.07), rgba(139,92,246,0.05))",
        borderBottom: "1px solid var(--color-border)",
        padding: "48px 16px 40px",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Link href="/" style={{ fontSize: 13, color: "var(--color-text-3)", textDecoration: "none" }}>Ana Sayfa</Link>
            <span style={{ color: "var(--color-text-3)" }}>›</span>
            <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>Kullanım Koşulları</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>📋</div>
            <div>
              <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em", marginBottom: 8 }}>
                Kullanım Koşulları
              </h1>
              <p style={{ fontSize: 13, color: "var(--color-text-3)" }}>
                Son güncelleme: <strong style={{ color: "var(--color-text-2)" }}>25 Mart 2026</strong>
                {" · "}Yaklaşık okuma süresi: <strong style={{ color: "var(--color-text-2)" }}>5 dakika</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 16px 80px" }}>
        <div className="legal-grid" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 40, alignItems: "start" }}>

          {/* TOC Sidebar */}
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
                borderBottom: "1px solid var(--color-border)",
                transition: "color 0.15s",
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
              Bu kullanım koşulları, Medya İzle web sitesini kullanan tüm kullanıcılar için geçerlidir.
              Siteyi kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.
            </p>

            <Section id="tanimlar" num="1" title="Tanımlar">
              <p>
                <strong style={{ color: "var(--color-text)" }}>&quot;Medya İzle&quot;</strong> veya <strong style={{ color: "var(--color-text)" }}>&quot;Biz&quot;:</strong> Medya İzle platformunu işletmekte olan kuruluştur.
                <strong style={{ color: "var(--color-text)" }}> &quot;Kullanıcı&quot;</strong> veya <strong style={{ color: "var(--color-text)" }}>&quot;Siz&quot;:</strong> Siteyi ziyaret eden, kullanan veya içeriklere erişen herhangi bir kişidir.
                <strong style={{ color: "var(--color-text)" }}> &quot;İçerik&quot;:</strong> Sitede yer alan tüm yazılar, analizler, özetler, görseller ve diğer materyallerdir.
              </p>
            </Section>

            <Section id="hizmet" num="2" title="Hizmet Tanımı">
              <p>
                Medya İzle, dünya genelindeki haber kaynaklarını toplayarak aynı haberin farklı ülkelerin yandaş ve muhalif medyasında
                nasıl yorumlandığını karşılaştırmalı olarak sunan bir platformdur. Sitedeki içerikler, yapay zeka (Gemini API)
                tarafından otomatik olarak oluşturulmaktadır.
              </p>
            </Section>

            <Section id="yapay-zeka" num="3" title="Yapay Zeka ile Üretilen İçerik Uyarısı">
              <InfoBox type="warning" icon="⚠️" title="Önemli Uyarı">
                Sitemizdeki özetler ve analizler yapay zeka tarafından otomatik üretilmektedir; hatalar içerebilir.
                Kesin bilgi kaynağı olarak kullanılmamalıdır.
              </InfoBox>
              <p>Sitemizdeki özetler, analizler ve karşılaştırmalar yapay zeka teknolojisi kullanılarak otomatik olarak üretilmektedir. Bu içerikler:</p>
              <List items={[
                "Gazeteci veya editör tarafından yazılmamıştır.",
                "Hatalar, yanlış yorumlamalar veya eksiklikler içerebilir.",
                "Haber kaynaklarının görüşlerini yansıtır, Medya İzle'nin görüşlerini değil.",
                "Kesin bilgi kaynağı olarak kullanılmamalıdır.",
                "Orijinal haber kaynaklarına erişim için referans amacıyla sunulmaktadır.",
              ]} />
            </Section>

            <Section id="kullanim" num="4" title="Kullanım Kuralları">
              <p>Siteyi kullanırken aşağıdaki kurallara uymanız gerekmektedir:</p>
              <List items={[
                "Siteyi yalnızca yasal amaçlarla kullanabilirsiniz.",
                "Siteyi veya sunucularımızı bozabilecek, aşırı yükleyebilecek ya da işleyişini engelleyebilecek şekilde kullanamazsınız.",
                "Sitedeki içerikleri ticari amaçla kopyalayamaz, çoğaltamaz veya dağıtamazsınız.",
                "Otomatik veri toplama araçları (bot, scraper vb.) kullanarak siteden toplu veri çekmek yasaktır.",
                "Diğer kullanıcıların site kullanımını engelleyecek veya kısıtlayacak hiçbir faaliyette bulunamazsınız.",
              ]} />
            </Section>

            <Section id="hesap" num="5" title="Hesap Kullanımı">
              <p>Sitemizde hesap oluşturabilirsiniz. Hesabınızla ilgili sorumluluklar:</p>
              <List items={[
                "Hesap bilgilerinizin güvenliğinden siz sorumlusunuz.",
                "Şifrenizi başkalarıyla paylaşmamalısınız.",
                "Hesabınız üzerinden gerçekleştirilen tüm işlemlerden siz sorumlusunuz.",
                "Hesabınızda yetkisiz bir erişim tespit ederseniz derhal bize bildirmeniz gerekmektedir.",
                "Kullanım koşullarını ihlal eden hesaplar uyarı yapılmaksızın askıya alınabilir veya silinebilir.",
              ]} />
            </Section>

            <Section id="fikri-mulkiyet" num="6" title="Fikri Mülkiyet Hakları">
              <p>
                Sitedeki tasarım, logo, yazılım kodu ve özel olarak üretilmiş içerikler Medya İzle&apos;e aittir.
                Haber özetleri ve analizler, kaynak haber kuruluşlarına ait içeriklerin yapay zeka ile işlenmiş halleridir.
                Orijinal haberler, ilgili haber kuruluşlarının fikri mülkiyetindedir. Kaynaklara verilen referanslar
                bilgilendirme amacıyla sunulmaktadır.
              </p>
            </Section>

            <Section id="sorumluluk" num="7" title="Sorumluluk Sınırlaması">
              <p>Medya İzle, sitede sunulan içeriklerin doğruluğunu, eksiksizliğini veya güncelliğini garanti etmez. Özellikle:</p>
              <List items={[
                "Yapay zeka tarafından üretilen özetler ve analizler hatalar içerebilir.",
                "RSS kaynaklarından çekilen haber verilerinin doğruluğu ilgili kaynakların sorumluluğundadır.",
                "Site içeriklerine dayanarak alınan kararlardan Medya İzle sorumlu tutulamaz.",
                "Siteye erişimde yaşanabilecek teknik aksaklıklardan dolayı sorumluluk kabul edilmez.",
              ]} />
            </Section>

            <Section id="ucuncu-taraf" num="8" title="Üçüncü Taraf Bağlantıları">
              <p>
                Sitemiz, üçüncü taraf web sitelerine bağlantılar içerebilir. Bu bağlantılara tıkladığınızda,
                bizim kontrol alanımız dışındaki web sitelerine yönlendirilirsiniz. Üçüncü taraf sitelerinin
                içerik, gizlilik politikası veya uygulamalarından Medya İzle sorumlu değildir.
              </p>
            </Section>

            <Section id="degisiklikler" num="9" title="Değişiklikler">
              <p>
                Bu kullanım koşullarını herhangi bir zamanda değiştirme hakkımızı saklı tutarız. Değişiklikler
                sitede yayınlandığı anda yürürlüğe girer. Siteyi kullanmaya devam etmeniz, güncel koşulları
                kabul ettiğiniz anlamına gelir. Önemli değişiklikler için site üzerinden bildirim yapılabilir.
              </p>
            </Section>

            <Section id="hukuk" num="10" title="Uygulanacak Hukuk">
              <p>
                Bu kullanım koşulları, Türkiye Cumhuriyeti kanunlarına tabidir. Herhangi bir uyuşmazlık
                durumunda İstanbul mahkemeleri ve icra daireleri yetkilidir.
              </p>
            </Section>

            <Section id="iletisim" num="11" title="İletişim" last>
              <InfoBox type="info" icon="✉️" title="Bize Ulaşın">
                Bu kullanım koşullarıyla ilgili sorularınız için{" "}
                <Link href="/iletisim" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>
                  iletişim formumuzu
                </Link>{" "}
                kullanabilir veya{" "}
                <a href="mailto:destek@medyaizle.com" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>
                  destek@medyaizle.com
                </a>{" "}
                adresine e-posta gönderebilirsiniz.
              </InfoBox>
            </Section>
          </article>
        </div>
      </div>

      <style>{`
        .toc-link:hover { color: var(--color-accent) !important; }
        @media (max-width: 768px) {
          .legal-layout { grid-template-columns: 1fr !important; }
          .legal-toc { display: none !important; }
        }
      `}</style>
    </>
  )
}

function Section({ id, num, title, children, last }: {
  id: string; num: string; title: string; children: React.ReactNode; last?: boolean
}) {
  return (
    <section id={id} style={{ marginBottom: last ? 0 : 40, scrollMarginTop: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(139,92,246,0.1))",
          border: "1px solid rgba(37,99,235,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, color: "var(--color-accent)",
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

function List({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "12px 0 16px", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 2,
            background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: "var(--color-accent)", fontWeight: 700,
          }}>✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function InfoBox({ type, icon, title, children }: {
  type: "info" | "warning"; icon: string; title: string; children: React.ReactNode
}) {
  const colors = type === "warning"
    ? { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", icon: "rgba(245,158,11,0.15)", text: "#d97706" }
    : { bg: "rgba(37,99,235,0.07)", border: "rgba(37,99,235,0.2)", icon: "rgba(37,99,235,0.12)", text: "#2563eb" }
  return (
    <div style={{
      background: colors.bg, border: `1px solid ${colors.border}`,
      borderRadius: 12, padding: "16px 18px", marginBottom: 16,
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: colors.icon,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
      }}>{icon}</div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: colors.text, margin: "0 0 4px" }}>{title}</p>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-text-2)", margin: 0 }}>{children}</p>
      </div>
    </div>
  )
}
