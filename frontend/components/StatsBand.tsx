interface Props {
  stats: {
    total_events: number
    today_events: number
    total_sources: number
    total_countries: number
    total_articles: number
  }
}

export default function StatsBand({ stats }: Props) {
  const items = [
    { icon: "📊", label: "Bugün", value: `${stats.today_events} haber` },
    { icon: "🌍", label: "Ülke", value: `${stats.total_countries} ülkeden` },
    { icon: "📰", label: "Kaynak", value: `${stats.total_sources} kaynak` },
    { icon: "📄", label: "Toplam", value: `${stats.total_articles} makale` },
  ]

  return (
    <div className="stats-band" style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 0,
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      marginBottom: 24,
    }}>
      {items.map((item, i) => (
        <div key={i} style={{
          flex: 1,
          padding: "14px 16px",
          textAlign: "center",
          borderRight: i < items.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>{item.icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>{item.value}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-3)" }}>{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
