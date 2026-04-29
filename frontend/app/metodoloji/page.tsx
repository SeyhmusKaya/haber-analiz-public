import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Metodoloji ve Editöryal İlkeler | Medya İzle",
  description:
    "Medya İzle'nin haber toplama, gruplandırma, analiz ve yayınlama süreçleri. Yapay zeka kullanımımız, editöryal ilkelerimiz, kaynak seçimimiz ve şeffaflık taahhütlerimiz.",
  alternates: { canonical: "https://medyaizle.com/metodoloji" },
}

const SECTIONS = [
  {
    num: "1",
    title: "Kaynak Seçim Kriterleri",
    body: [
      "Medya İzle'nin izlediği 100 kaynak rastgele seçilmemiştir. Her ülke için çok katmanlı bir değerlendirme sonucu belirlenmiştir.",
      "Bir kaynağın sisteme girmesi için şu kriterleri karşılaması gerekir: (1) Açık erişime sahip RSS beslemesi sunmalı, (2) En az 3 yıllık yayın geçmişi olmalı, (3) Günlük düzenli haber üretiyor olmalı, (4) Bulunduğu ülkede tanınmış bir medya kuruluşu olmalı, (5) İngilizce, Türkçe, Almanca, Rusça, Çince, Arapça, Farsça veya İbranice yayın yapmalı.",
      "Yandaş-muhalif sınıflandırması Reporters Without Borders, Freedom House, AllSides Media Bias Ratings, Ad Fontes Media Bias Chart ve akademik medya çalışmalarından elde edilen verilere dayanır. Hiçbir kaynak Medya İzle'nin öznel değerlendirmesiyle sınıflandırılmaz — bu sınıflandırmalar dış kaynaklara referans olarak yapılır.",
      "Bir kaynak hakkında şikâyet veya düzeltme talebi gelirse, şikâyet belgelenir, sınıflandırma kararı yeniden gözden geçirilir ve gerekirse değiştirilir.",
    ],
  },
  {
    num: "2",
    title: "Veri Toplama Süreci",
    body: [
      "Kaynaklar 2 saatte bir otomatik olarak taranır. Her tarama bağımsız bir işlem olarak çalışır; bir kaynağın erişilemez olması diğerlerini etkilemez.",
      "RSS beslemelerinden alınan başlık, özet ve yayın tarihi ilk aşamada veritabanına kaydedilir. Ardından tam metin çekme (full-text scraping) işlemi başlar — makalenin tam içeriği ilgili kaynağın sayfasından alınır.",
      "Dil tespiti otomatik yapılır. Türkçe olmayan makaleler Google Gemini modeliyle Türkçe'ye çevrilir. Çeviri orijinal metne referansla yapılır; çeviri yapıldığı açıkça belirtilir ve orijinal kaynağa bağlantı verilir.",
      "Robots.txt ve rate limit kurallarına uyulur. Bir kaynak scraping'i engelliyorsa veya yavaşlatıyorsa işlem o kaynak için durdurulur.",
    ],
  },
  {
    num: "3",
    title: "Gruplandırma (Clustering) Algoritması",
    body: [
      "Aynı olaya ait farklı kaynaklardan gelen haberler Gemini Embedding modeliyle vektör uzayında gruplandırılır. Her makale 768 boyutlu bir vektöre dönüştürülür.",
      "Vektör benzerliği (cosine similarity) 0.82'nin üzerinde olan makaleler aynı olay cluster'ına dahil edilir. Eşik değer sürekli olarak kalibre edilir; çok geniş gruplar ve çok dar gruplar izlenir.",
      "Her cluster'ın Türkçe başlığı ve özeti Gemini 2.5 Flash modeliyle üretilir. Bu özetler tek bir kaynağa dayanmaz; cluster'daki tüm makalelerin ortak anlatısını yansıtır.",
      "Gruplandırma hatası tespit edildiğinde (örneğin iki farklı olay aynı cluster'a düşmüşse) cluster manuel olarak ayrılır ve embedding eşikleri ayarlanır.",
    ],
  },
  {
    num: "4",
    title: "Yapay Zeka Analizi",
    body: [
      "Ülke bazlı analizler kullanıcı talebiyle tetiklenir; batch üretim yapılmaz. Bir kullanıcı örneğin ABD bayrağına tıkladığında, o ülkenin cluster'daki yandaş ve muhalif kaynaklarının anlatıları Gemini'ye gönderilir.",
      "Model prompt'ları şu yapıdadır: (1) Bu haber hakkında yandaş medyanın anlatımı nedir? (2) Muhalif medyanın anlatımı nedir? (3) İki tarafın hemfikir olduğu noktalar var mı? (4) Propaganda teknikleri kullanılmış mı?",
      "Model çıktıları bir JSON şemasına bağlı kalır. Serbest metin yerine yapılandırılmış veri üretilir. Bu sayede analiz sonuçları tutarlı ve karşılaştırılabilirdir.",
      "Tüm analiz sonuçları 24 saat cache'lenir. Aynı kullanıcı aynı haberi tekrar açarsa yeni bir AI çağrısı yapılmaz. Bu hem maliyet hem de tutarlılık için gereklidir.",
    ],
  },
  {
    num: "5",
    title: "Propaganda ve Yanlılık Skorları",
    body: [
      "Her makale için dört metrik hesaplanır: (1) Propaganda yoğunluğu 0-10 arası, (2) Duygusal yükleme 0-10 arası, (3) Olgusal içerik oranı 0-10 arası, (4) Kaynak çeşitliliği 0-10 arası.",
      "Kullanılan retorik teknikler açıkça etiketlenir: duygu manipülasyonu, genelleme, yanlış dikotomi, straw man, whataboutism, ad hominem, kiraz toplama, yanlış neden-sonuç ilişkisi.",
      "Bu skorlar öznel yargı değil, dilbilimsel ve söylem analizi tekniklerine dayanan değerlendirmelerdir. Yanlılık işareti değil, bir ölçüm sonucudur.",
      "Skorlar Gemini modeli tarafından üretilir ancak referans olarak akademik propaganda analiz çerçeveleri (Jowett & O'Donnell, Institute for Propaganda Analysis) kullanılır.",
    ],
  },
  {
    num: "6",
    title: "Hata Düzeltme ve Güncelleme",
    body: [
      "Yapay zeka üretimi tüm içerikler hata içerebilir. Bir hata tespit edildiğinde şu adımlar uygulanır: (1) Hatalı içerik 24 saat içinde güncellenir, (2) Düzeltme işlemi cache'i temizler, (3) Kaynak yanlış sınıflandırılmışsa yeniden sınıflandırılır.",
      "Kullanıcılar hata bildirimini iletişim formundan 'Hata Bildirimi' konusuyla yapabilir. Her bildirim 72 saat içinde değerlendirilir.",
      "Sistematik hatalar (örneğin bir kaynağın sürekli yanlış analiz edilmesi) cron job'larımızın log'larında takip edilir. Günlük sağlık kontrolü çalışır.",
    ],
  },
  {
    num: "7",
    title: "Şeffaflık Taahhütleri",
    body: [
      "Hangi kaynakları izlediğimiz kamuya açıktır — /kaynaklar sayfasında listelenir.",
      "Hangi yapay zeka modellerini kullandığımızı açıkça belirtiyoruz: Gemini Embedding (gruplandırma), Gemini 2.5 Flash (özetleme ve analiz).",
      "Her AI üretimi içerik 'Yapay Zeka Özeti' etiketiyle işaretlenir. Kullanıcı hangi metnin insan, hangi metnin AI üretimi olduğunu net görür.",
      "Tüm haberlerin orijinal kaynaklarına bağlantı verilir. Hiçbir haber orijinal kaynağı gizlenerek sunulmaz.",
    ],
  },
  {
    num: "8",
    title: "Bağımsızlık ve Finansman",
    body: [
      "Medya İzle hiçbir siyasi parti, hükümet, devlet kurumu veya medya grubundan finansman almaz.",
      "Gelir modelimiz: (1) Pro üyelik (aylık ₺79), (2) Reklam (Google AdSense onay süreci devam ediyor), (3) API erişim ücretleri.",
      "Reklam veren şirketler editöryal kararları etkileyemez. Reklam içerikleri 'Sponsorlu' olarak işaretlenir ve haber/analiz bölümlerinden ayrıştırılır.",
      "Bir kaynağın yandaş veya muhalif olarak sınıflandırılması maddi teşvikle değiştirilemez. Bu konuda bir teklif gelmesi durumunda kamuoyuyla paylaşılacaktır.",
    ],
  },
]

