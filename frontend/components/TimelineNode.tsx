"use client"

interface Props {
  date: string
  country: string
  summary: string
  sentiment: number
  isLast?: boolean
}

export default function TimelineNode({ date, country, summary, sentiment, isLast }: Props) {
  const sentimentColor = sentiment > 0.3 ? "#22c55e" : sentiment < -0.3 ? "#ef4444" : "#eab308"

  return (
    <div style={{ display: "flex", gap: 16, position: "relative" }}>
      {/* Vertical line */}
      {!isLast && (
        <div style={{
          position: "absolute", left: 11, top: 24, bottom: -12, width: 2,
          background: "var(--color-border)",
        }} />
      )}

      {/* Dot */}
      <div style={{
        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
        background: sentimentColor, border: "3px solid var(--color-surface)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1, paddingBottom: isLast ? 0 : 20,
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)", padding: "12px 16px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>{country}</span>
          <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>{date}</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.6 }}>
          {summary}
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 60, height: 4, borderRadius: 2, background: "var(--color-surface-2)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((sentiment + 1) / 2) * 100}%`, background: sentimentColor, borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 10, color: sentimentColor, fontWeight: 600 }}>
            {sentiment > 0 ? "+" : ""}{sentiment.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}
