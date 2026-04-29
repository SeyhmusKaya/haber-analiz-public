"use client"

import { useState } from "react"
import Link from "next/link"
import { Analysis } from "@/types"
import { SkeletonAnalysis } from "./LoadingSpinner"
import PropagandaScore from "./PropagandaScore"
import AiFlagButton from "./AiFlagButton"
import { usePlan } from "@/lib/usePlan"
import { useAuth } from "@/lib/auth"

interface Props {
  analysis: Analysis | null
  loading: boolean
  countryName?: string
  countryFlag?: string
  eventId?: number
  countryCode?: string
}

export default function AnalysisCard({ analysis, loading, countryName, countryFlag, eventId, countryCode }: Props) {
  const { user } = useAuth()
  const { hasAccess } = usePlan()
  const canSeePropaganda = user && hasAccess("pro")
  const [showAllProSources, setShowAllProSources] = useState(false)
  const [showAllOppSources, setShowAllOppSources] = useState(false)

  if (loading && !analysis) return <SkeletonAnalysis />
  if (!analysis) return null

  const hasScores = analysis.propaganda_scores &&
    (analysis.propaganda_scores.pro_gov || analysis.propaganda_scores.opposition)

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 22 }}>{countryFlag}</span>
        <span style={{ fontWeight: 600, fontSize: 16, color: "var(--color-text)" }}>
          {countryName} Medyası
        </span>
        {analysis.cached && (
          <span style={{
            fontSize: 11, color: "var(--color-text-3)", marginLeft: "auto",
            background: "var(--color-surface-2)", padding: "2px 8px", borderRadius: 99,
          }}>
            önbellekten
          </span>
        )}
      </div>

      {/* Pro-gov */}
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderLeft: "3px solid var(--color-pro)", borderRadius: "var(--radius-lg)", padding: "18px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            color: "var(--color-pro)", background: "var(--color-pro-dim)", padding: "3px 8px", borderRadius: 99,
          }}>
            Yandaş Medya
          </span>
          {analysis.pro_gov_sources?.length > 0 && (
            <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>
              {(showAllProSources ? analysis.pro_gov_sources : analysis.pro_gov_sources.slice(0, 3)).join(", ")}
              {!showAllProSources && analysis.pro_gov_sources.length > 3 && (
                <button
                  onClick={() => setShowAllProSources(true)}
                  style={{
                    marginLeft: 4, background: "none", border: "none", cursor: "pointer",
                    fontSize: 12, color: "var(--color-accent)", padding: 0, fontWeight: 500,
                  }}
                >
                  +{analysis.pro_gov_sources.length - 3} tümünü gör
                </button>
              )}
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--color-text-2)" }}>
          {analysis.pro_gov_summary}
        </p>
      </div>

      {/* Opposition */}
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderLeft: "3px solid var(--color-opp)", borderRadius: "var(--radius-lg)", padding: "18px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            color: "var(--color-opp)", background: "var(--color-opp-dim)", padding: "3px 8px", borderRadius: 99,
          }}>
            Muhalif Medya
          </span>
          {analysis.opposition_sources?.length > 0 && (
            <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>
              {(showAllOppSources ? analysis.opposition_sources : analysis.opposition_sources.slice(0, 3)).join(", ")}
              {!showAllOppSources && analysis.opposition_sources.length > 3 && (
                <button
                  onClick={() => setShowAllOppSources(true)}
                  style={{
                    marginLeft: 4, background: "none", border: "none", cursor: "pointer",
                    fontSize: 12, color: "var(--color-accent)", padding: 0, fontWeight: 500,
                  }}
                >
                  +{analysis.opposition_sources.length - 3} tümünü gör
                </button>
              )}
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--color-text-2)" }}>
          {analysis.opposition_summary}
        </p>
      </div>

      {/* Consensus */}
      {analysis.consensus && (
        <div style={{
          background: "var(--color-cons-dim)", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "var(--radius-lg)", padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 18, marginTop: 1 }}>⚖️</span>
          <div>
            <p style={{
              fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
              color: "var(--color-cons)", marginBottom: 6,
            }}>
              Her iki taraf hemfikir
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text-2)" }}>
              {analysis.consensus}
            </p>
          </div>
        </div>
      )}

      {/* Propaganda Score — Pro */}
      {hasScores && (
        canSeePropaganda ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {analysis.propaganda_scores!.pro_gov && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-pro)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Yandaş Medya Skoru
                </p>
                <PropagandaScore scores={analysis.propaganda_scores!.pro_gov} />
              </div>
            )}
            {analysis.propaganda_scores!.opposition && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-opp)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Muhalif Medya Skoru
                </p>
                <PropagandaScore scores={analysis.propaganda_scores!.opposition} />
              </div>
            )}
          </div>
        ) : (
          <div style={{
            border: "1px dashed var(--color-border)", borderRadius: "var(--radius-lg)",
            padding: "20px", textAlign: "center",
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
              Medya Okuryazarlığı Skoru
            </p>
            <p style={{ fontSize: 12, color: "var(--color-text-3)", marginBottom: 14 }}>
              {!user ? "Giriş yapın ve" : "Pro"} plan ile propaganda, duygu ve olgusal doğruluk skorlarını görün.
            </p>
            <Link href={user ? "/premium" : "/giris"} style={{
              fontSize: 12, fontWeight: 600, color: "#fff", background: "#2563eb",
              padding: "7px 16px", borderRadius: 8, textDecoration: "none",
            }}>
              {user ? "Pro'ya Geç →" : "Giriş Yap →"}
            </Link>
          </div>
        )
      )}

      {/* AI flag button */}
      {eventId && (
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
          <AiFlagButton eventId={eventId} type="analysis" countryCode={countryCode} />
        </div>
      )}
    </div>
  )
}
