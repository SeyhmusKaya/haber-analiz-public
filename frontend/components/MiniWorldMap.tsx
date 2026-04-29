"use client"

const ALL_COUNTRIES: Record<string, { name: string; flag: string }> = {
  TR: { name: "Türkiye", flag: "🇹🇷" },
  US: { name: "ABD", flag: "🇺🇸" },
  GB: { name: "İngiltere", flag: "🇬🇧" },
  DE: { name: "Almanya", flag: "🇩🇪" },
  RU: { name: "Rusya", flag: "🇷🇺" },
  CN: { name: "Çin", flag: "🇨🇳" },
  IR: { name: "İran", flag: "🇮🇷" },
  IL: { name: "İsrail", flag: "🇮🇱" },
  SA: { name: "Suudi Arabistan", flag: "🇸🇦" },
  EG: { name: "Mısır", flag: "🇪🇬" },
}

interface AvailableCountry {
  code: string
  name: string
  flag: string
}

interface MiniWorldMapProps {
  availableCountries: AvailableCountry[]
  selectedCountry?: string
  onSelect: (code: string) => void
}

export default function MiniWorldMap({
  availableCountries,
  selectedCountry,
  onSelect,
}: MiniWorldMapProps) {
  const availableCodes = new Set(availableCountries.map((c) => c.code))

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: "8px 0",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {Object.entries(ALL_COUNTRIES).map(([code, meta]) => {
        const isAvailable = availableCodes.has(code)
        const isSelected = selectedCountry === code

        return (
          <button
            key={code}
            disabled={!isAvailable}
            onClick={() => isAvailable && onSelect(code)}
            title={isAvailable ? meta.name : `${meta.name} - veri yok`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: "var(--radius-md)",
              border: isSelected
                ? "2px solid var(--color-accent)"
                : "1px solid var(--color-border)",
              backgroundColor: isSelected
                ? "var(--color-surface-2)"
                : "var(--color-surface)",
              cursor: isAvailable ? "pointer" : "default",
              opacity: isAvailable ? 1 : 0.35,
              filter: isAvailable ? "none" : "grayscale(100%)",
              transition: "all 200ms ease",
              flexShrink: 0,
              minWidth: 44,
              minHeight: 44,
              fontSize: 14,
              fontWeight: isSelected ? 600 : 400,
              color: isAvailable ? "var(--color-text)" : "var(--color-text-3)",
            }}
            onMouseEnter={(e) => {
              if (isAvailable && !isSelected) {
                e.currentTarget.style.borderColor = "var(--color-accent)"
              }
            }}
            onMouseLeave={(e) => {
              if (isAvailable && !isSelected) {
                e.currentTarget.style.borderColor = "var(--color-border)"
              }
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{meta.flag}</span>
            <span>{meta.name}</span>
          </button>
        )
      })}
    </div>
  )
}
