"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"

const API_URL = ""

export default function KaynakDetayPage() {
  const { slug } = useParams()
  const [source, setSource] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/sources/${slug}`, { headers: { Accept: "application/json" } })
      .then(r => r.json())
      .then(d => setSource(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div style={{ maxWidth: 800, margin: "48px auto", padding: "0 20px" }}>
    <div style={{ height: 24, background: "var(--color-border)", borderRadius: 8, width: 200, marginBottom: 16 }} />
    <div style={{ height: 120, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }} />
  </div>

  if (!source) return <div style={{ maxWidth: 800, margin: "48px auto", padding: "0 20px", color: "var(--color-text-3)" }}>Kaynak bulunamadı</div>

  const biasColor = source.bias === "pro_gov" ? "#dc2626" : "#16a34a"
  const biasLabel = source.bias === "pro_gov" ? "Yandaş" : "Muhalif"

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 20px" }}>
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)", padding: 32, marginBottom: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)" }}>{source.name}</h1>
            <div style={{ fontSize: 14, color: "var(--color-text-3)", marginTop: 4 }}>
              {source.country_code} · {source.language}
            </div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99,
            background: `${biasColor}15`, color: biasColor,
          }}>
            {biasLabel}
          </span>
        </div>

        {source.description && (
          <p style={{ fontSize: 14, color: "var(--color-text-2)", lineHeight: 1.6, marginBottom: 16 }}>{source.description}</p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {source.owner && <InfoItem label="Sahip" value={source.owner} />}
          {source.funding_type && <InfoItem label="Finansman" value={source.funding_type} />}
          {source.founded_year && <InfoItem label="Kuruluş" value={String(source.founded_year)} />}
          {source.url && <InfoItem label="Web" value={source.url} link />}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div style={{
      padding: "12px 16px", background: "var(--color-surface-2)",
      borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
    }}>
      <div style={{ fontSize: 11, color: "var(--color-text-3)", marginBottom: 4 }}>{label}</div>
      {link ? (
        <a href={value} target="_blank" rel="noopener" style={{ fontSize: 13, color: "var(--color-accent)", textDecoration: "none", wordBreak: "break-all" }}>
          {value.replace(/^https?:\/\//, "").split("/")[0]}
        </a>
      ) : (
        <div style={{ fontSize: 13, color: "var(--color-text)", fontWeight: 500 }}>{value}</div>
      )}
    </div>
  )
}
