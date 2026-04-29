"use client"

import { useState, useEffect } from "react"
import TensionHeatMap from "./TensionHeatMap"
import TensionDetailModal from "./TensionDetailModal"
import { TensionPair } from "@/lib/api"

const API = ""

function tensionColor(score: number) {
  if (score >= 7) return "#dc2626"
  if (score >= 4) return "#d97706"
  return "#16a34a"
}

function FlagImg({ code, size = 24 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={code}
      width={size}
      height={Math.round(size * 0.67)}
      style={{ borderRadius: 2, objectFit: "cover", display: "block", flexShrink: 0 }}
    />
  )
}

interface ModalState {
  countryA: string
  countryB: string
  countryAName: string
  countryBName: string
  tensionScore: number
}

interface Props {
  initialTensions?: TensionPair[]
}

export default function TensionSection({ initialTensions = [] }: Props) {
  const [tensions, setTensions] = useState<TensionPair[]>(initialTensions)
  const [loading, setLoading] = useState(initialTensions.length === 0)
  const [view, setView] = useState<"list" | "map">("list")
  const [modal, setModal] = useState<ModalState | null>(null)

  useEffect(() => {
    if (initialTensions.length > 0) return
    fetch(`${API}/api/tensions`)
      .then(r => r.json())
      .then(d => setTensions(d.tensions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [initialTensions.length])

  const seen = new Set<string>()
  const dedupedTensions = tensions.filter(t => {
    if (t.tension_score <= 0) return false
    const key = [t.country_a, t.country_b].sort().join("-")
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const topTensions = [...dedupedTensions]
    .sort((a, b) => b.tension_score - a.tension_score)
    .slice(0, 10)

  const lastUpdated = tensions.find(t => t.calculated_at)?.calculated_at
    ? new Date(tensions.find(t => t.calculated_at)!.calculated_at!).toLocaleDateString("tr-TR")
    : null

  const openModal = (a: string, b: string, aName: string, bName: string, score: number) => {
    setModal({ countryA: a, countryB: b, countryAName: aName, countryBName: bName, tensionScore: score })
  }

  return (
    <>
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        marginBottom: 24,
      }}>
        {/* Başlık */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--color-text)" }}>
            🌡️ Jeopolitik Gerilim Endeksi
          </h3>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>
              Son güncelleme: {lastUpdated}
            </span>
          )}
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-text-3)" }}>
          Medya tonundan hesaplanan ülkeler arası gerilim endeksi (0–10) · Tıklayarak kaynaklara göz atın
        </p>

        {/* Sekme butonları */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {(["list", "map"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 99, cursor: "pointer",
                border: "1px solid var(--color-border)",
                background: view === v ? "var(--color-accent)" : "transparent",
                color: view === v ? "#fff" : "var(--color-text-3)",
                transition: "all 150ms ease",
              }}
            >
              {v === "list" ? "📊 Liste" : "🔲 Isı Haritası"}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 8 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ height: 56, borderRadius: 12, background: "var(--color-border)", opacity: 0.5, animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : tensions.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--color-text-3)", fontSize: 13, padding: "24px 0" }}>
            Gerilim verisi henüz hesaplanmadı.
          </p>
        ) : view === "list" ? (
          /* ── Liste Görünümü ── */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 8 }}>
            {topTensions.map((pair, i) => {
              const color = tensionColor(pair.tension_score)
              const pct = Math.round((pair.tension_score / 10) * 100)
              return (
                <button
                  key={i}
                  onClick={() => openModal(
                    pair.country_a, pair.country_b,
                    pair.country_a_name, pair.country_b_name,
                    pair.tension_score,
                  )}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px",
                    background: "var(--color-surface-2)",
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    cursor: "pointer", textAlign: "left", width: "100%",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = color
                    el.style.transform = "translateY(-2px)"
                    el.style.boxShadow = `0 4px 16px ${color}28`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = "var(--color-border)"
                    el.style.transform = "translateY(0)"
                    el.style.boxShadow = "none"
                  }}
                >
                  {/* Ülke A: bayrak + kısaltma */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <FlagImg code={pair.country_a} size={22} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-2)", letterSpacing: "0.04em" }}>
                      {pair.country_a}
                    </span>
                  </div>

                  {/* Bar */}
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--color-border)", position: "relative", overflow: "hidden" }}>
                    <div style={{
                      position: "absolute", left: 0, top: 0, height: "100%",
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${color}88, ${color})`,
                      borderRadius: 2, transition: "width 500ms ease",
                    }} />
                  </div>

                  {/* Ülke B: bayrak + kısaltma */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <FlagImg code={pair.country_b} size={22} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-2)", letterSpacing: "0.04em" }}>
                      {pair.country_b}
                    </span>
                  </div>

                  {/* Skor badge */}
                  <span style={{
                    fontSize: 12, fontWeight: 800, color,
                    background: `${color}14`,
                    border: `1px solid ${color}30`,
                    borderRadius: 6, padding: "1px 6px",
                    minWidth: 34, textAlign: "center", flexShrink: 0,
                  }}>
                    {pair.tension_score.toFixed(1)}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          /* ── Isı Haritası ── */
          <TensionHeatMap
            data={tensions}
            onCellClick={(a, b, aName, bName, score) => openModal(a, b, aName, bName, score)}
          />
        )}

        {/* Lejant */}
        {!loading && tensions.length > 0 && (
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 16, fontSize: 12, color: "var(--color-text-3)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} /> Düşük (0–4)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#d97706", display: "inline-block" }} /> Orta (4–7)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} /> Yüksek (7–10)
            </span>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <TensionDetailModal
          countryA={modal.countryA}
          countryB={modal.countryB}
          countryAName={modal.countryAName}
          countryBName={modal.countryBName}
          tensionScore={modal.tensionScore}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
