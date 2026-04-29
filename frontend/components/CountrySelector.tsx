import { Country } from "@/types"

interface Props {
  countries: Country[]
  selected: string | null
  onSelect: (code: string) => void
}

export default function CountrySelector({ countries, selected, onSelect }: Props) {
  return (
    <div style={{
      display: "flex",
      gap: 8,
      overflowX: "auto",
      paddingBottom: 4,
    }} className="scrollbar-hide">
      {countries.map((country) => {
        const isActive = selected === country.code
        return (
          <button
            key={country.code}
            onClick={() => onSelect(country.code)}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 40,
              paddingInline: 14,
              borderRadius: "var(--radius-md)",
              border: isActive ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
              background: isActive ? "var(--color-accent-dim)" : "var(--color-surface)",
              color: isActive ? "var(--color-accent)" : "var(--color-text-2)",
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            <img src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`} alt={country.name} style={{ width: 20, height: 15, objectFit: "cover", borderRadius: 2 }} />
            <span>{country.name}</span>
            <span style={{
              fontSize: 11,
              padding: "1px 6px",
              borderRadius: 99,
              background: isActive ? "var(--color-accent)" : "var(--color-surface-3)",
              color: isActive ? "white" : "var(--color-text-3)",
            }}>
              {country.article_count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
