"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getEvents } from "@/lib/api"
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

interface Props {
  initialEvents: Event[]
  initialTotal: number
  initialCategory: string
}

export default function TurkiyeHaberleriClient({ initialEvents, initialTotal, initialCategory }: Props) {
  const router = useRouter()

  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialEvents.length > 0 && initialEvents.length >= 20)
  const [currentCategory, setCurrentCategory] = useState(initialCategory)

  // SSR veri gelmezse mount'ta otomatik çek
  useEffect(() => {
    if (initialEvents.length === 0) {
      fetchMore(currentCategory === "tumu" ? "tumu" : currentCategory, 1)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMore = useCallback(async (cat: string, pg: number) => {
    setLoading(true)
    try {
      const data = await getEvents(pg, cat === "tumu" ? undefined : cat, { country: "TR", showAll: true })
      setEvents(prev => pg === 1 ? data.events : [...prev, ...data.events])
      setHasMore(data.events.length >= (data.per_page || 20))
      setPage(pg)
    } catch {
      if (pg === 1) setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  function selectCategory(key: string) {
    setCurrentCategory(key)
    setPage(1)
    setEvents([])
    if (key === "tumu") {
      router.push("/turkiyeden-haberler", { scroll: false })
    } else {
      router.push(`/turkiyeden-haberler?category=${key}`, { scroll: false })
    }
    fetchMore(key, 1)
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
      {/* Başlık */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <img
            src="https://flagcdn.com/w40/tr.png"
            alt="Türkiye"
            style={{ width: 32, height: 22, objectFit: "cover", borderRadius: 4 }}
          />
          <h1 style={{
            fontSize: "clamp(20px, 4vw, 26px)",
            fontWeight: 700,
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}>
            Türkiye&apos;den Haberler
          </h1>
        </div>
       
      </div>

      {/* Kategori pilleri */}
      <div style={{
        display: "flex", gap: 6, overflowX: "auto",
        paddingBottom: 4, marginBottom: 28,
      }} className="scrollbar-hide">
        {CATEGORIES.map(cat => {
          const isActive = currentCategory === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => selectCategory(cat.key)}
              style={{
                flexShrink: 0, height: 36, paddingInline: 16,
                borderRadius: 99, fontSize: 13,
                fontWeight: isActive ? 600 : 400, cursor: "pointer",
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
          gap: 16,
        }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              height: 240, borderRadius: "var(--radius-lg)",
              background: "var(--color-surface-2)",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))}
        </div>
      )}

      {/* Boş durum */}
      {!loading && events.length === 0 && (
        <div style={{
          textAlign: "center", padding: "80px 0",
          color: "var(--color-text-3)", fontSize: 14,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ margin: 0 }}>Bu kategoride Türkiye haberi bulunamadı.</p>
        </div>
      )}

      {/* Haberler */}
      {events.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
          gap: 16,
        }}>
          {events.map(event => (
            <NewsCard key={event.id} event={event} showSourceCount />
          ))}
        </div>
      )}

      {/* Daha fazla */}
      {hasMore && !loading && (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button
            onClick={() => fetchMore(currentCategory, page + 1)}
            style={{
              padding: "12px 32px", borderRadius: 10, fontSize: 14, fontWeight: 600,
              border: "1px solid var(--color-border)", background: "var(--color-surface)",
              color: "var(--color-text)", cursor: "pointer",
            }}
          >
            Daha Fazla Yükle
          </button>
        </div>
      )}

      {loading && page > 1 && (
        <div style={{ textAlign: "center", marginTop: 24, color: "var(--color-text-3)", fontSize: 14 }}>
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
