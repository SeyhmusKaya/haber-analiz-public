import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Haber Ara",
  description: "Medya İzle'de haber arayın. Kategoriye, ülkeye ve tarihe göre filtreleyin. Yapay zeka destekli doğal dil araması.",
  openGraph: {
    title: "Haber Ara — Medya İzle",
    description: "10 ülkeden 100 kaynakta haber arayın. Yapay zeka ile doğal dil araması.",
    type: "website",
  },
}

export default function AramaLayout({ children }: { children: React.ReactNode }) {
  return children
}
