"use client"

interface Metric {
  label: string
  value: number // 0-10
}

export default function RadarChart({ metrics, size = 200 }: { metrics: Metric[]; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 30
  const n = metrics.length
  if (n < 3) return null

  const angleStep = (2 * Math.PI) / n
  const getPoint = (i: number, val: number) => ({
    x: cx + (val / 10) * r * Math.sin(i * angleStep),
    y: cy - (val / 10) * r * Math.cos(i * angleStep),
  })

  // Grid rings
  const rings = [2, 4, 6, 8, 10]

  // Data polygon
  const dataPoints = metrics.map((m, i) => getPoint(i, m.value))
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z"

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {rings.map(ring => {
        const pts = metrics.map((_, i) => getPoint(i, ring))
        return (
          <polygon key={ring}
            points={pts.map(p => `${p.x},${p.y}`).join(" ")}
            fill="none" stroke="var(--color-border)" strokeWidth="0.5"
          />
        )
      })}

      {/* Axes */}
      {metrics.map((_, i) => {
        const end = getPoint(i, 10)
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="var(--color-border)" strokeWidth="0.5" />
      })}

      {/* Data */}
      <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(" ")}
        fill="rgba(37,99,235,0.15)" stroke="var(--color-accent)" strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth="2" />
      ))}

      {/* Labels */}
      {metrics.map((m, i) => {
        const lp = getPoint(i, 12)
        return (
          <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 10, fill: "var(--color-text-3)", fontWeight: 500 }}>
            {m.label}
          </text>
        )
      })}
    </svg>
  )
}
