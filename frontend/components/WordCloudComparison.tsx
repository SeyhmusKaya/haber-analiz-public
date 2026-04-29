"use client"

interface WordData {
  word: string
  count: number
  sentiment?: number
}

interface Props {
  leftCountry: string
  rightCountry: string
  leftWords: WordData[]
  rightWords: WordData[]
}

export default function WordCloudComparison({ leftCountry, rightCountry, leftWords, rightWords }: Props) {
  const renderCloud = (words: WordData[]) => {
    const max = Math.max(...words.map(w => w.count), 1)
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", padding: 12 }}>
        {words.slice(0, 30).map((w, i) => {
          const size = 11 + (w.count / max) * 16
          const opacity = 0.4 + (w.count / max) * 0.6
          const color = w.sentiment !== undefined
            ? w.sentiment > 0 ? `rgba(34,197,94,${opacity})` : w.sentiment < 0 ? `rgba(239,68,68,${opacity})` : `rgba(160,160,160,${opacity})`
            : `rgba(160,160,160,${opacity})`
          return (
            <span key={i} style={{ fontSize: size, color, fontWeight: size > 18 ? 700 : 400, lineHeight: 1.2 }} title={`${w.word}: ${w.count}`}>
              {w.word}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
      border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden",
    }}>
      <div style={{ borderRight: "1px solid var(--color-border)" }}>
        <div style={{ padding: "10px 16px", background: "var(--color-surface-2)", fontSize: 13, fontWeight: 600, color: "var(--color-text)", textAlign: "center" }}>
          {leftCountry}
        </div>
        {renderCloud(leftWords)}
      </div>
      <div>
        <div style={{ padding: "10px 16px", background: "var(--color-surface-2)", fontSize: 13, fontWeight: 600, color: "var(--color-text)", textAlign: "center" }}>
          {rightCountry}
        </div>
        {renderCloud(rightWords)}
      </div>
    </div>
  )
}
