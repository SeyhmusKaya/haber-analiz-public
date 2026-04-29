import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/-$/, "")
}

export function eventUrl(id: number, title?: string, category?: string): string {
  if (!title) return `/haber/${id}`
  if (category) return `/haber/${category}/${id}-${slugify(title)}`
  return `/haber/${id}/${slugify(title)}`
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return "az önce"
  if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`
  return `${Math.floor(diff / 86400)} gün önce`
}

export const CATEGORY_LABELS: Record<string, string> = {
  siyaset: "Siyaset",
  ekonomi: "Ekonomi",
  "savas-catisma": "Savaş/Çatışma",
  diplomasi: "Diplomasi",
  teknoloji: "Teknoloji",
  iklim: "İklim",
  "insan-haklari": "İnsan Hakları",
  saglik: "Sağlık",
  cevre: "Çevre",
  spor: "Spor",
  kultur: "Kültür",
  diger: "Diğer",
}

export const CATEGORY_COLORS: Record<string, string> = {
  siyaset: "#ef4444",
  ekonomi: "#10b981",
  "savas-catisma": "#ef4444",
  diplomasi: "#3b82f6",
  teknoloji: "#8b5cf6",
  saglik: "#14b8a6",
  cevre: "#22c55e",
  spor: "#f59e0b",
  kultur: "#ec4899",
  diger: "#71717a",
}
