"use client"

import Link from "next/link"

interface Report {
  id: number
  type: string
  title: string
  period_start: string
  period_end: string
  created_at: string
}

export default function ReportCard({ report }: { report: Report }) {
  const typeLabel = report.type === "weekly" ? "Haftalik" : "Aylik"
  const typeColor = report.type === "weekly" ? "#3b82f6" : "#8b5cf6"

  return (
    <Link href={`/raporlar/${report.id}`} style={{ textDecoration: "none" }}>
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)", padding: 20, cursor: "pointer",
        transition: "border-color 0.15s, transform 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = typeColor; e.currentTarget.style.transform = "translateY(-2px)" }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.transform = "none" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
            background: `${typeColor}15`, color: typeColor, textTransform: "uppercase",
          }}>
            {typeLabel}
          </span>
          <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>
            {report.period_start} - {report.period_end}
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", lineHeight: 1.4 }}>
          {report.title}
        </div>
      </div>
    </Link>
  )
}
