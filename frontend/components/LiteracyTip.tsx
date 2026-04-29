const TIPS = [
  "Farklı kaynakları karşılaştırın",
  "Duygusal dil kullanımına dikkat edin",
  "Olgusal iddiaları doğrulayın",
]

export default function LiteracyTip() {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "16px 20px",
      }}
    >
      <h4
        style={{
          margin: "0 0 10px 0",
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--color-text)",
        }}
      >
        Bu Haberi Okurken Dikkat Edin
      </h4>
      <ul
        style={{
          margin: 0,
          paddingLeft: "18px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {TIPS.map((tip) => (
          <li
            key={tip}
            style={{
              fontSize: "13px",
              color: "var(--color-text-2)",
              lineHeight: 1.5,
            }}
          >
            {tip}
          </li>
        ))}
      </ul>
    </div>
  )
}
