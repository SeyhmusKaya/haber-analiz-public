import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Propaganda Teknikleri | Medya İzle",
  description: "Medyada kullanılan 10 temel propaganda tekniğini tanıyın.",
}

interface Technique {
  name: string
  description: string
  example: string
}

const TECHNIQUES: Technique[] = [
  {
    name: "Korku Yaratma",
    description:
      "Okuyucuda korku ve endişe uyandırarak belirli bir görüşü benimsemesini sağlamak. Tehlike ve kriz vurgusu yapılır.",
    example:
      "\"Sınırlarımız tehlike altında! Önlem alınmazsa ülkemiz büyük bir felaket yaşayacak.\"",
  },
  {
    name: "Milliyetçilik Pompası",
    description:
      "Ulusal gurur ve vatanseverlik duygularını suistimal ederek eleştiriyi susturmak. Eleştiri yapanlar 'vatan haini' olarak etiketlenir.",
    example:
      "\"Bu konuda hükümeti eleştirmek düşmanların ekmeğine yağ sürmektir.\"",
  },
  {
    name: "Whataboutism",
    description:
      "Bir eleştiriye başka bir konuyu göstererek yanıt vermek. Asıl meseleyi saptırmak için kullanılır.",
    example:
      "\"Biz insan hakları ihlali mi yapıyormuşuz? Ya onlar ne yapıyor bakın!\"",
  },
  {
    name: "Kişisel Saldırı",
    description:
      "Argümanla değil, argümanın sahibiyle uğraşarak karşı tarafın güvenilirliğini sarsmak.",
    example:
      "\"Bu profesörün söylediklerine neden güvenelim ki, kendisi yıllarca yurt dışında yaşadı.\"",
  },
  {
    name: "Yanıltıcı Başlık",
    description:
      "Haberin içeriğiyle uyuşmayan sansasyonel başlıklar kullanarak tıklanma oranını artırmak.",
    example:
      "Başlık: \"Ekonomi Çöktü!\" - Haber içeriği: Bir gösterge %0.5 düştü.",
  },
  {
    name: "Seçici Alıntı",
    description:
      "Bir konuşmanın veya metnin sadece işe yarayan kısmını alıntılayarak bağlamından koparmak.",
    example:
      "Siyasetçinin \"Bu şartlarda kabul edilemez\" sözünün hangi bağlamda söylendiği atlanır.",
  },
  {
    name: "Düşmanlaştırma",
    description:
      "Belirli bir grubu, ülkeyi veya ideolojiyi sürekli düşman olarak göstererek toplumda kutuplaşmaya yol açmak.",
    example:
      "\"X ülkesi her zaman bize komplo kurar, onlara asla güvenilmez.\"",
  },
  {
    name: "Abartma",
    description:
      "Olgusuz iddiaları büyüterek gerçeklikten koparılan bir tablo çizmek.",
    example:
      "\"Tarihte eşine rastlanmamış en büyük kriz\" gibi superlatiflerin gereksiz kullanımı.",
  },
  {
    name: "Duygusal Manipülasyon",
    description:
      "Rasyonel tartışma yerine okuyucunun duygularına hitap ederek kanaat oluşturmak. Çocuk, yaşlı, hayvan görselleri sıkça kullanılır.",
    example:
      "\"Bu masum çocukların göz yaşlarını görmezden mi geleceksiniz?\" diyerek politik bir pozisyon dayatmak.",
  },
  {
    name: "Tekrarlama",
    description:
      "Aynı mesajı farklı formatlarda sürekli tekrarlayarak doğru gibi algılanmasını sağlamak.",
    example:
      "Aynı iddia gün boyunca farklı programlarda, farklı yorumcular tarafından tekrarlanır.",
  },
]

export default function PropagandaPage() {
  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      <Link
        href="/medya-okuryazarligi"
        style={{
          fontSize: "14px",
          color: "var(--color-accent)",
          textDecoration: "none",
          display: "inline-block",
          marginBottom: "20px",
        }}
      >
        &larr; Medya Okuryazarlığı
      </Link>

      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "var(--color-text)",
          marginBottom: "8px",
        }}
      >
        Propaganda Teknikleri
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "var(--color-text-2)",
          marginBottom: "32px",
          lineHeight: 1.6,
        }}
      >
        Medyada sıkça kullanılan 10 temel propaganda tekniği. Bunları tanıyarak haberleri daha eleştirel bir gözle okuyabilirsiniz.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {TECHNIQUES.map((tech, i) => (
          <div
            key={tech.name}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                {tech.name}
              </h2>
            </div>

            <p
              style={{
                margin: "0 0 12px 0",
                fontSize: "15px",
                color: "var(--color-text-2)",
                lineHeight: 1.7,
              }}
            >
              {tech.description}
            </p>

            <div
              style={{
                background: "var(--color-surface-2)",
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
                borderLeft: "3px solid var(--color-accent)",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--color-text-3)",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.5px",
                }}
              >
                Örnek
              </span>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "14px",
                  color: "var(--color-text-2)",
                  fontStyle: "italic",
                  lineHeight: 1.6,
                }}
              >
                {tech.example}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
