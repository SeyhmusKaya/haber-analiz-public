"use client"

const FLAGS: Record<string, string> = {
  TR: "🇹🇷", US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", RU: "🇷🇺",
  CN: "🇨🇳", IR: "🇮🇷", IL: "🇮🇱", SA: "🇸🇦", EG: "🇪🇬",
}

interface CountryCoverage {
  country_code: string
  article_count: number
}

export default function CoverageBarChart({ data }: { data: CountryCoverage[] }) {
  const sorted = [...data].sort((a, b) => b.article_count - a.article_count)
  const max = Math.max(...sorted.map(d => d.article_count), 1)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {sorted.map(d => (
        <div key={d.country_code} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, width: 24, textAlign: "center" }}>{FLAGS[d.country_code] || d.country_code}</span>
          <div style={{ flex: 1, height: 20, borderRadius: 4, background: "var(--color-surface-2)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${(d.article_count / max) * 100}%`,
              background: "var(--color-accent)", borderRadius: 4,
              transition: "width 0.5s ease", minWidth: 2,
            }} />
          </div>
          <span style={{ fontSize: 12, color: "var(--color-text-2)", fontWeight: 600, width: 24, textAlign: "right" }}>
            {d.article_count}
          </span>
        </div>
      ))}
    </div>
  )
}
