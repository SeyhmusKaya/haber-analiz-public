"use client"

const RHETORIC_COLORS: Record<string, string> = {
  "Korku": "#ef4444",
  "Milliyetçilik": "#f59e0b",
  "Whataboutism": "#8b5cf6",
  "Duygusal Manipülasyon": "#ec4899",
  "Kaynak Gizleme": "#6b7280",
  "Abartma": "#f97316",
  "Ötekileştirme": "#dc2626",
  "Sahte Uzlaşma": "#14b8a6",
  "Seçici Alıntı": "#3b82f6",
  "Ad Hominem": "#a855f7",
}

export default function RhetoricBadge({ technique }: { technique: string }) {
  const color = RHETORIC_COLORS[technique] || "#6b7280"

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: `${color}15`, color, border: `1px solid ${color}30`,
      whiteSpace: "nowrap",
    }}>
      {technique}
    </span>
  )
}
