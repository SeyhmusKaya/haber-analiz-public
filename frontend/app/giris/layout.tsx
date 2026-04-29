import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Medya İzle'e giriş yapın. Yapay zeka destekli medya analizi, propaganda skoru ve AI chat özelliklerine erişin.",
  robots: { index: false, follow: false },
}

export default function GirisLayout({ children }: { children: React.ReactNode }) {
  return children
}
