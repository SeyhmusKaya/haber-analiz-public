"use client"

import { useRouter } from "next/navigation"

interface CountryStat {
  code: string
  name: string
  flag: string
  count: number
}

interface WorldMapProps {
  stats: CountryStat[]
}

const COUNTRY_COLORS: Record<string, string> = {
  TR: "#e11d48", US: "#2563eb", GB: "#1e40af", DE: "#dc2626",
  RU: "#7c3aed", CN: "#ea580c", IR: "#059669", IL: "#0284c7",
  SA: "#16a34a", EG: "#d97706",
}

export default function WorldMap({ stats }: WorldMapProps) {
  const router = useRouter()
  const maxCount = Math.max(...stats.map((s) => s.count), 1)

  return (
    <div style={{
      padding: "20px",
      marginBottom: 24,
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>🌍</div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
            Dünya Haber Haritası
          </h2>
          <p style={{ fontSize: 12, color: "var(--color-text-3)", margin: 0 }}>
            Ülkelere göre haber dağılımı
          </p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(160px, 45%), 1fr))",
        gap: 8,
      }}>
        {stats.map((country) => {
          const pct = maxCount > 0 ? Math.round((country.count / maxCount) * 100) : 0
          const accentColor = COUNTRY_COLORS[country.code] || "#3b82f6"

          return (
            <button
              key={country.code}
              onClick={() => router.push(`/arama?country=${country.code}`)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 200ms ease",
                position: "relative",
                overflow: "hidden",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentColor
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = `0 6px 20px ${accentColor}20`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)"
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              {/* Progress bar */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
                background: "var(--color-border-subtle)",
              }}>
                <div style={{
                  height: "100%", width: `${pct}%`,
                  background: accentColor, borderRadius: 2,
                  transition: "width 500ms ease",
                }} />
              </div>

              {/* Flag image */}
              <img
                src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                alt={country.name}
                width={32}
                height={22}
                style={{
                  borderRadius: 3, objectFit: "cover",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  flexShrink: 0,
                }}
              />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: "var(--color-text)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  lineHeight: 1.3,
                }}>
                  {country.name}
                </div>
                {country.count > 0 && (
                  <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 2 }}>
                    {country.count} haber
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
