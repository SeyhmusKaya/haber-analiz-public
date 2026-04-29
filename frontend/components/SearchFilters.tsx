"use client"

import { useState } from "react"

const CATEGORIES = [
  { key: "siyaset", label: "Siyaset" },
  { key: "ekonomi", label: "Ekonomi" },
  { key: "savas-catisma", label: "Savaş" },
  { key: "diplomasi", label: "Diplomasi" },
  { key: "teknoloji", label: "Teknoloji" },
  { key: "saglik", label: "Sağlık" },
  { key: "cevre", label: "Çevre" },
  { key: "spor", label: "Spor" },
  { key: "kultur", label: "Kültür" },
]

const COUNTRIES = [
  { code: "TR", flag: "🇹🇷", name: "Türkiye" },
  { code: "US", flag: "🇺🇸", name: "ABD" },
  { code: "GB", flag: "🇬🇧", name: "İngiltere" },
  { code: "DE", flag: "🇩🇪", name: "Almanya" },
  { code: "RU", flag: "🇷🇺", name: "Rusya" },
  { code: "CN", flag: "🇨🇳", name: "Çin" },
  { code: "IR", flag: "🇮🇷", name: "İran" },
  { code: "IL", flag: "🇮🇱", name: "İsrail" },
  { code: "SA", flag: "🇸🇦", name: "S. Arabistan" },
  { code: "EG", flag: "🇪🇬", name: "Mısır" },
]

const SORT_OPTIONS = [
  { value: "newest", label: "En Yeni" },
  { value: "oldest", label: "En Eski" },
  { value: "importance", label: "Önem" },
  { value: "relevance", label: "İlgililik" },
]

interface Filters {
  categories: string[]
  countries: string[]
  sort: string
  dateFrom: string
  dateTo: string
  naturalLanguage: boolean
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
}

export default function SearchFilters({ filters, onChange }: Props) {
  const [expanded, setExpanded] = useState(false)

  const toggle = (key: "categories" | "countries", value: string) => {
    const arr = filters[key]
    onChange({
      ...filters,
      [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
    })
  }

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: "5px 12px", fontSize: 12, borderRadius: 99, cursor: "pointer",
    border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
    background: active ? "rgba(37,99,235,0.1)" : "transparent",
    color: active ? "var(--color-accent)" : "var(--color-text-2)",
    fontWeight: active ? 600 : 400, transition: "all 0.15s", whiteSpace: "nowrap" as const,
  })

  return (
    <div style={{
      background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)", padding: 16, marginBottom: 16,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: expanded ? 16 : 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>Filtreler</span>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-3)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={filters.naturalLanguage}
              onChange={e => onChange({ ...filters, naturalLanguage: e.target.checked })}
              style={{ accentColor: "var(--color-accent)" }}
            />
            Doğal dil arama
          </label>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ fontSize: 12, color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer" }}
        >
          {expanded ? "Gizle" : "Detaylı Filtreler"}
        </button>
      </div>

      {expanded && (
        <>
          {/* Kategoriler */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 8 }}>Kategoriler</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATEGORIES.map(c => (
                <span key={c.key} onClick={() => toggle("categories", c.key)} style={chipStyle(filters.categories.includes(c.key))}>
                  {c.label}
                </span>
              ))}
            </div>
          </div>

          {/* Ülkeler */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 8 }}>Ülkeler</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {COUNTRIES.map(c => (
                <span key={c.code} onClick={() => toggle("countries", c.code)} style={chipStyle(filters.countries.includes(c.code))}>
                  {c.flag} {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Tarih + Sıralama */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--color-text-3)", marginBottom: 4 }}>Başlangıç</div>
              <input
                type="date" value={filters.dateFrom}
                onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--color-text-3)", marginBottom: 4 }}>Bitiş</div>
              <input
                type="date" value={filters.dateTo}
                onChange={e => onChange({ ...filters, dateTo: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--color-text-3)", marginBottom: 4 }}>Sıralama</div>
              <select value={filters.sort} onChange={e => onChange({ ...filters, sort: e.target.value })} style={inputStyle}>
                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "6px 10px", fontSize: 12, background: "var(--color-bg)",
  border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
  color: "var(--color-text)", outline: "none",
}
