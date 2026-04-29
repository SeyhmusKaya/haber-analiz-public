"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { getAnalysis } from "@/lib/api"
import { Analysis, Event } from "@/types"
import QuestionModal from "./QuestionModal"
import LongSummary from "./LongSummary"
import NarrativeTimeline from "./NarrativeTimeline"
import FactCheckSection from "./FactCheckSection"
import SilenceCard from "./SilenceCard"

const API = ""

interface CountryOption { code: string; name: string; flag: string }

interface Props {
  eventId: number
  title: string
  imageUrl?: string
  summary?: string
  countries?: CountryOption[]
  audioText: string
  relatedEvents: Event[]
  allCountries: string[]
  coveredCountries: string[]
  articles?: any[]
  hasTrBias?: boolean
}

const PANEL_BUTTONS = [
  { id: "summary",   icon: "📋", label: "Uzun Özet",           color: "#8b5cf6" },
  { id: "narrative", icon: "📅", label: "Anlatı Takibi",       color: "#3b82f6" },
  { id: "factcheck", icon: "✅", label: "İddia Kontrolü",      color: "#10b981" },
  { id: "silence",   icon: "🔇", label: "Suskunluk",           color: "#f59e0b" },
  { id: "sources",   icon: "📰", label: "Kaynaklar",           color: "#71717a" },
]

const SHARE_OPTIONS = [
  { id: "twitter",   icon: "𝕏",  label: "Twitter",   color: "#000" },
  { id: "facebook",  icon: "f",   label: "Facebook",  color: "#1877f2" },
  { id: "whatsapp",  icon: "💬",  label: "WhatsApp",  color: "#25d366" },
  { id: "linkedin",  icon: "in",  label: "LinkedIn",  color: "#0a66c2" },
  { id: "copy",      icon: "🔗",  label: "Kopyala",   color: "#3b82f6" },
  { id: "print",     icon: "🖨",  label: "Yazdır",    color: "#71717a" },
]

const COUNTRY_NAMES: Record<string, string> = {
  TR: "Türkiye", US: "ABD", GB: "İngiltere", DE: "Almanya", RU: "Rusya",
  CN: "Çin", IR: "İran", IL: "İsrail", SA: "Suudi Arabistan", EG: "Mısır",
}

