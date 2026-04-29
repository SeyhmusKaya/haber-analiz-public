"use client"

import { Suspense } from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Event } from "@/types"
import { getEvents } from "@/lib/api"
import { CATEGORY_LABELS } from "@/lib/utils"
import NewsCard from "@/components/NewsCard"
import SiteChatbot from "@/components/SiteChatbot"

const CATEGORIES = [
  "siyaset",
  "ekonomi",
  "savas-catisma",
  "diplomasi",
  "teknoloji",
  "saglik",
  "cevre",
  "spor",
  "kultur",
]

const COUNTRY_OPTIONS = [
  { code: "TR", name: "Türkiye" },
  { code: "US", name: "ABD" },
  { code: "GB", name: "İngiltere" },
  { code: "DE", name: "Almanya" },
  { code: "RU", name: "Rusya" },
  { code: "CN", name: "Çin" },
  { code: "IR", name: "İran" },
  { code: "IL", name: "İsrail" },
  { code: "SA", name: "Suudi Arabistan" },
  { code: "EG", name: "Mısır" },
]

function flagUrl(code: string) {
  return `https://flagcdn.com/w20/${code.toLowerCase()}.png`
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 160,
          background: "var(--color-border)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          style={{
            height: 14,
            width: "40%",
            background: "var(--color-border)",
            borderRadius: 6,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 18,
            width: "90%",
            background: "var(--color-border)",
            borderRadius: 6,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 14,
            width: "70%",
            background: "var(--color-border)",
            borderRadius: 6,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  )
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${escaped})`, "gi")
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        style={{
          background: "rgba(37, 99, 235, 0.25)",
          color: "inherit",
          borderRadius: 2,
          padding: "0 2px",
        }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  )
}

function AramaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const qParam = searchParams.get("q") || ""
  const categoryParam = searchParams.get("category") || ""
  const countryParam = searchParams.get("country") || ""
  const sortParam = searchParams.get("sort") || "tarih"

  const [query, setQuery] = useState(qParam)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? categoryParam.split(",") : []
  )
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    countryParam ? countryParam.split(",") : []
  )
  const [sort, setSort] = useState(sortParam)
  const [events, setEvents] = useState<Event[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const updateUrl = useCallback(
    (q: string, cats: string[], countries: string[], s: string) => {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (cats.length > 0) params.set("category", cats.join(","))
      if (countries.length > 0) params.set("country", countries.join(","))
      if (s && s !== "tarih") params.set("sort", s)
      const qs = params.toString()
      router.replace(`/arama${qs ? `?${qs}` : ""}`, { scroll: false })
    },
    [router]
  )

  const doSearch = useCallback(
    async (q: string, cats: string[], countries: string[], s: string, pg: number) => {
      setLoading(true)
      setSearched(true)
      try {
        const sortMap: Record<string, string> = { onem: "importance", eski: "oldest" }
        const data = await getEvents(pg, cats.length > 0 ? cats.join(",") : undefined, {
          search: q || undefined,
          country: countries.length > 0 ? countries.join(",") : undefined,
          sort: sortMap[s] || undefined,
          showAll: true,
        })

        if (pg === 1) {
          setEvents(data.events)
        } else {
          setEvents((prev) => [...prev, ...data.events])
        }
        setTotal(data.total)
        setHasMore(data.events.length >= data.per_page)
        setPage(pg)
      } catch (err) {
        console.error("doSearch error:", err)
        if (pg === 1) setEvents([])
        setTotal(0)
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Run search on URL param changes
  useEffect(() => {
    const q = searchParams.get("q") || ""
    const cats = searchParams.get("category")
      ? searchParams.get("category")!.split(",")
      : []
    const countries = searchParams.get("country")
      ? searchParams.get("country")!.split(",")
      : []
    const s = searchParams.get("sort") || "tarih"

    setQuery(q)
    setSelectedCategories(cats)
    setSelectedCountries(countries)
    setSort(s)

    if (q || cats.length > 0 || countries.length > 0) {
      doSearch(q, cats, countries, s, 1)
    } else {
      setSearched(false)
      setEvents([])
      setTotal(0)
      setHasMore(false)
    }
  }, [searchParams, doSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrl(query, selectedCategories, selectedCountries, sort)
  }

  const toggleCategory = (cat: string) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat]
    setSelectedCategories(next)
    updateUrl(query, next, selectedCountries, sort)
  }

  const toggleCountry = (code: string) => {
    const next = selectedCountries.includes(code)
      ? selectedCountries.filter((c) => c !== code)
      : [...selectedCountries, code]
    setSelectedCountries(next)
    updateUrl(query, selectedCategories, next, sort)
  }

  const handleSortChange = (value: string) => {
    setSort(value)
    updateUrl(query, selectedCategories, selectedCountries, value)
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedCountries([])
    setSort("tarih")
    updateUrl(query, [], [], "tarih")
  }

  const activeFilterCount = selectedCategories.length + selectedCountries.length + (sort !== "tarih" ? 1 : 0)

  const loadMore = () => {
    doSearch(qParam, selectedCategories, selectedCountries, sort, page + 1)
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
      {/* Page title */}
      <h1
        style={{
          fontSize: "clamp(22px, 5vw, 28px)",
          fontWeight: 700,
          color: "var(--color-text)",
          marginBottom: 20,
          letterSpacing: "-0.02em",
        }}
      >
        Arama
      </h1>

      {/* Search form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <div className="mobile-stack" style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Haber ara..."
              style={{
                width: "100%",
                padding: "14px 48px 14px 16px",
                fontSize: 16,
                background: "var(--color-surface)",
                border: "2px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                color: "var(--color-text)",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-border)")
              }
            />
            <span
              style={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 20,
                color: "var(--color-text-3)",
                pointerEvents: "none",
              }}
            >
              &#128269;
            </span>
          </div>
          <button
            type="submit"
            style={{
              padding: "14px 28px",
              fontSize: 15,
              fontWeight: 600,
              background: "var(--color-accent)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-lg)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Ara
          </button>
        </div>

        {/* Info note */}
        <p
          style={{
            fontSize: 12,
            color: "var(--color-text-3)",
            marginTop: 8,
            fontStyle: "italic",
          }}
        >
          Wildcard kullanabilirsiniz: * ve ?
        </p>
      </form>

      {/* Filters panel */}
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 24,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>Filtreler</span>
            {activeFilterCount > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#fff", background: "var(--color-accent)",
                padding: "2px 8px", borderRadius: 99,
              }}>{activeFilterCount}</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} style={{
                fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 500,
              }}>Filtreleri Temizle</button>
            )}
          </div>
        </div>

        {/* Kategoriler */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-3)", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
            Kategoriler
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button
              type="button"
              onClick={() => { setSelectedCategories([]); updateUrl(query, [], selectedCountries, sort) }}
              style={{
                padding: "6px 14px", fontSize: 13, fontWeight: selectedCategories.length === 0 ? 600 : 400,
                background: selectedCategories.length === 0 ? "var(--color-accent)" : "transparent",
                color: selectedCategories.length === 0 ? "#fff" : "var(--color-text-2)",
                border: `1px solid ${selectedCategories.length === 0 ? "var(--color-accent)" : "var(--color-border)"}`,
                borderRadius: 99, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              Tümü
            </button>
            {CATEGORIES.map((cat) => {
              const active = selectedCategories.includes(cat)
              return (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)} style={{
                  padding: "6px 14px", fontSize: 13, fontWeight: active ? 600 : 400,
                  background: active ? "var(--color-accent)" : "transparent",
                  color: active ? "#fff" : "var(--color-text-2)",
                  border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                  borderRadius: 99, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
                }}>
                  {CATEGORY_LABELS[cat] || cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Ülkeler (çoklu seçim) */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-3)", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
            Ülkeler
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button
              type="button"
              onClick={() => { setSelectedCountries([]); updateUrl(query, selectedCategories, [], sort) }}
              style={{
                padding: "6px 14px", fontSize: 13, fontWeight: selectedCountries.length === 0 ? 600 : 400,
                background: selectedCountries.length === 0 ? "rgba(37,99,235,0.12)" : "transparent",
                color: selectedCountries.length === 0 ? "var(--color-accent)" : "var(--color-text-2)",
                border: `1px solid ${selectedCountries.length === 0 ? "var(--color-accent)" : "var(--color-border)"}`,
                borderRadius: 99, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              Tümü
            </button>
            {COUNTRY_OPTIONS.map((c) => {
              const active = selectedCountries.includes(c.code)
              return (
                <button key={c.code} type="button" onClick={() => toggleCountry(c.code)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", fontSize: 13, fontWeight: active ? 600 : 400,
                  background: active ? "rgba(37,99,235,0.12)" : "transparent",
                  color: active ? "var(--color-accent)" : "var(--color-text-2)",
                  border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                  borderRadius: 99, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
                }}>
                  <img src={flagUrl(c.code)} alt={c.code} style={{ width: 18, height: 13, objectFit: "cover", borderRadius: 2 }} />
                  {c.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sıralama */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-3)", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
            Sıralama
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { value: "tarih", label: "En Yeni" },
              { value: "onem", label: "Önem Derecesi" },
            ].map((opt) => {
              const active = sort === opt.value
              return (
                <button key={opt.value} type="button" onClick={() => handleSortChange(opt.value)} style={{
                  padding: "6px 14px", fontSize: 13, fontWeight: active ? 600 : 400,
                  background: active ? "var(--color-accent)" : "transparent",
                  color: active ? "#fff" : "var(--color-text-2)",
                  border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                  borderRadius: 99, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
                }}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Results info */}
      {searched && !loading && (
        <p
          style={{
            fontSize: 14,
            color: "var(--color-text-2)",
            marginBottom: 20,
          }}
        >
          <strong style={{ color: "var(--color-text)" }}>{total}</strong> sonuç
          bulundu
          {qParam && (
            <span>
              {" "}
              &mdash; &ldquo;
              <strong style={{ color: "var(--color-accent)" }}>{qParam}</strong>
              &rdquo;
            </span>
          )}
        </p>
      )}

      {/* Loading skeleton */}
      {loading && page === 1 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
            gap: 20,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Results grid */}
      {!loading || page > 1 ? (
        <>
          {events.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
                gap: 20,
              }}
            >
              {events.map((event) => (
                <NewsCard key={event.id} event={event} />
              ))}
            </div>
          ) : !searched && !loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingBlock: 80,
                gap: 12,
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: 48, opacity: 0.4 }}>🔍</span>
              <p style={{ fontSize: 15, color: "var(--color-text-3)", maxWidth: 360 }}>
                Lütfen filtrelerinizi seçip haberi aramaya başlayın.
              </p>
            </div>
          ) : (
            searched &&
            !loading && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingBlock: 80,
                  gap: 12,
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 48, opacity: 0.5 }}>🔍</span>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--color-text)",
                  }}
                >
                  Sonuç bulunamadı
                </h2>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--color-text-3)",
                    maxWidth: 360,
                  }}
                >
                  Farklı anahtar kelimeler veya filtreler deneyin.
                </p>
              </div>
            )
          )}

          {/* Load more */}
          {hasMore && events.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
              <button
                onClick={loadMore}
                disabled={loading}
                style={{
                  padding: "12px 32px",
                  fontSize: 14,
                  fontWeight: 600,
                  background: "var(--color-surface)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
              >
                {loading ? "Yükleniyor..." : "Daha Fazla Yükle"}
              </button>
            </div>
          )}
        </>
      ) : null}


      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default function AramaPage() {
  return (
    <>
      <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--color-text-3)" }}>Yükleniyor...</div>}>
        <AramaContent />
      </Suspense>
      <SiteChatbot />
    </>
  )
}
