"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { EventDetail, Analysis, ArticleSource, Country } from "@/types"
import CountrySelector from "@/components/CountrySelector"
import AnalysisCard from "@/components/AnalysisCard"
import PropagandaScore from "@/components/PropagandaScore"
import WordCloudComparison from "@/components/WordCloudComparison"
import ReaderVote from "@/components/ReaderVote"
import TrBiasVote from "@/components/TrBiasVote"
import RelatedNews from "@/components/RelatedNews"
import { getAnalysis } from "@/lib/api"
import { useAuth } from "@/lib/auth"

const API = ""

// Günlük analiz sayısını localStorage'da takip eder
function getTodayCount(): number {
  const today = new Date().toDateString()
  const saved = JSON.parse(localStorage.getItem("analysis_usage") || "{}")
  if (saved.date !== today) return 0
  return saved.count || 0
}
function incrementTodayCount() {
  const today = new Date().toDateString()
  const saved = JSON.parse(localStorage.getItem("analysis_usage") || "{}")
  const count = saved.date === today ? (saved.count || 0) + 1 : 1
  localStorage.setItem("analysis_usage", JSON.stringify({ date: today, count }))
}

interface Props {
  event: EventDetail
  relatedEvents?: import("@/types").Event[]
}

function LoginPrompt() {
  return (
    <div style={{
      marginTop: 24,
      padding: "32px 24px",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      textAlign: "center",
      background: "var(--color-surface)",
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text)", marginBottom: 8 }}>
        Bu içeriği görüntülemek için giriş yapın
      </h3>
      <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 20, lineHeight: 1.6 }}>
        Ülke bazlı medya analizlerini görüntülemek için bir hesaba ihtiyacınız var.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Link href="/giris" style={{
          padding: "9px 20px",
          background: "var(--color-accent)", color: "#fff",
          borderRadius: "var(--radius-md)", textDecoration: "none",
          fontSize: 13, fontWeight: 600,
        }}>
          Giriş Yap
        </Link>
        <Link href="/kayit" style={{
          padding: "9px 20px",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface-2)", color: "var(--color-text-2)",
          borderRadius: "var(--radius-md)", textDecoration: "none",
          fontSize: 13, fontWeight: 500,
        }}>
          Üye Ol
        </Link>
      </div>
    </div>
  )
}

function PremiumPrompt({ limit, plan }: { limit: number; plan: string }) {
  return (
    <div style={{ marginTop: 24, padding: "28px 24px", border: "2px solid #f59e0b", borderRadius: 14, textAlign: "center", background: "rgba(245,158,11,0.05)" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>⭐</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Günlük Limitinize Ulaştınız</h3>
      <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 6, lineHeight: 1.6 }}>
        {`Ücretsiz planda günde ${limit} ülke analizi görüntüleyebilirsiniz.`}
      </p>
      <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 20 }}>Premium'a geçerek sınırsız analiz yapın.</p>
      <Link href="/profil/premium" style={{ padding: "10px 28px", background: "#f59e0b", color: "#fff", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
        Premium'a Geç →
      </Link>
    </div>
  )
}

const DAILY_LIMITS: Record<string, number> = { free: 3, pro: -1 }

const COUNTRY_NAMES: Record<string, string> = {
  TR: "Türkiye", US: "ABD", GB: "İngiltere", DE: "Almanya",
  RU: "Rusya", CN: "Çin", IR: "İran", IL: "İsrail",
  SA: "Suudi Arabistan", EG: "Mısır",
}

