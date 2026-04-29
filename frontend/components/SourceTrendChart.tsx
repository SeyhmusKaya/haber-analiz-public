"use client"

interface DataPoint {
  date: string
  article_count: number
  avg_propaganda_score?: number
  avg_sentiment?: number
}

export default function SourceTrendChart({ data, metric = "article_count" }: { data: DataPoint[]; metric?: string }) {
  if (!data || data.length === 0) return <div style={{ padding: 20, color: "var(--color-text-3)", fontSize: 13 }}>Veri yok</div>

  const values = data.map(d => (d as any)[metric] || 0)
  const max = Math.max(...values, 1)
  const chartH = 120

  return (
    <div style={{ padding: "12px 0" }}>
      <svg width="100%" height={chartH} viewBox={`0 0 ${data.length * 24} ${chartH}`} preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          points={values.map((v, i) => `${i * 24 + 12},${chartH - (v / max) * (chartH - 10) - 5}`).join(" ")}
        />
        {values.map((v, i) => (
          <circle
            key={i}
            cx={i * 24 + 12}
            cy={chartH - (v / max) * (chartH - 10) - 5}
            r="3"
            fill="var(--color-accent)"
          />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-text-3)", marginTop: 4, padding: "0 4px" }}>
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}
