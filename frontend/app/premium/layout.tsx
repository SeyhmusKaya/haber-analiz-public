import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Premium Plan — Medya İzle",
  description: "Sınırsız ülke analizi, AI asistan, propaganda skoru ve daha fazlası için Pro plana geçin.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Premium Plan — Medya İzle",
    description: "Sınırsız ülke analizi, AI asistan ve propaganda skoru için Pro plana geçin.",
    type: "website",
  },
}

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return children
}
