import type { Metadata } from "next"
import Link from "next/link"
import FAQAccordion from "./FAQAccordion"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://medyaizle.com"

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular | Medya İzle",
  description:
    "Medya İzle hakkında en çok merak edilen sorular ve yanıtları. Platform kullanımı, yapay zeka analizleri, üyelik ve teknik detaylar.",
  alternates: {
    canonical: `${SITE_URL}/sikca-sorulan-sorular`,
  },
  openGraph: {
    title: "Sıkça Sorulan Sorular | Medya İzle",
    description:
      "Medya İzle hakkında en çok merak edilen sorular ve yanıtları.",
    url: `${SITE_URL}/sikca-sorulan-sorular`,
    siteName: "Medya İzle",
    type: "website",
  },
}

export type FAQCategory = "genel" | "kullanim" | "yapay-zeka" | "hesap" | "teknik"

export interface FAQItem {
  question: string
  answer: string
  category: FAQCategory
}

const CATEGORIES: { key: FAQCategory; label: string; icon: string }[] = [
  { key: "genel", label: "Genel", icon: "💡" },
  { key: "kullanim", label: "Kullanım", icon: "📖" },
  { key: "yapay-zeka", label: "Yapay Zeka", icon: "🤖" },
  { key: "hesap", label: "Hesap & Üyelik", icon: "👤" },
  { key: "teknik", label: "Teknik", icon: "⚙️" },
]

