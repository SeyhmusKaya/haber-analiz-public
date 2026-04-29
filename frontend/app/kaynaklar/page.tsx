import type { Metadata } from "next"
import KaynaklarContent from "./_KaynaklarContent"

export const metadata: Metadata = {
  title: "Haber Kaynakları | Medya İzle",
  description:
    "Medya İzle'in takip ettiği 10 ülkeden 100 haber kaynağı. Her ülkeden 5 yandaş ve 5 muhalif medya kuruluşu dengeli biçimde temsil edilmektedir.",
}

export default function KaynaklarPage() {
  return <KaynaklarContent />
}
