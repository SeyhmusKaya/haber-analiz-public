"use client"

import { Suspense } from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getEvents } from "@/lib/api"
import NewsCard from "@/components/NewsCard"
import SiteChatbot from "@/components/SiteChatbot"
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

function DunyaHaberleriContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const catParam = searchParams.get("category") || "tumu"

  const [events, setEvents] = useState<Event[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchEvents = useCallback(async (cat: string, pg: number) => {
    setLoading(true)
    try {
      const data = await getEvents(pg, cat === "tumu" ? undefined : cat)
      if (pg === 1) {
        setEvents(data.events)
      } else {
        setEvents(prev => [...prev, ...data.events])
      }
      setTotal(data.total)
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
      router.push("/dunyadan-haberler")
    } else {
      router.push(`/dunyadan-haberler?category=${key}`)
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <h1 style={{
          fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 700, color: "var(--color-text)",
          letterSpacing: "-0.02em", margin: 0,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          🌍 Dünyadan Haberler
        </h1>
        <span style={{ fontSize: 12, color: "var(--color-text-3)", fontWeight: 400 }}>
          {total > 0 && `${total} haber`}
        </span>
      </div>

      {/* Kategori filtreleri */}
      <div style={{
        display: "flex", gap: 6, overflowX: "auto",
        paddingBottom: 4, marginBottom: 24,
      }} className="scrollbar-hide">
        {CATEGORIES.map(cat => {
          const isActive = catParam === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => selectCategory(cat.key)}
              style={{
                flexShrink: 0, height: 34, paddingInline: 16,
                borderRadius: 99, fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer", transition: "all 0.15s ease",
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
          {Array.from({ length: 9 }).map((_, i) => (
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

      {/* Haber grid */}
      {(!loading || page > 1) && events.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
          gap: 20,
        }}>
          {events.map(event => (
            <NewsCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Boş durum */}
      {!loading && events.length === 0 && (
        <div style={{
          textAlign: "center", paddingBlock: 80,
          color: "var(--color-text-3)", fontSize: 14,
        }}>
          Bu kategoride henüz haber yok.
        </div>
      )}

      {/* Daha fazla yükle */}
      {hasMore && !loading && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <button
            onClick={() => fetchEvents(catParam, page + 1)}
            style={{
              height: 42, paddingInline: 28, fontSize: 14, fontWeight: 500,
              background: "var(--color-surface)", color: "var(--color-text-2)",
              border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
              cursor: "pointer", transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-2)" }}
          >
            Daha Fazla Yükle ({total - events.length} haber)
          </button>
        </div>
      )}

      {loading && page > 1 && (
        <div style={{ textAlign: "center", padding: 24, color: "var(--color-text-3)" }}>
          Yükleniyor...
        </div>
      )}

      <SiteChatbot />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default function DunyaHaberleriPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--color-text-3)" }}>Yükleniyor...</div>}>
      <DunyaHaberleriContent />
    </Suspense>
  )
}
