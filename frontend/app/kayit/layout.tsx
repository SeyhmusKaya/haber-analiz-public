import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Medya İzle'e ücretsiz kaydolun. Yapay zeka destekli medya analizi ile haberleri farklı bakış açılarıyla okuyun.",
  robots: { index: false, follow: false },
}

export default function KayitLayout({ children }: { children: React.ReactNode }) {
  return children
}