const FAQ_ITEMS: FAQItem[] = [
  // === GENEL ===
  {
    category: "genel",
    question: "Medya İzle nedir?",
    answer:
      "Medya İzle, aynı haberin farklı ülkelerde nasıl yorumlandığını karşılaştırmalı olarak sunan bir haber analiz platformudur. 10 farklı ülkeden toplam 100'den fazla haber kaynağını takip ederek her ülkenin hükümete yakın (yandaş) ve muhalif medyasının aynı olaya nasıl baktığını yapay zeka ile analiz eder ve Türkçe özetler üretir.",
  },
  {
    category: "genel",
    question: "Medya İzle'nin amacı nedir?",
    answer:
      "Amacımız taraf tutmak değil, tarafları göstermektir. Herhangi bir siyasi görüşü savunmuyoruz. Okuyucuların farklı perspektifleri görerek kendi fikirlerini oluşturmasını ve medya okuryazarlığının artmasını hedefliyoruz. Sloganımız: \"Haberi değil, bakış açısını oku.\"",
  },
  {
    category: "genel",
    question: "Hangi ülkelerden haber kaynakları takip ediliyor?",
    answer:
      "Şu an 10 ülkeden kaynak takip ediyoruz: Türkiye, ABD, İngiltere, Almanya, Rusya, Çin, İran, İsrail, Suudi Arabistan ve Mısır. Her ülkeden 5 yandaş ve 5 muhalif olmak üzere toplam 100 kaynak izlenmektedir.",
  },
  {
    category: "genel",
    question: "Yandaş ve muhalif medya ne demek?",
    answer:
      "\"Yandaş medya\" (pro-government), genel olarak bulunduğu ülkenin hükümetinin politikalarını destekleyen veya ona yakın duran medya kuruluşlarını ifade eder. \"Muhalif medya\" (opposition) ise hükümet politikalarını eleştiren, bağımsız veya muhalefete yakın yayın yapan kuruluşları kapsar. Bu sınıflandırma uluslararası medya gözlemcilerinin değerlendirmelerine dayanır.",
  },
  {
    category: "genel",
    question: "Haberler ne sıklıkla güncelleniyor?",
    answer:
      "Haber kaynaklarımız her 2 saatte bir otomatik olarak taranır. Yeni haberler tespit edildiğinde yapay zeka ile gruplanır, analiz edilir ve siteye eklenir. Böylece güncel gelişmeleri en fazla birkaç saat gecikmeyle takip edebilirsiniz.",
  },
  {
    category: "genel",
    question: "Medya İzle ücretsiz mi?",
    answer:
      "Evet, Medya İzle'nin temel özellikleri tamamen ücretsizdir. Tüm haberler, ülke analizleri ve karşılaştırmalar herkes tarafından erişilebilir. Pro üyelik (aylık 79 TL) ile gelişmiş filtreler, API erişimi, öncelikli bildirimler ve ek özelliklerden yararlanabilirsiniz.",
  },

  // === KULLANIM ===
  {
    category: "kullanim",
    question: "Bir haberin farklı ülkelerdeki yorumlarını nasıl görebilirim?",
    answer:
      "Ana sayfadan veya arama sonuçlarından bir habere tıklayın. Haber detay sayfasında \"Bu haberi dünya nasıl görüyor?\" bölümünde ülke bayraklarını göreceksiniz. İlgilendiğiniz ülkenin bayrağına tıkladığınızda, o ülkenin yandaş ve muhalif medyasının haberi nasıl yorumladığı Türkçe özetler halinde görüntülenir.",
  },
  {
    category: "kullanim",
    question: "Haberleri nasıl kaydedebilirim?",
    answer:
      "Haber detay sayfasında sol kenar çubuğundaki yer imi (🔖) simgesine tıklayarak haberi kataloglarınıza kaydedebilirsiniz. Kataloglar, haberleri konularına göre düzenlemenizi sağlar. Kaydettiğiniz haberlere Profil > Kataloglarım sayfasından ulaşabilirsiniz. Bu özelliği kullanmak için giriş yapmanız gerekir.",
  },
  {
    category: "kullanim",
    question: "Bildirim ayarlarını nasıl değiştirebilirim?",
    answer:
      "Giriş yaptıktan sonra Profil > Bildirim Ayarları sayfasından hangi tür bildirimleri almak istediğinizi (yeni haber, yorum yanıtı, beğeni), hangi ülke ve kategorileri takip etmek istediğinizi ve minimum önem düzeyini belirleyebilirsiniz. Ayrıca e-posta bülten tercihlerinizi de aynı sayfadan yönetebilirsiniz.",
  },
  {
    category: "kullanim",
    question: "Haberleri sesli dinleyebilir miyim?",
    answer:
      "Evet, haber detay sayfasında \"Dinle\" butonuna tıklayarak yapay zeka özetini sesli olarak dinleyebilirsiniz. Oynatma sırasında ileri/geri 10 saniye atlama, hız ayarı (0.5x - 2x) ve duraklatma özellikleri mevcuttur. Bu özellik tarayıcınızın Web Speech API desteğine bağlıdır.",
  },
  {
    category: "kullanim",
    question: "Arama yaparken filtre kullanabilir miyim?",
    answer:
      "Evet, arama sayfasında gelişmiş filtreler sunuyoruz. Kategori (siyaset, ekonomi, savaş vb.), ülke, tarih aralığı ve önem derecesine göre filtreleme yapabilirsiniz. Ayrıca joker karakter (*) ve doğal dil araması da desteklenmektedir.",
  },
  {
    category: "kullanim",
    question: "Yorum yazmak için giriş yapmam gerekiyor mu?",
    answer:
      "Evet, yorum yazabilmek, beğeni/beğenmeme oyu kullanabilmek ve yorumlara yanıt verebilmek için hesabınızla giriş yapmanız gerekmektedir. Yorumlar en fazla 3 seviye derinliğinde iç içe (thread) yapısında gösterilir.",
  },

  // === YAPAY ZEKA ===
  {
    category: "yapay-zeka",
    question: "Yapay zeka analizleri ne kadar güvenilir?",
    answer:
      "Analizlerimiz yapay zeka tarafından üretilmektedir. Yapay zeka, kaynak haberleri okuyarak Türkçe özetler oluşturur. Ancak her yapay zeka sistemi gibi hata yapabilir, bağlamı yanlış yorumlayabilir veya nüansları kaçırabilir. Bu nedenle analizlerimizi kesin bilgi kaynağı olarak değil, farklı perspektifleri anlamaya yardımcı bir araç olarak değerlendirmenizi öneririz.",
  },
  {
    category: "yapay-zeka",
    question: "Haberler nasıl gruplanıyor?",
    answer:
      "Farklı kaynaklardan gelen haberler, yapay zeka tarafından anlambilimsel benzerliklerine göre otomatik olarak gruplanır. Aynı olayı anlatan haberler tek bir \"olay\" altında toplanır. Bu sayede bir haber hakkında düzinelerce farklı kaynağın bakış açısını tek sayfada görebilirsiniz.",
  },
  {
    category: "yapay-zeka",
    question: "AI Asistan nedir ve nasıl kullanılır?",
    answer:
      "Haber detay sayfasında sol kenardaki robot (🤖) simgesine tıklayarak AI Asistanı açabilirsiniz. Asistana haber hakkında sorular sorabilir, daha fazla bağlam isteyebilir veya karşılaştırmalı analizler talep edebilirsiniz. Ayrıca soru işareti (?) simgesiyle, yapay zekanın o haber hakkında hazırladığı 3 önemli soruyu ve yanıtlarını görebilirsiniz.",
  },
  {
    category: "yapay-zeka",
    question: "Analizlerde kullanılan dil nedir?",
    answer:
      "Tüm analizler ve özetler Türkçe olarak üretilir. Orijinal haberler İngilizce, Almanca, Rusça, Çince, Arapça, Farsça veya İbranice olabilir; ancak yapay zeka bunları analiz edip Türkçe özet olarak sunar.",
  },
  {
    category: "yapay-zeka",
    question: "Propaganda ve yanlılık skorları nasıl hesaplanıyor?",
    answer:
      "Her analiz için yapay zeka dört farklı metrik hesaplar: propaganda düzeyi, duygusal yoğunluk, olgusal içerik oranı ve kaynak çeşitliliği. Ayrıca kullanılan retorik teknikler (korkutma, duygusal çağrı, genelleme vb.) tespit edilerek etiketlenir. Bu skorlar, medya okuryazarlığına katkı sağlamak amacıyla sunulmaktadır.",
  },

  // === HESAP & UYELIK ===
  {
    category: "hesap",
    question: "Nasıl hesap oluşturabilirim?",
    answer:
      "Sağ üst köşedeki \"Giriş\" butonuna tıklayıp açılan sayfada \"Hesap Oluştur\" seçeneğini kullanabilirsiniz. Kullanıcı adı, e-posta adresi ve şifre ile kayıt olabilirsiniz. Kayıt tamamen ücretsizdir.",
  },
  {
    category: "hesap",
    question: "Şifremi unuttum, ne yapmalıyım?",
    answer:
      "Giriş sayfasındaki \"Şifremi Unuttum\" bağlantısına tıklayarak kayıtlı e-posta adresinize şifre sıfırlama bağlantısı gönderebilirsiniz. Bağlantı 24 saat geçerlidir. Eğer e-posta ulaşmıyorsa spam/gereksiz klasörünü kontrol edin veya destek@medyaizle.com adresinden bize ulaşın.",
  },
  {
    category: "hesap",
    question: "Verilerim güvende mi?",
    answer:
      "Evet, kullanıcı verilerinizin güvenliği bizim için önceliklidir. Şifreler bcrypt algoritmasıyla hashlenerek saklanır, oturumlar JWT token ile yönetilir. Kişisel verileriniz üçüncü taraflarla paylaşılmaz. KVKK (Kişisel Verilerin Korunması Kanunu) kapsamındaki haklarınız hakkında Gizlilik Politikası sayfamızdan detaylı bilgi alabilirsiniz.",
  },
  {
    category: "hesap",
    question: "Pro üyelik ne gibi avantajlar sağlıyor?",
    answer:
      "Pro üyelik (aylık 79 TL) ile gelişmiş arama filtreleri, öncelikli bildirimler, API erişimi, reklamsız deneyim ve haftalık/aylık detaylı AI raporlarına tam erişim gibi ek özelliklerden yararlanabilirsiniz. Temel analizler ve karşılaştırmalar ücretsiz planda da mevcuttur.",
  },
  {
    category: "hesap",
    question: "Hesabımı nasıl silebilirim?",
    answer:
      "Profil > Ayarlar sayfasının alt kısmındaki \"Hesabı Sil\" bölümünden hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz; tüm verileriniz (kataloglar, yorumlar, bildirim ayarları) kalıcı olarak kaldırılır. Silme işlemi öncesinde şifre doğrulaması istenir.",
  },

  // === TEKNIK ===
  {
    category: "teknik",
    question: "API erişimi var mı?",
    answer:
      "Evet, Medya İzle Public API ile haber verilerine, analizlere ve gerilim endeksine programatik olarak erişebilirsiniz. API dokümantasyonuna /api-docs sayfasından ulaşabilirsiniz. Ücretsiz planda günlük istek limiti uygulanır; Pro üyelikle daha yüksek limitlerden yararlanabilirsiniz.",
  },
  {
    category: "teknik",
    question: "Medya İzle hangi teknolojileri kullanıyor?",
    answer:
      "Frontend Next.js 14 (React), backend Laravel 11 (PHP), veritabanı PostgreSQL (pgvector eklentisi ile), önbellekleme Redis, yapay zeka Google Gemini API, embedding Gemini Embedding API ile geliştirilmiştir. Mobil uygulama Flutter WebView tabanlıdır.",
  },
  {
    category: "teknik",
    question: "Site hangi tarayıcıları destekliyor?",
    answer:
      "Medya İzle, Chrome, Firefox, Safari ve Edge tarayıcılarının güncel sürümlerinde en iyi deneyimi sunar. Internet Explorer desteklenmemektedir. Mobil cihazlarda hem iOS Safari hem de Android Chrome üzerinden sorunsuz kullanılabilir.",
  },
  {
    category: "teknik",
    question: "Bir hata buldum veya önerim var, nasıl iletebilirim?",
    answer:
      "İletişim sayfamızdan veya doğrudan destek@medyaizle.com adresinden bize ulaşabilirsiniz. Hata bildirimi yaparken hangi sayfada, hangi tarayıcıda ve ne yaptığınızda hatanın oluştuğunu belirtirseniz çözüm sürecini hızlandırmış olursunuz. Her geri bildirim bizim için değerlidir.",
  },
]

