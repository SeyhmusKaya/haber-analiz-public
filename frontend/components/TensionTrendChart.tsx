"use client"

interface DataPoint {
  date: string
  tension_score: number
}

export default function TensionTrendChart({ data, countryA, countryB }: { data: DataPoint[]; countryA: string; countryB: string }) {
  if (!data || data.length < 2) return <div style={{ padding: 16, color: "var(--color-text-3)", fontSize: 13 }}>Yeterli veri yok</div>

  const h = 140, w = data.length * 28
  const max = 10
  const points = data.map((d, i) => `${i * 28 + 14},${h - (d.tension_score / max) * (h - 20) - 10}`)

  // Renk: dusuk=yesil, orta=sari, yuksek=kirmizi
  const latest = data[data.length - 1].tension_score
  const lineColor = latest < 3 ? "#22c55e" : latest < 6 ? "#eab308" : "#ef4444"

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{countryA} - {countryB}</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: lineColor }}>{latest.toFixed(1)}</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {/* Grid lines */}
          {[0, 2.5, 5, 7.5, 10].map(v => (
            <line key={v} x1={0} y1={h - (v / max) * (h - 20) - 10} x2={w} y2={h - (v / max) * (h - 20) - 10}
              stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="4" />
          ))}
          {/* Area */}
          <polygon
            points={`14,${h - 10} ${points.join(" ")} ${(data.length - 1) * 28 + 14},${h - 10}`}
            fill={`${lineColor}15`}
          />
          {/* Line */}
          <polyline fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            points={points.join(" ")} />
          {/* Dots */}
          {data.map((d, i) => (
            <circle key={i} cx={i * 28 + 14} cy={h - (d.tension_score / max) * (h - 20) - 10}
              r="3.5" fill={lineColor} stroke="var(--color-surface)" strokeWidth="1.5" />
          ))}
        </svg>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-text-3)", marginTop: 4 }}>
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}