function ArticleRow({ article, showBias }: { article: ArticleSource; showBias?: boolean }) {
  let hostname = ""
  try { hostname = new URL(article.url).hostname } catch { /* ignore */ }
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "10px 14px",
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)", textDecoration: "none",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
    >
      {showBias && (
        <span style={{
          flexShrink: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
          padding: "2px 6px", borderRadius: 4, marginTop: 1,
          background: article.source_bias === "pro_gov" ? "var(--color-pro-dim)" : "var(--color-opp-dim)",
          color: article.source_bias === "pro_gov" ? "var(--color-pro)" : "var(--color-opp)",
        }}>
          {article.source_bias === "pro_gov" ? "YANDAŞ" : "MUHALİF"}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-3)", marginBottom: 2, display: "flex", alignItems: "center", gap: 5 }}>
          {hostname && (
            <img
              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`}
              alt="" width={14} height={14}
              style={{ borderRadius: 3, flexShrink: 0 }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
            />
          )}
          {article.source_name}
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {article.title}
        </div>
      </div>
      <span style={{ flexShrink: 0, fontSize: 11, color: "var(--color-accent)", alignSelf: "center" }}>↗</span>
    </a>
  )
}

function GroupedSources({ articles, availableCountries }: { articles: ArticleSource[]; availableCountries: Country[] }) {
  const countryNameMap: Record<string, string> = {}
  availableCountries.forEach(c => { countryNameMap[c.code] = c.name })

  // Group by source_country
  const groups: Record<string, ArticleSource[]> = {}
  articles.forEach(a => {
    const key = a.source_country || "XX"
    if (!groups[key]) groups[key] = []
    groups[key].push(a)
  })

  const sortedKeys = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {sortedKeys.map(code => (
        <div key={code}>
          {/* Country header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
            paddingBottom: 8, borderBottom: "1px solid var(--color-border)",
          }}>
            <img
              src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`}
              srcSet={`https://flagcdn.com/w40/${code.toLowerCase()}.png 2x`}
              alt={code} width={20} height={14}
              style={{ borderRadius: 2, flexShrink: 0 }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
              {countryNameMap[code] || COUNTRY_NAMES[code] || code}
            </span>
            <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>
              ({groups[code].length} kaynak)
            </span>
          </div>
          {/* Articles under this country */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {groups[code].map(article => (
              <ArticleRow key={article.id} article={article} showBias={false} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HaberDetayClient({ event, relatedEvents = [] }: Props) {
  const { user } = useAuth()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cache, setCache] = useState<Record<string, Analysis>>({})
  const [showAllArticles, setShowAllArticles] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [userPlan, setUserPlan] = useState<string>("free")
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false)

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem("auth_token")
    fetch(`${API}/api/subscription/status`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      .then(r => r.json()).then(d => { if (d.plan) setUserPlan(d.plan) }).catch(() => {})
  }, [user])

  async function handleSelect(code: string) {
    setError(null)
    setShowLoginPrompt(false)
    setShowPremiumPrompt(false)

    if (!user) {
      setSelected(code)
      setShowLoginPrompt(true)
      return
    }

    // Daha önce yüklendiyse limiti atla
    if (cache[code]) {
      setSelected(code)
      return
    }

    // Günlük limit kontrolü
    const limit = DAILY_LIMITS[userPlan] ?? 3
    if (limit !== -1 && getTodayCount() >= limit) {
      setSelected(code)
      setShowPremiumPrompt(true)
      return
    }

    setSelected(code)
    setLoading(true)
    try {
      const data = await getAnalysis(event.id, code)
      setCache(prev => ({ ...prev, [code]: data }))
      incrementTodayCount()
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        setShowLoginPrompt(true)
      } else if (err instanceof Error && err.message === "DAILY_LIMIT") {
        setShowPremiumPrompt(true)
      } else {
        setError("Analiz yüklenemedi, lütfen tekrar deneyin.")
      }
    } finally {
      setLoading(false)
    }
  }

  const currentAnalysis = selected ? cache[selected] || null : null
  const selectedCountry = event.available_countries.find(c => c.code === selected)

  if (event.available_countries.length <= 1) {
    return null
  }

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "20px 20px 24px",
      marginBottom: 4,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{
          fontSize: 14, fontWeight: 600, color: "var(--color-text-2)",
          margin: 0, textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          🌍 Bu haberi dünya nasıl görüyor?
        </h2>
      </div>

      <CountrySelector
        countries={event.available_countries}
        selected={selected}
        onSelect={handleSelect}
      />

      {/* Not selected */}
      {!selected && (
        <div style={{
          marginTop: 24, textAlign: "center", padding: "48px 0",
          border: "1px dashed var(--color-border)",
          borderRadius: "var(--radius-lg)",
          color: "var(--color-text-3)", fontSize: 13,
        }}>
          Bir ülke seçerek o ülkenin medyasının bu olayı nasıl yorumladığını gör
        </div>
      )}

      {/* Login prompt */}
      {showLoginPrompt && <LoginPrompt />}

      {/* Premium limit prompt */}
      {showPremiumPrompt && !showLoginPrompt && (
        <PremiumPrompt limit={DAILY_LIMITS[userPlan] ?? 3} plan={userPlan} />
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 16, padding: "14px 16px",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "var(--radius-md)", fontSize: 13, color: "#ef4444",
        }}>
          {error}
        </div>
      )}


      {/* Analysis Card */}
      {selected && !showLoginPrompt && (loading || currentAnalysis) && (
        <div style={{ marginTop: 24 }}>
          <AnalysisCard
            analysis={currentAnalysis}
            loading={loading && !currentAnalysis}
            countryName={selectedCountry?.name}
            countryFlag={selectedCountry?.flag}
            eventId={event.id}
            countryCode={selected ?? undefined}
          />

          {/* Propaganda Skoru */}
          {currentAnalysis?.propaganda_scores && (
            <div style={{ marginTop: 16, display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
              {currentAnalysis.propaganda_scores.pro_gov && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-pro)", letterSpacing: "0.05em", marginBottom: 6, textTransform: "uppercase" }}>
                    Yandaş Medya
                  </div>
                  <PropagandaScore scores={currentAnalysis.propaganda_scores.pro_gov} />
                </div>
              )}
              {currentAnalysis.propaganda_scores.opposition && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-opp)", letterSpacing: "0.05em", marginBottom: 6, textTransform: "uppercase" }}>
                    Muhalif Medya
                  </div>
                  <PropagandaScore scores={currentAnalysis.propaganda_scores.opposition} />
                </div>
              )}
            </div>
          )}

          {/* Kelime Bulutu Karşılaştırması */}
          {(currentAnalysis?.word_frequencies?.pro_gov?.length ?? 0) > 0 && (
            <div style={{ marginTop: 16, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 24px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>
                Öne Çıkan Kelimeler
              </h3>
              <WordCloudComparison
                leftCountry="Yandaş Medya"
                rightCountry="Muhalif Medya"
                leftWords={currentAnalysis?.word_frequencies?.pro_gov ?? []}
                rightWords={currentAnalysis?.word_frequencies?.opposition ?? []}
              />
            </div>
          )}
        </div>
      )}

      {/* TR Kutuplaşma anketi - sadece münhasıran TR kaynaklı (kutuplaşma) haberlerde göster */}
      {event.has_tr_bias && event.available_countries.every(c => c.code === "TR") && (
        <div style={{ marginTop: 20 }}>
          <TrBiasVote eventId={event.id} />
        </div>
      )}

      {/* Dünya ülkesi anketi - TR-only kutuplaşma değil, uluslararası haberlerde göster */}
      {!(event.has_tr_bias && event.available_countries.every(c => c.code === "TR")) && event.available_countries.length >= 2 && (
        <div style={{ marginTop: 20 }}>
          <ReaderVote eventId={event.id} countries={event.available_countries} />
        </div>
      )}

      {/* İlgili Haberler */}
      {relatedEvents.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <RelatedNews events={relatedEvents.slice(0, 4)} />
        </div>
      )}
    </div>
  )
}
