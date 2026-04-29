import type { Metadata } from "next"
import { Suspense } from "react"
import { getEvents, getGundemEvents } from "@/lib/api"
import NewsList from "@/components/NewsList"
import CategoryFilter from "@/components/CategoryFilter"
import SiteChatbot from "@/components/SiteChatbot"

export const metadata: Metadata = {
  title: "Dünya Gündemi | Medya İzle",
  description: "Birden fazla ülkenin medyasında yer alan güncel dünya haberleri. Kategori bazlı filtreleme ile istediğiniz konuyu takip edin.",
}

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function GundemPage({ searchParams }: PageProps) {
  const { category } = await searchParams

  let initialEvents: import("@/types").Event[] = []
  let initialTotal = 0

  try {
    const data = category ? await getEvents(1, category) : await getGundemEvents()
    initialEvents = data.events
    initialTotal = data.total
  } catch {
    // Backend not running
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
      <div style={{
        marginTop: 24, marginBottom: 20,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <h1 style={{
          fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 700, color: "var(--color-text)",
          letterSpacing: "-0.02em", margin: 0,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          🗞️ Dünya Gündemi
        </h1>
       
      </div>

      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
      }}>
        <Suspense fallback={null}>
          <CategoryFilter baseHref="/gundem" exclude={["gundem"]} />
        </Suspense>

        {initialEvents.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", paddingBlock: 80, gap: 12, textAlign: "center",
          }}>
            <span style={{ fontSize: 48 }}>🌍</span>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)" }}>
              Henüz haber yok
            </h2>
            <p style={{ fontSize: 14, color: "var(--color-text-3)", maxWidth: 320 }}>
              Bu kategoride henüz birden fazla ülkeden haber bulunmuyor.
            </p>
          </div>
        ) : (
          <NewsList
            key={category ?? "tumu"}
            initialEvents={initialEvents}
            initialTotal={initialTotal}
            category={category}
            useGundem={!category}
          />
        )}
      </div>

      <SiteChatbot />
    </div>
  )
}
