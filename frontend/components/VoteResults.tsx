"use client"

interface VoteData {
  pro_gov: number
  opposition: number
  both_biased: number
  undecided: number
  total: number
}

export default function VoteResults({ data }: { data: VoteData }) {
  if (!data || data.total === 0) return <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>Henuz oy verilmedi</div>

  const bars = [
    { label: "Yandas daha dogru", count: data.pro_gov, color: "#dc2626" },
    { label: "Muhalif daha dogru", count: data.opposition, color: "#16a34a" },
    { label: "Ikisi de yanlasli", count: data.both_biased, color: "#d97706" },
    { label: "Kararsizim", count: data.undecided, color: "#71717a" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {bars.map(b => {
        const pct = Math.round((b.count / data.total) * 100)
        return (
          <div key={b.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "var(--color-text-2)" }}>{b.label}</span>
              <span style={{ color: "var(--color-text-3)", fontWeight: 600 }}>{pct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "var(--color-surface-2)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: b.color, borderRadius: 4, transition: "width 0.5s ease" }} />
            </div>
          </div>
        )
      })}
      <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 4 }}>Toplam {data.total} oy</div>
    </div>
  )
}
