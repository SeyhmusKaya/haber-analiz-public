"use client"

import Link from "next/link"

interface Source {
  id: number
  name: string
  slug: string
  country_code: string
  bias: string
  url: string
  owner?: string
  funding_type?: string
  article_count?: number
  avg_propaganda_score?: number
}

const COUNTRY_FLAGS: Record<string, string> = {
  TR: "🇹🇷", US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", RU: "🇷🇺",
  CN: "🇨🇳", IR: "🇮🇷", IL: "🇮🇱", SA: "🇸🇦", EG: "🇪🇬",
}

export default function SourceCard({ source }: { source: Source }) {
  const biasColor = source.bias === "pro_gov" ? "#dc2626" : "#16a34a"
  const biasLabel = source.bias === "pro_gov" ? "Yandas" : "Muhalif"

  return (
    <Link href={`/kaynaklar/${source.slug}`} style={{ textDecoration: "none" }}>
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)", padding: 18, transition: "border-color 0.15s, box-shadow 0.15s",
        cursor: "pointer",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)" }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}>{source.name}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 2 }}>
              {COUNTRY_FLAGS[source.country_code] || ""} {source.country_code}
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
            background: `${biasColor}15`, color: biasColor, textTransform: "uppercase",
          }}>
            {biasLabel}
          </span>
        </div>

        {source.owner && (
          <div style={{ fontSize: 12, color: "var(--color-text-3)", marginBottom: 6 }}>
            Sahip: {source.owner}
          </div>
        )}

        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: "var(--color-text-3)" }}>
          {source.article_count !== undefined && <span>{source.article_count} makale</span>}
          {source.avg_propaganda_score !== undefined && (
            <span>Propaganda: {source.avg_propaganda_score.toFixed(1)}/10</span>
          )}
        </div>
      </div>
    </Link>
  )
}