export default function MetodolojiPage() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 20px 80px" }}>
      <div style={{ marginBottom: 40 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 10,
        }}>
          Editöryal İlkeler
        </p>
        <h1 style={{
          fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800,
          color: "var(--color-text)", letterSpacing: "-0.03em",
          lineHeight: 1.15, marginBottom: 16,
        }}>
          Metodoloji ve Editöryal İlkeler
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--color-text-2)" }}>
          Medya İzle olarak haber toplama, gruplandırma, analiz ve yayınlama süreçlerimizin tamamını
          bu sayfada şeffaflık ilkesiyle belgeliyoruz. Güvenilir bir medya analiz platformu olmak
          için her adımımızın izlenebilir ve denetlenebilir olması gerektiğine inanıyoruz.
        </p>
      </div>

      <div style={{
        background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(139,92,246,0.05))",
        border: "1px solid rgba(37,99,235,0.18)",
        borderRadius: 14, padding: "18px 22px", marginBottom: 40,
        display: "flex", gap: 14, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 22 }}>📌</span>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text-2)", margin: 0 }}>
          Bu sayfa yaşayan bir belgedir. Metodolojimiz değiştiğinde bu sayfa da güncellenir.
          Son güncelleme: <strong style={{ color: "var(--color-text)" }}>Nisan 2026</strong>.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
        {SECTIONS.map(section => (
          <section key={section.num}>
            <h2 style={{
              fontSize: 22, fontWeight: 800, color: "var(--color-text)",
              letterSpacing: "-0.02em", marginBottom: 14,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 700, flexShrink: 0,
              }}>{section.num}</span>
              {section.title}
            </h2>
            <div style={{ paddingLeft: 50 }}>
              {section.body.map((p, i) => (
                <p key={i} style={{
                  fontSize: 15, lineHeight: 1.8, color: "var(--color-text-2)",
                  margin: i === 0 ? 0 : "14px 0 0",
                }}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div style={{
        marginTop: 56, padding: "28px 28px 28px 28px",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
      }}>
        <h3 style={{
          fontSize: 17, fontWeight: 700, color: "var(--color-text)",
          marginBottom: 10, letterSpacing: "-0.01em",
        }}>
          Düzeltme veya itirazınız mı var?
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text-2)", marginBottom: 16 }}>
          Bir kaynağın yanlış sınıflandırıldığını, bir analizin hatalı üretildiğini veya bir haberin
          eksik temsil edildiğini düşünüyorsanız bize bildirin. Tüm bildirimler 72 saat içinde
          değerlendirilir.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/iletisim" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 22px", borderRadius: 10,
            background: "var(--color-accent)", color: "#fff",
            fontSize: 14, fontWeight: 600, textDecoration: "none",
          }}>İletişim Formu →</Link>
          <a href="mailto:destek@medyaizle.com" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 22px", borderRadius: 10,
            background: "var(--color-surface-2)", color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            fontSize: 14, fontWeight: 600, textDecoration: "none",
          }}>destek@medyaizle.com</a>
        </div>
      </div>
    </div>
  )
}
