"use client"

interface WordItem {
  word: string
  count: number
  sentiment: "positive" | "negative" | "neutral"
}

interface WordCloudProps {
  words?: WordItem[]
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#16a34a",
  negative: "#dc2626",
  neutral: "#9ca3af",
}

export default function WordCloud({ words }: WordCloudProps) {
  const maxCount = words ? Math.max(...words.map((w) => w.count)) : 1

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        marginTop: "24px",
      }}
    >
      <h3
        style={{
          margin: "0 0 16px 0",
          fontSize: "18px",
          fontWeight: 600,
          color: "var(--color-text)",
        }}
      >
        Kelime Analizi
      </h3>

      {!words || words.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "var(--color-text-3)",
            textAlign: "center",
            padding: "24px 0",
          }}
        >
          Kelime analizi henuz mevcut degil
        </p>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 0",
            }}
          >
            {words.map((item, i) => {
              const scale = 0.75 + (item.count / maxCount) * 1.25
              return (
                <span
                  key={i}
                  style={{
                    fontSize: `${scale}rem`,
                    fontWeight: item.count / maxCount > 0.6 ? 700 : 400,
                    color: SENTIMENT_COLORS[item.sentiment],
                    padding: "2px 6px",
                    cursor: "default",
                    transition: "transform 200ms ease",
                    display: "inline-block",
                  }}
                  title={`${item.word}: ${item.count} kez`}
                >
                  {item.word}
                </span>
              )
            })}
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              marginTop: "12px",
              fontSize: "12px",
              color: "var(--color-text-3)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#16a34a",
                  display: "inline-block",
                }}
              />
              Olumlu
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#dc2626",
                  display: "inline-block",
                }}
              />
              Olumsuz
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#9ca3af",
                  display: "inline-block",
                }}
              />
              Notr
            </span>
          </div>
        </>
      )}
    </div>
  )
}