// Build JSON-LD for FAQ rich results
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
}

export default function SSSSayfasi() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(139,92,246,0.08) 50%, rgba(236,72,153,0.06) 100%)",
          borderBottom: "1px solid var(--color-border)",
          padding: "64px 16px 56px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 50%, #8b5cf6 0%, transparent 50%)",
          }}
        />
        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(37,99,235,0.1)",
              border: "1px solid rgba(37,99,235,0.2)",
              borderRadius: 99,
              padding: "6px 16px",
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 13 }}>❓</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-accent)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              SSS
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 800,
              color: "var(--color-text)",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              marginBottom: 20,
            }}
          >
            Sıkça Sorulan{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Sorular
            </span>
          </h1>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.7,
              color: "var(--color-text-2)",
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            Medya İzle hakkında merak ettiğiniz her şey. Aradığınız yanıtı
            bulamadıysanız bize ulaşmaktan çekinmeyin.
          </p>
        </div>
      </div>

      {/* FAQ Content (Client Component) */}
      <FAQAccordion items={FAQ_ITEMS} categories={CATEGORIES} />

      {/* CTA */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px 80px" }}>
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(139,92,246,0.08))",
            border: "1px solid rgba(37,99,235,0.2)",
            borderRadius: 24,
            padding: "48px 32px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "var(--color-text)",
              marginBottom: 12,
              letterSpacing: "-0.02em",
            }}
          >
            Aradığınız yanıtı bulamadınız mı?
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "var(--color-text-2)",
              marginBottom: 28,
            }}
          >
            Ekibimiz size yardımcı olmaktan memnuniyet duyar.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/iletisim"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 28px",
                borderRadius: 12,
                background: "var(--color-accent)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Bize Ulaşın
            </Link>
            <a
              href="mailto:destek@medyaizle.com"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 28px",
                borderRadius: 12,
                background: "var(--color-surface)",
                color: "var(--color-text)",
                border: "1px solid var(--color-border)",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              destek@medyaizle.com
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
