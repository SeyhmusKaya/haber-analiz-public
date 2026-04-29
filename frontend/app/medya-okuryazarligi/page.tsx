import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Medya Okuryazarlığı | Medya İzle",
  description: "Medya okuryazarlığı rehberi: propaganda tespiti, medya yanlılığı, kaynak doğrulama ve dezenformasyon hakkında bilgi edinin.",
}

const CARDS = [
  {
    icon: "\u{1F50D}",
    title: "Propaganda Tespiti",
    description: "Medyada kullanılan 10 temel propaganda tekniğini tanıyın ve haberlerde nasıl karşınıza çıktığını öğrenin.",
    href: "/medya-okuryazarligi/propaganda",
  },
  {
    icon: "\u2696\uFE0F",
    title: "Medya Yanlılığı",
    description: "Haber kaynaklarının siyasi yanlılıkları, editoryal politikaları ve sahiplik yapıları hakkında bilgi edinin.",
    href: "/medya-okuryazarligi/yanlilik",
  },
  {
    icon: "\u2705",
    title: "Kaynak Doğrulama",
    description: "Bir haberin güvenilirliğini nasıl kontrol edebileceğinizi adım adım öğrenin.",
    href: "/medya-okuryazarligi/dogrulama",
  },
  {
    icon: "\u26A0\uFE0F",
    title: "Dezenformasyon",
    description: "Yanlış bilgi, dezenformasyon ve malinformasyon arasındaki farkları ve bunlara karşı nasıl korunacağınızı keşfedin.",
    href: "/medya-okuryazarligi/dezenformasyon",
  },
]

export default function MedyaOkuryazarligiPage() {
  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "var(--color-text)",
          marginBottom: "8px",
        }}
      >
        Medya Okuryazarlığı
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "var(--color-text-2)",
          marginBottom: "32px",
          lineHeight: 1.6,
        }}
      >
        Haberleri daha bilinçli okumak için ihtiyacınız olan araçlar ve bilgiler.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
          gap: "20px",
        }}
      >
        {CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            style={{
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
                transition: "border-color 200ms ease, box-shadow 200ms ease",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "32px" }}>{card.icon}</span>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                {card.title}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "var(--color-text-2)",
                  lineHeight: 1.6,
                }}
              >
                {card.description}
              </p>
              <span
                style={{
                  marginTop: "auto",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--color-accent)",
                }}
              >
                Devamını oku &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
