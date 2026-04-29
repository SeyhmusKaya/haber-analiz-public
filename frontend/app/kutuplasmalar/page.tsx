"use client"

import { Suspense } from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getEvents } from "@/lib/api"
import { CATEGORY_LABELS } from "@/lib/utils"
import NewsCard from "@/components/NewsCard"
import { Event } from "@/types"

const CATEGORIES = [
  { key: "tumu", label: "Tümü" },
  { key: "siyaset", label: "Siyaset" },
  { key: "ekonomi", label: "Ekonomi" },
  { key: "savas-catisma", label: "Savaş" },
  { key: "diplomasi", label: "Diplomasi" },
  { key: "teknoloji", label: "Teknoloji" },
  { key: "saglik", label: "Sağlık" },
  { key: "cevre", label: "Çevre" },
  { key: "spor", label: "Spor" },
  { key: "kultur", label: "Kültür" },
  { key: "diger", label: "Diğer" },
]

function KutupласmalarContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const catParam = searchParams.get("category") || "tumu"

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchEvents = useCallback(async (cat: string, pg: number) => {
    setLoading(true)
    try {
      const data = await getEvents(pg, cat === "tumu" ? undefined : cat, undefined, true)
      if (pg === 1) {
        setEvents(data.events)
      } else {
        setEvents(prev => [...prev, ...data.events])
      }
      setHasMore(data.events.length >= data.per_page)
      setPage(pg)
    } catch {
      if (pg === 1) setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents(catParam, 1)
  }, [catParam, fetchEvents])

  function selectCategory(key: string) {
    if (key === "tumu") {
      router.push("/kutuplasmalar")
    } else {
      router.push(`/kutuplasmalar?category=${key}`)
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
      {/* Başlık */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
        <img src="https://flagcdn.com/20x15/tr.png" alt="TR" style={{ height: 16, borderRadius: 1, verticalAlign: "middle", flexShrink: 0 }} />
        <h1 style={{
          fontSize: "clamp(20px, 4vw, 26px)",
          fontWeight: 700,
          color: "var(--color-text)",
          letterSpacing: "-0.02em",
          margin: 0,
        }}>
          Türkiye&apos;deki Kutuplaşmalar
        </h1>
      </div>

      {/* Kategori pilleri */}
      <div style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        paddingBottom: 4,
        marginBottom: 28,
      }} className="scrollbar-hide">
        {CATEGORIES.map(cat => {
          const isActive = catParam === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => selectCategory(cat.key)}
              style={{
                flexShrink: 0,
                height: 36,
                paddingInline: 16,
                borderRadius: 99,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s ease",
                border: isActive ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                background: isActive ? "var(--color-accent)" : "transparent",
                color: isActive ? "#fff" : "var(--color-text-2)",
                whiteSpace: "nowrap",
              }}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Skeleton */}
      {loading && page === 1 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
          gap: 20,
        }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              height: 260,
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))}
        </div>
      )}

      {/* Haberler */}
      {(!loading || page > 1) && events.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
          gap: 20,
        }}>
          {events.map(event => (
            <NewsCard key={event.id} event={event} showTrBiasBadge showSourceCount />
          ))}
        </div>
      )}

      {/* Boş */}
      {!loading && events.length === 0 && (
        <div style={{
          textAlign: "center", paddingBlock: 80,
          color: "var(--color-text-3)", fontSize: 14,
        }}>
          Bu kategoride henüz kutuplaşma haberi yok.
        </div>
      )}

      {/* Daha fazla */}
      {hasMore && !loading && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <button
            onClick={() => fetchEvents(catParam, page + 1)}
            style={{
              padding: "12px 32px", fontSize: 14, fontWeight: 600,
              background: "var(--color-surface)", color: "var(--color-text)",
              border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
              cursor: "pointer",
            }}
          >
            Daha Fazla Yükle
          </button>
        </div>
      )}

      {loading && page > 1 && (
        <div style={{ textAlign: "center", padding: 24, color: "var(--color-text-3)" }}>
          Yükleniyor...
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default function KutuplasmalarPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--color-text-3)" }}>Yükleniyor...</div>}>
      <KutupласmalarContent />
    </Suspense>
  )
}
