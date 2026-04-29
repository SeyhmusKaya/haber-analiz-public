"use client"

import { useState } from "react"

interface PropagandaScores {
  propaganda: number
  emotion: number
  factual: number
  diversity: number
  rhetoric: string[]
}

interface PropagandaScoreProps {
  scores?: PropagandaScores
}

const RHETORIC_LABELS: Record<string, string> = {
  fear: "Korku Yaratma",
  nationalism: "Milliyetçilik",
  whataboutism: "Whataboutism",
  ad_hominem: "Kişisel Saldırı",
  misleading_headline: "Yanıltıcı Başlık",
  selective_quoting: "Seçici Alıntı",
  demonization: "Düşmanlaştırma",
  exaggeration: "Abartma",
}

function getBarColor(score: number, inverse: boolean): string {
  const effective = inverse ? 11 - score : score
  if (effective <= 3) return "#16a34a"
  if (effective <= 6) return "#d97706"
  return "#dc2626"
}

function ScoreBar({
  label,
  score,
  inverse,
}: {
  label: string
  score: number
  inverse: boolean
}) {
  const color = getBarColor(score, inverse)
  const pct = Math.round((score / 10) * 100)

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>
          {label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{score}/10</span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: "var(--color-surface-2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            backgroundColor: color,
            borderRadius: 4,
            transition: "width 400ms ease",
          }}
        />
      </div>
    </div>
  )
}

export default function PropagandaScore({ scores }: PropagandaScoreProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (!scores) return null

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: "var(--color-text)",
          }}
        >
          Medya Okuryazarlığı Skoru
        </h3>
        <div style={{ position: "relative" }}>
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip((p) => !p)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              color: "var(--color-text-3)",
              padding: 4,
              minWidth: 44,
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Bilgi"
          >
            {"ℹ️"}
          </button>
          {showTooltip && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "100%",
                marginTop: 4,
                width: 240,
                padding: "10px 12px",
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                fontSize: 12,
                lineHeight: 1.5,
                color: "var(--color-text-2)",
                zIndex: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              Bu skorlar yapay zeka tarafından üretilmiştir ve kesin değildir.
            </div>
          )}
        </div>
      </div>

      <ScoreBar label="Propaganda Seviyesi" score={scores.propaganda} inverse={false} />
      <ScoreBar label="Duygusal Manipülasyon" score={scores.emotion} inverse={false} />
      <ScoreBar label="Olgusal Doğruluk" score={scores.factual} inverse={true} />
      <ScoreBar label="Kaynak Çeşitliliği" score={scores.diversity} inverse={true} />

      {scores.rhetoric.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-text-2)",
              display: "block",
              marginBottom: 8,
            }}
          >
            Tespit Edilen Retorik Teknikleri
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {scores.rhetoric.map((key) => (
              <span
                key={key}
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-surface-2)",
                  color: "var(--color-text-2)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {RHETORIC_LABELS[key] || key}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
