"use client"

import { useRouter, useSearchParams } from "next/navigation"

const categories = [
  { key: "tumu", label: "Tümü" },
  { key: "gundem", label: "Dünya Gündemi" },
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

export default function CategoryFilter({ sidebar, baseHref, exclude }: { sidebar?: boolean; baseHref?: string; exclude?: string[] } = {}) {
  const router = useRouter()
  const params = useSearchParams()
  const current = params.get("category") || "tumu"

  const visibleCategories = exclude ? categories.filter(c => !exclude.includes(c.key)) : categories

  function select(key: string) {
    if (baseHref) {
      router.push(key === "tumu" ? baseHref : `${baseHref}?category=${key}`)
    } else if (key === "tumu") {
      router.push("/")
    } else if (key === "gundem") {
      router.push("/gundem")
    } else {
      router.push(`/?category=${key}`)
    }
  }

  if (sidebar) {
    return (
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "16px" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-3)", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 12px" }}>
          Kategoriler
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {visibleCategories.map((cat) => {
            const isActive = current === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => select(cat.key)}
                style={{
                  height: 30,
                  paddingInline: 12,
                  borderRadius: 99,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: isActive ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                  background: isActive ? "var(--color-accent-dim)" : "transparent",
                  color: isActive ? "var(--color-accent)" : "var(--color-text-2)",
                  whiteSpace: "nowrap",
                }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: "flex",
      gap: 6,
      overflowX: "auto",
      paddingBottom: 2,
      marginBottom: 20,
      paddingTop: 12,
    }} className="scrollbar-hide">
      {categories.map((cat) => {
        const isActive = current === cat.key
        return (
          <button
            key={cat.key}
            onClick={() => select(cat.key)}
            style={{
              flexShrink: 0,
              height: 32,
              paddingInline: 14,
              borderRadius: 99,
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: isActive ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
              background: isActive ? "var(--color-accent-dim)" : "transparent",
              color: isActive ? "var(--color-accent)" : "var(--color-text-2)",
              whiteSpace: "nowrap",
            }}
          >
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
