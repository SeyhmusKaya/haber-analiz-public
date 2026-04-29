"use client"

import { useState, useCallback, useEffect } from "react"
import { Event } from "@/types"
import NewsCard from "./NewsCard"
import { SkeletonCard } from "./LoadingSpinner"
import { getEvents, getGundemEvents } from "@/lib/api"

interface Props {
  initialEvents: Event[]
  initialTotal: number
  category?: string
  useGundem?: boolean  // true → /api/events/gundem endpoint kullan
}

export default function NewsList({ initialEvents, initialTotal, category, useGundem }: Props) {
  const [events, setEvents] = useState(initialEvents)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // SSR veri gelmezse mount'ta otomatik çek (retry with delay)
  useEffect(() => {
    if (initialEvents.length === 0) {
      const attempt = (delay: number) => {
        setLoading(true)
        const fetch = useGundem ? getGundemEvents() : getEvents(1, category)
        fetch
          .then(data => {
            if (data.events.length > 0) {
              setEvents(data.events)
              setTotal(data.total)
            } else if (delay < 8000) {
              setTimeout(() => attempt(delay * 2), delay)
            }
          })
          .catch(() => { if (delay < 8000) setTimeout(() => attempt(delay * 2), delay) })
          .finally(() => setLoading(false))
      }
      attempt(1000)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(async () => {
    setLoading(true)
    try {
      const next = page + 1
      const data = await getEvents(next, category)
      setEvents(prev => [...prev, ...data.events])
      setTotal(data.total)
      setPage(next)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, category])

  const hasMore = events.length < total

  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
        gap: 16,
      }}>
        {events.map((event, i) => (
          <div key={event.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i % 20, 9) * 30}ms`, display: "flex" }}>
            <NewsCard event={event} />
          </div>
        ))}
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>

      {hasMore && !loading && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
          <button
            onClick={loadMore}
            style={{
              height: 42,
              paddingInline: 28,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text-2)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.borderColor = "var(--color-accent)"
              el.style.color = "var(--color-accent)"
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.borderColor = "var(--color-border)"
              el.style.color = "var(--color-text-2)"
            }}
          >
            Daha Fazla Yükle ({total - events.length} haber)
          </button>
        </div>
      )}

      {!hasMore && events.length > 0 && (
        <p style={{ textAlign: "center", marginTop: 40, fontSize: 13, color: "var(--color-text-3)" }}>
          Tüm {total} haber gösterildi
        </p>
      )}
    </div>
  )
}
