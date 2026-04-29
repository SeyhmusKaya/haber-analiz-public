"use client"

const COUNTRIES = ["TR", "US", "GB", "DE", "RU", "CN", "IR", "IL", "SA", "EG"]

const NAMES: Record<string, string> = {
  TR: "Türkiye", US: "ABD", GB: "İngiltere", DE: "Almanya", RU: "Rusya",
  CN: "Çin", IR: "İran", IL: "İsrail", SA: "Suudi Arabistan", EG: "Mısır",
}

interface TensionPair {
  country_a: string
  country_b: string
  tension_score: number
}

interface Props {
  data: TensionPair[]
  onCellClick?: (a: string, b: string, aName: string, bName: string, score: number) => void
}

function FlagImg({ code, size = 22 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={NAMES[code] || code}
      title={NAMES[code] || code}
      width={size}
      height={Math.round(size * 0.67)}
      style={{ borderRadius: 2, objectFit: "cover", display: "block" }}
    />
  )
}

export default function TensionHeatMap({ data, onCellClick }: Props) {
  const getScore = (a: string, b: string) => {
    if (a === b) return -1
    const pair = data.find(d =>
      (d.country_a === a && d.country_b === b) || (d.country_a === b && d.country_b === a)
    )
    return pair?.tension_score ?? 0
  }

  const scoreColor = (s: number) => {
    if (s < 0) return "var(--color-surface-2)"
    if (s < 3) return "rgba(34,197,94,0.25)"
    if (s < 5) return "rgba(234,179,8,0.28)"
    if (s < 7) return "rgba(249,115,22,0.38)"
    return "rgba(239,68,68,0.48)"
  }

  const textColor = (s: number) => {
    if (s < 0) return "var(--color-text-3)"
    if (s < 3) return "#16a34a"
    if (s < 5) return "#b45309"
    if (s < 7) return "#c2410c"
    return "#dc2626"
  }

  const cellSize = 40

  return (
    <div style={{ overflowX: "auto", width: "100%", maxWidth: "100vw" }}>
      <div style={{
        display: "inline-grid",
        gridTemplateColumns: `44px repeat(${COUNTRIES.length}, ${cellSize}px)`,
        gap: 2,
      }}>
        {/* Header row — sadece bayrak görseli */}
        <div />
        {COUNTRIES.map(c => (
          <div key={c}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "4px 0",
            }}
            title={NAMES[c]}
          >
            <FlagImg code={c} size={22} />
          </div>
        ))}

        {/* Satırlar */}
        {COUNTRIES.map(row => (
          <>
            {/* Satır etiketi — sadece bayrak görseli */}
            <div
              key={`label-${row}`}
              title={NAMES[row]}
              style={{
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                paddingRight: 4,
              }}
            >
              <FlagImg code={row} size={22} />
            </div>

            {/* Hücreler */}
            {COUNTRIES.map(col => {
              const s = getScore(row, col)
              const isSelf = row === col
              const clickable = !isSelf && onCellClick
              return (
                <div
                  key={`${row}-${col}`}
                  onClick={() => clickable && onCellClick(row, col, NAMES[row], NAMES[col], s)}
                  style={{
                    width: cellSize, height: cellSize,
                    background: scoreColor(s),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: s >= 7 ? 700 : 500,
                    color: textColor(s),
                    borderRadius: 4,
                    cursor: clickable ? "pointer" : "default",
                    transition: "transform 120ms ease, filter 120ms ease",
                    userSelect: "none",
                  }}
                  title={s >= 0 ? `${NAMES[row]} – ${NAMES[col]}: ${s.toFixed(1)}\nGerilimin kaynaklarını görmek için tıklayın` : ""}
                  onMouseEnter={e => {
                    if (!clickable) return
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = "scale(1.12)"
                    el.style.filter = "brightness(1.15)"
                    el.style.zIndex = "1"
                  }}
                  onMouseLeave={e => {
                    if (!clickable) return
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = "scale(1)"
                    el.style.filter = "none"
                    el.style.zIndex = "auto"
                  }}
                >
                  {s >= 0 ? s.toFixed(1) : "–"}
                </div>
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}
