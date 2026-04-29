"use client"

interface Analysis {
  country_code: string
  country_name: string
  pro_gov_summary: string
  opposition_summary: string
  consensus: string
  pro_gov_sources?: string[]
  opposition_sources?: string[]
}

export default function ComparisonColumn({ analysis }: { analysis: Analysis }) {
  return (
    <div style={{
      flex: 1, minWidth: 300, background: "var(--color-surface)",
      border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 18px", borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface-2)", fontWeight: 700, fontSize: 15,
        color: "var(--color-text)",
      }}>
        {analysis.country_name}
      </div>

      {/* Yandas */}
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", marginBottom: 8 }}>
          Yandas Medya
        </div>
        {analysis.pro_gov_sources && (
          <div style={{ fontSize: 11, color: "var(--color-text-3)", marginBottom: 8 }}>
            {analysis.pro_gov_sources.join(", ")}
          </div>
        )}
        <div style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.7 }}>
          {analysis.pro_gov_summary || "Analiz bekleniyor..."}
        </div>
      </div>

      {/* Muhalif */}
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", marginBottom: 8 }}>
          Muhalif Medya
        </div>
        {analysis.opposition_sources && (
          <div style={{ fontSize: 11, color: "var(--color-text-3)", marginBottom: 8 }}>
            {analysis.opposition_sources.join(", ")}
          </div>
        )}
        <div style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.7 }}>
          {analysis.opposition_summary || "Analiz bekleniyor..."}
        </div>
      </div>

      {/* Konsensus */}
      {analysis.consensus && (
        <div style={{ padding: "14px 18px", background: "rgba(217,119,6,0.05)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#d97706", marginBottom: 6 }}>
            Ortak Nokta
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.6 }}>
            {analysis.consensus}
          </div>
        </div>
      )}
    </div>
  )
}