function SourcesPanel({ articles, countries, hasTrBias }: { articles: any[]; countries: CountryOption[]; hasTrBias: boolean }) {
  if (!articles.length) return <p style={{ textAlign: "center", color: "var(--color-text-3)", fontSize: 13, padding: "24px 0" }}>Kaynak bulunamadı.</p>

  const countryNameMap: Record<string, string> = {}
  countries.forEach(c => { countryNameMap[c.code] = c.name })

  if (hasTrBias) {
    // Kutuplaşma: düz liste, bias badge'li
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {articles.map((a: any) => (
          <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: 10, textDecoration: "none", transition: "border-color 0.15s",
          }}>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
              background: a.source_bias === "pro_gov" ? "rgba(220,38,38,0.1)" : "rgba(22,163,74,0.1)",
              color: a.source_bias === "pro_gov" ? "#dc2626" : "#16a34a",
              textTransform: "uppercase", flexShrink: 0,
            }}>
              {a.source_bias === "pro_gov" ? "YANDAŞ" : "MUHALİF"}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-3)" }}>{a.source_name}</div>
              <div style={{ fontSize: 12, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
            </div>
            <span style={{ fontSize: 11, color: "var(--color-text-3)", flexShrink: 0 }}>↗</span>
          </a>
        ))}
      </div>
    )
  }

  // Uluslararası: ülke bazlı gruplandırma
  const groups: Record<string, any[]> = {}
  articles.forEach((a: any) => {
    const key = a.source_country || "XX"
    if (!groups[key]) groups[key] = []
    groups[key].push(a)
  })
  const sortedKeys = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {sortedKeys.map(code => (
        <div key={code}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--color-border)" }}>
            <img src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`} alt={code} width={20} height={14} style={{ borderRadius: 2 }} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{countryNameMap[code] || COUNTRY_NAMES[code] || code}</span>
            <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>({groups[code].length})</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {groups[code].map((a: any) => (
              <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                borderRadius: 8, textDecoration: "none", transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-3)" }}>{a.source_name}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--color-text-3)", flexShrink: 0 }}>↗</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Comparison Modal ────────────────────────────────────────────────────────

function ComparisonModal({ eventId, countries, onClose }: {
  eventId: number; countries: CountryOption[]; onClose: () => void
}) {
  const [step, setStep] = useState<"select" | "compare">("select")
  const [selected, setSelected] = useState<string[]>([])
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [mobileTab, setMobileTab] = useState(0)

  function toggle(code: string) {
    setSelected(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : prev.length >= 3 ? prev : [...prev, code]
    )
  }

  async function startComparison() {
    if (selected.length < 2) return
    setStep("compare"); setMobileTab(0)
    const initL: Record<string, boolean> = {}
    selected.forEach(c => (initL[c] = true))
    setLoading(initL)
    for (const code of selected) {
      try {
        const data = await getAnalysis(eventId, code)
        setAnalyses(prev => ({ ...prev, [code]: data }))
      } catch (e: any) {
        setErrors(prev => ({ ...prev, [code]: e.message || "Yüklenemedi" }))
      } finally {
        setLoading(prev => ({ ...prev, [code]: false }))
      }
    }
  }

  function getCountry(code: string) { return countries.find(c => c.code === code) || { code, name: code, flag: "" } }

  function renderColumn(code: string) {
    const country = getCountry(code)
    const analysis = analyses[code]
    const isLoading = loading[code]
    const error = errors[code]
    return (
      <div key={code} style={{ flex: 1, minWidth: 0, background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-border)", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 8 }}>
          <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt={country.name} width={24} height={17} style={{ borderRadius: 2 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{country.name}</span>
        </div>
        <div style={{ padding: 16 }}>
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2,3].map(i => <div key={i} style={{ height: i === 1 ? 20 : 56, borderRadius: 8, background: "var(--color-border)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
            </div>
          )}
          {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}
          {analysis && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ display: "inline-block", padding: "3px 8px", borderRadius: 5, background: "rgba(220,38,38,0.1)", color: "#dc2626", fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>Yandaş Medya</div>
                {analysis.pro_gov_sources?.length > 0 && <p style={{ fontSize: 11, color: "var(--color-text-3)", marginBottom: 4 }}>{analysis.pro_gov_sources.join(", ")}</p>}
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-text-2)", margin: 0 }}>{analysis.pro_gov_summary}</p>
              </div>
              <div>
                <div style={{ display: "inline-block", padding: "3px 8px", borderRadius: 5, background: "rgba(22,163,74,0.1)", color: "#16a34a", fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>Muhalif Medya</div>
                {analysis.opposition_sources?.length > 0 && <p style={{ fontSize: 11, color: "var(--color-text-3)", marginBottom: 4 }}>{analysis.opposition_sources.join(", ")}</p>}
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-text-2)", margin: 0 }}>{analysis.opposition_summary}</p>
              </div>
              {analysis.consensus && (
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(217,119,6,0.08)", borderLeft: "3px solid #d97706" }}>
                  <span style={{ fontWeight: 700, color: "#d97706", fontSize: 11 }}>Ortak Nokta</span>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-text-2)", marginTop: 4, marginBottom: 0 }}>{analysis.consensus}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const isMob = typeof window !== "undefined" && window.innerWidth < 768

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: "95vw", maxWidth: 1100, maxHeight: "90vh", overflowY: "auto", background: "var(--color-bg)", borderRadius: 16, padding: "clamp(14px,3vw,28px)", border: "1px solid var(--color-border)", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-3)", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        {step === "select" ? (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "var(--color-text)", paddingRight: 40 }}>Ülkeleri Karşılaştır</h2>
            <p style={{ color: "var(--color-text-3)", fontSize: 13, marginBottom: 20 }}>2 veya 3 ülke seçin.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
              {countries.map(c => {
                const isSel = selected.includes(c.code)
                const disabled = !isSel && selected.length >= 3
                return (
                  <button key={c.code} onClick={() => !disabled && toggle(c.code)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, border: isSel ? "2px solid var(--color-accent)" : "1px solid var(--color-border)", background: isSel ? "rgba(37,99,235,0.1)" : "var(--color-surface)", color: "var(--color-text)", fontSize: 14, fontWeight: isSel ? 600 : 400, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, transition: "all 150ms" }}>
                    <img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.name} width={22} height={15} style={{ borderRadius: 2 }} />{c.name}
                  </button>
                )
              })}
            </div>
            <button onClick={startComparison} disabled={selected.length < 2} style={{ padding: "11px 30px", borderRadius: 10, border: "none", background: selected.length >= 2 ? "var(--color-accent)" : "var(--color-surface-2)", color: selected.length >= 2 ? "#fff" : "var(--color-text-3)", fontSize: 14, fontWeight: 600, cursor: selected.length >= 2 ? "pointer" : "not-allowed" }}>
              Karşılaştır ({selected.length}/3)
            </button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={() => setStep("select")} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13, cursor: "pointer" }}>← Geri</button>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>Karşılaştırma</h2>
            </div>
            {isMob ? (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
                  {selected.map((code, idx) => {
                    const c = getCountry(code)
                    return (
                      <button key={code} onClick={() => setMobileTab(idx)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: mobileTab === idx ? "2px solid var(--color-accent)" : "1px solid var(--color-border)", background: mobileTab === idx ? "rgba(37,99,235,0.1)" : "var(--color-surface)", color: "var(--color-text)", fontSize: 13, fontWeight: mobileTab === idx ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap" }}>
                        <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt={c.name} width={18} height={13} style={{ borderRadius: 2 }} />{c.name}
                      </button>
                    )
                  })}
                </div>
                {renderColumn(selected[mobileTab])}
              </>
            ) : (
              <div style={{ display: "flex", gap: 14 }}>{selected.map(code => renderColumn(code))}</div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}

// ─── Main ActionSidebar ──────────────────────────────────────────────────────

export default function ActionSidebar({
  eventId, title, imageUrl, summary, countries = [], audioText, relatedEvents, allCountries, coveredCountries, articles = [], hasTrBias = false,
}: Props) {
  const { user } = useAuth()
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [questions, setQuestions] = useState<{ question: string; answer: string }[]>([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mobileDrawer, setMobileDrawer] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)

  const canCompare = countries.length >= 2

  // Close share popup when clicking outside
  useEffect(() => {
    if (!showShare) return
    function handler(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShowShare(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showShare])

  // Close drawer on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") { setActivePanel(null); setShowShare(false) }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  function getUrl() { return typeof window !== "undefined" ? window.location.href : "" }

  function handleShare(id: string) {
    const pageUrl = getUrl()
    const text = encodeURIComponent(title)
    const url = encodeURIComponent(pageUrl)
    switch (id) {
      case "twitter":  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank"); break
      case "facebook": window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank"); break
      case "whatsapp": window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + pageUrl)}`, "_blank"); break
      case "linkedin": window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank"); break
      case "copy":
        navigator.clipboard.writeText(pageUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }); break
      case "print": {
        const w = window.open("", "_blank", "width=800,height=900")
        if (!w) break
        w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title><style>body{font-family:Georgia,serif;max-width:680px;margin:40px auto;color:#111;line-height:1.7}h1{font-size:24px;font-weight:700;margin-bottom:16px}img{width:100%;max-height:380px;object-fit:cover;border-radius:8px;margin-bottom:20px}.label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:8px}.summary{font-size:16px;line-height:1.8;color:#374151}.footer{margin-top:32px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px}@media print{body{margin:20px}}</style></head><body>${imageUrl ? `<img src="${imageUrl}" alt="${title}" onerror="this.style.display='none'"/>` : ""}<h1>${title}</h1>${summary ? `<div class="label">Yapay Zeka Özeti</div><div class="summary">${summary}</div>` : ""}<div class="footer">medyaizle.com · ${new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}</div><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script></body></html>`)
        w.document.close(); break
      }
    }
    setShowShare(false)
  }

  async function handleQuestionClick() {
    if (!user) { window.location.href = "/giris"; return }
    if (questions.length > 0) { setShowQuestions(true); return }
    setLoadingQ(true)
    try {
      const token = localStorage.getItem("auth_token")
      // Önce mevcut soruları kontrol et
      const res = await fetch(`/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      })
      const data = await res.json()
      if (data.ai_questions && Array.isArray(data.ai_questions) && data.ai_questions.length > 0) {
        setQuestions(data.ai_questions); setShowQuestions(true)
      } else {
        setQuestions([{ question: "Bu haber için henüz soru üretilmedi", answer: "Yapay zeka soruları henüz oluşturulmamış. Sorular haberler işlenirken otomatik olarak üretilir, lütfen daha sonra tekrar deneyin." }])
        setShowQuestions(true)
      }
    } catch {} finally { setLoadingQ(false) }
  }

  function togglePanel(id: string) {
    setActivePanel(prev => prev === id ? null : id)
  }

  function renderPanelContent() {
    switch (activePanel) {
      case "summary":   return <LongSummary eventId={eventId} />
      case "narrative": return <NarrativeTimeline eventId={eventId} />
      case "factcheck": return <FactCheckSection eventId={eventId} />
      case "silence":   return <SilenceCard eventId={eventId} allCountries={allCountries} coveredCountries={coveredCountries} />
      case "sources":   return <SourcesPanel articles={articles} countries={countries} hasTrBias={hasTrBias} />
      default: return null
    }
  }

  const activePanelInfo = PANEL_BUTTONS.find(b => b.id === activePanel)

  const pillBase: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10,
    padding: "0 16px", height: 44, borderRadius: 22,
    border: "1px solid var(--color-border)", background: "var(--color-surface)",
    cursor: "pointer", transition: "all 0.18s", fontSize: 13, fontWeight: 500,
    color: "var(--color-text-2)", whiteSpace: "nowrap",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", width: "100%",
    textAlign: "left",
  }

  return (
    <>
      {/* ── Desktop left sidebar ─────────────────────────── */}
      <div className="action-sidebar-desktop" style={{
        position: "fixed",
        left: "max(12px, calc((100vw - 1200px) / 2 - 190px))",
        top: "50%", transform: "translateY(-50%)",
        display: "flex", flexDirection: "column", gap: 6, zIndex: 40, width: 172,
      }}>
        {/* Karşılaştır */}
        {canCompare && (
          <button
            onClick={() => user ? setShowCompare(true) : (window.location.href = "/giris")}
            onMouseEnter={() => setHoveredId("compare")}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              ...pillBase,
              background: hoveredId === "compare" ? "linear-gradient(135deg,#0ea5e9,#0284c7)" : "var(--color-surface)",
              borderColor: hoveredId === "compare" ? "transparent" : "var(--color-border)",
              color: hoveredId === "compare" ? "#fff" : "#0ea5e9",
              boxShadow: hoveredId === "compare" ? "0 4px 14px rgba(14,165,233,.35)" : "0 1px 4px rgba(0,0,0,.06)",
              transform: hoveredId === "compare" ? "translateX(3px)" : "none",
            }}
          >
            <span style={{ fontSize: 17 }}>⚖️</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Karşılaştır</span>
          </button>
        )}

        {/* AI Soru Sor */}
        <button
          onClick={handleQuestionClick} disabled={loadingQ}
          onMouseEnter={() => setHoveredId("question")}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            ...pillBase,
            background: hoveredId === "question" ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : user ? "var(--color-surface)" : "rgba(124,58,237,.08)",
            borderColor: hoveredId === "question" ? "transparent" : user ? "var(--color-border)" : "#7c3aed",
            color: hoveredId === "question" ? "#fff" : "#7c3aed",
            boxShadow: hoveredId === "question" ? "0 4px 14px rgba(124,58,237,.35)" : "0 1px 4px rgba(0,0,0,.06)",
            transform: hoveredId === "question" ? "translateX(3px)" : "none",
          }}
        >
          <span style={{ fontSize: 17 }}>{loadingQ ? "⏳" : user ? "❓" : "🔒"}</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>AI Soru Sor</span>
        </button>

        <div style={{ height: 1, background: "var(--color-border)", margin: "2px 4px" }} />

        {/* Feature panel buttons */}
        {PANEL_BUTTONS.map(btn => {
          const isActive = activePanel === btn.id
          const isHov = hoveredId === btn.id
          return (
            <button
              key={btn.id}
              onClick={() => togglePanel(btn.id)}
              onMouseEnter={() => setHoveredId(btn.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                ...pillBase,
                background: isActive
                  ? btn.color
                  : isHov ? `${btn.color}22` : "var(--color-surface)",
                borderColor: isActive || isHov ? btn.color : "var(--color-border)",
                color: isActive ? "#fff" : isHov ? btn.color : "var(--color-text-2)",
                boxShadow: isActive || isHov ? `0 4px 14px ${btn.color}44` : "0 1px 4px rgba(0,0,0,.06)",
                transform: isHov ? "translateX(3px)" : "none",
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: "center", flexShrink: 0 }}>{btn.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{btn.label}</span>
            </button>
          )
        })}

        <div style={{ height: 1, background: "var(--color-border)", margin: "2px 4px" }} />

        {/* Paylaş button with popup */}
        <div ref={shareRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowShare(p => !p)}
            onMouseEnter={() => setHoveredId("share")}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              ...pillBase,
              background: showShare || hoveredId === "share" ? "linear-gradient(135deg,#2563eb,#4f46e5)" : "var(--color-surface)",
              borderColor: showShare || hoveredId === "share" ? "transparent" : "var(--color-border)",
              color: showShare || hoveredId === "share" ? "#fff" : "var(--color-text-2)",
              boxShadow: showShare || hoveredId === "share" ? "0 4px 14px rgba(37,99,235,.35)" : "0 1px 4px rgba(0,0,0,.06)",
              transform: hoveredId === "share" ? "translateX(3px)" : "none",
            }}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: "center", flexShrink: 0 }}>📤</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Paylaş</span>
          </button>

          {showShare && (
            <div style={{
              position: "absolute", left: "calc(100% + 10px)", top: 0,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 14, padding: 8,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              display: "flex", flexDirection: "column", gap: 2,
              minWidth: 150, zIndex: 100,
              animation: "fadeIn 0.15s ease",
            }}>
              {SHARE_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => handleShare(opt.id)} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 8, border: "none",
                  background: "transparent", cursor: "pointer",
                  color: "var(--color-text-2)", fontSize: 13, fontWeight: 500,
                  transition: "background 0.1s", width: "100%", textAlign: "left",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--color-surface-2)"; e.currentTarget.style.color = opt.color }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-2)" }}
                >
                  <span style={{
                    fontSize: ["twitter","linkedin","facebook"].includes(opt.id) ? 12 : 16,
                    fontWeight: ["linkedin","facebook"].includes(opt.id) ? 900 : 400,
                    width: 20, textAlign: "center", flexShrink: 0,
                  }}>
                    {opt.id === "copy" && copied ? "✓" : opt.icon}
                  </span>
                  <span>{opt.id === "copy" && copied ? "Kopyalandı!" : opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right drawer panel ───────────────────────────── */}
      {activePanel && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setActivePanel(null)}
            style={{ position: "fixed", inset: 0, zIndex: 299, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}
          />
          {/* Drawer */}
          <div style={{
            position: "fixed", right: 0, top: 0, height: "100dvh",
            width: "min(440px, 100vw)", zIndex: 300,
            background: "var(--color-bg)",
            borderLeft: "1px solid var(--color-border)",
            boxShadow: "-12px 0 40px rgba(0,0,0,0.25)",
            display: "flex", flexDirection: "column",
            animation: "slideInRight 0.25s ease",
          }}>
            {/* Drawer header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--color-border)",
              display: "flex", alignItems: "center", gap: 12,
              background: "var(--color-surface)",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 20 }}>{activePanelInfo?.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", flex: 1 }}>
                {activePanelInfo?.label}
              </span>
              <button
                onClick={() => setActivePanel(null)}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface-2)",
                  color: "var(--color-text-3)", fontSize: 15,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            </div>
            {/* Panel tabs for quick switching */}
            <div style={{
              display: "flex", overflowX: "auto", gap: 4, padding: "8px 12px",
              borderBottom: "1px solid var(--color-border)",
              background: "var(--color-surface-2)",
              flexShrink: 0,
            }} className="scrollbar-hide">
              {PANEL_BUTTONS.map(btn => (
                <button key={btn.id} onClick={() => setActivePanel(btn.id)} style={{
                  flexShrink: 0, padding: "5px 10px", borderRadius: 20, border: "none",
                  background: activePanel === btn.id ? btn.color : "transparent",
                  color: activePanel === btn.id ? "#fff" : "var(--color-text-3)",
                  fontSize: 11, cursor: "pointer", fontWeight: activePanel === btn.id ? 700 : 400,
                  transition: "all 0.15s",
                }}>
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 40px" }}>
              {renderPanelContent()}
            </div>
          </div>
        </>
      )}

      {/* ── Mobile FAB + Drawer ──────────────────────────── */}
      {/* FAB button - chatbot'un üstünde */}
      <div className="action-sidebar-mobile">
        <button
          onClick={() => setMobileDrawer(p => !p)}
          style={{
            position: "fixed", bottom: 84, right: 24, zIndex: 41,
            width: 50, height: 50, borderRadius: "50%",
            background: mobileDrawer ? "var(--color-surface-3)" : "linear-gradient(135deg, #3b82f6, #7c3aed)",
            border: mobileDrawer ? "1px solid var(--color-border)" : "none",
            color: "#fff",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: mobileDrawer ? "0 2px 8px rgba(0,0,0,0.12)" : "0 4px 16px rgba(59,130,246,0.4)",
            transition: "all 0.2s",
          }}
        >
          {mobileDrawer ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileDrawer && (
        <div className="action-sidebar-mobile">
          {/* Backdrop */}
          <div onClick={() => setMobileDrawer(false)} style={{
            position: "fixed", inset: 0, zIndex: 299,
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)",
          }} />
          {/* Drawer panel */}
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 300,
            background: "var(--color-bg)",
            borderRadius: "20px 20px 0 0",
            border: "1px solid var(--color-border)",
            borderBottom: "none",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
            maxHeight: "70vh", overflowY: "auto",
            animation: "mobileDrawerUp 0.25s ease",
          }}>
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--color-border)" }} />
            </div>
            <div style={{ padding: "4px 16px 20px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", marginBottom: 14 }}>
                Araçlar
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {/* Karşılaştır */}
                {canCompare && (
                  <button onClick={() => { setMobileDrawer(false); user ? setShowCompare(true) : (window.location.href = "/giris") }} style={{
                    display: "flex", alignItems: "flex-start", gap: 10, padding: "12px",
                    background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)",
                    borderRadius: 14, cursor: "pointer", textAlign: "left",
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>⚖️</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0ea5e9" }}>Karşılaştır</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-3)", lineHeight: 1.3, marginTop: 2 }}>Ülkeleri yan yana karşılaştır</div>
                    </div>
                  </button>
                )}
                {/* AI Soru Sor */}
                <button onClick={() => { setMobileDrawer(false); handleQuestionClick() }} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "12px",
                  background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
                  borderRadius: 14, cursor: "pointer", textAlign: "left",
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{user ? "❓" : "🔒"}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#7c3aed" }}>AI Soru Sor</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-3)", lineHeight: 1.3, marginTop: 2 }}>Yapay zekaya soru sor</div>
                  </div>
                </button>
                {/* Panel buttons */}
                {PANEL_BUTTONS.map(btn => (
                  <button key={btn.id} onClick={() => { setMobileDrawer(false); togglePanel(btn.id) }} style={{
                    display: "flex", alignItems: "flex-start", gap: 10, padding: "12px",
                    background: "var(--color-surface)", border: "1px solid var(--color-border)",
                    borderRadius: 14, cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s",
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{btn.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{btn.label}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-3)", lineHeight: 1.3, marginTop: 2 }}>
                        {btn.id === "summary" && "Detaylı AI analiz"}
                        {btn.id === "narrative" && "Günlere göre anlatı değişimi"}
                        {btn.id === "factcheck" && "İddiaları yapay zeka ile kontrol et"}
                        {btn.id === "silence" && "Hangi ülkeler bu haberi işlemedi?"}
                        {btn.id === "sources" && `${articles.length} kaynak görüntüle`}
                      </div>
                    </div>
                  </button>
                ))}
                {/* Paylaş */}
                <button onClick={() => { setMobileDrawer(false); setShowShare(true) }} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "12px",
                  background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)",
                  borderRadius: 14, cursor: "pointer", textAlign: "left",
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>📤</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}>Paylaş</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-3)", lineHeight: 1.3, marginTop: 2 }}>Sosyal medyada paylaş</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile share popup (when opened from drawer) */}
      {showShare && (
        <div className="action-sidebar-mobile">
          <div onClick={() => setShowShare(false)} style={{ position: "fixed", inset: 0, zIndex: 299, background: "rgba(0,0,0,0.3)" }} />
          <div ref={shareRef} style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 300,
            background: "var(--color-bg)", borderRadius: "20px 20px 0 0",
            border: "1px solid var(--color-border)", borderBottom: "none",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
            padding: "16px", animation: "mobileDrawerUp 0.2s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "center", padding: "0 0 10px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--color-border)" }} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>📤 Paylaş</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {SHARE_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => handleShare(opt.id)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "14px 8px", borderRadius: 12, border: "1px solid var(--color-border)",
                  background: "var(--color-surface)", cursor: "pointer",
                }}>
                  <span style={{
                    fontSize: ["twitter","linkedin","facebook"].includes(opt.id) ? 16 : 22,
                    fontWeight: ["linkedin","facebook"].includes(opt.id) ? 900 : 400,
                    color: opt.color,
                  }}>
                    {opt.id === "copy" && copied ? "✓" : opt.icon}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--color-text-2)", fontWeight: 500 }}>
                    {opt.id === "copy" && copied ? "Kopyalandı" : opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Comparison Modal ─────────────────────────────── */}
      {showCompare && canCompare && (
        <ComparisonModal eventId={eventId} countries={countries} onClose={() => setShowCompare(false)} />
      )}

      {/* ── Question Modal ────────────────────────────────── */}
      {showQuestions && (
        <QuestionModal questions={questions} onClose={() => setShowQuestions(false)} />
      )}

      <style>{`
        @media (max-width: 1024px) { .action-sidebar-desktop { display: none !important; } }
        @media (min-width: 1025px) { .action-sidebar-mobile { display: none !important; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mobileDrawerUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </>
  )
}
