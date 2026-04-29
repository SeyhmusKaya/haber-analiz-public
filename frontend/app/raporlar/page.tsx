"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { usePlan } from "@/lib/usePlan"

const API_URL = ""

const COUNTRIES = [
  { code: "TR", label: "Türkiye" },
  { code: "US", label: "ABD" },
  { code: "GB", label: "İngiltere" },
  { code: "DE", label: "Almanya" },
  { code: "RU", label: "Rusya" },
  { code: "CN", label: "Çin" },
  { code: "IR", label: "İran" },
  { code: "IL", label: "İsrail" },
  { code: "SA", label: "S. Arabistan" },
  { code: "EG", label: "Mısır" },
]

const CATEGORIES = [
  "siyaset", "ekonomi", "savas-catisma", "diplomasi",
  "teknoloji", "saglik", "cevre", "spor", "kultur", "diger",
]

const CAT_LABELS: Record<string, string> = {
  "siyaset": "Siyaset", "ekonomi": "Ekonomi", "savas-catisma": "Savaş/Çatışma",
  "diplomasi": "Diplomasi", "teknoloji": "Teknoloji", "saglik": "Sağlık",
  "cevre": "Çevre", "spor": "Spor", "kultur": "Kültür", "diger": "Diğer",
}

interface Report {
  id: number
  type: "weekly" | "monthly"
  title: string
  period_start: string
  period_end: string
  content: {
    highlights?: string[]
    stats?: { events?: number; sources?: number; countries?: number }
    meta?: { focus?: string; countries?: string[] | null; categories?: string[] | null }
  }
  created_at: string
}

interface GenFilters {
  focus: "all" | "kutuplasmalar" | "international"
  countries: string[]
  categories: string[]
}

export default function RaporlarPage() {
  const { user } = useAuth()
  const { hasAccess } = usePlan()
  const canView = user && hasAccess("pro")

  const [activeTab, setActiveTab] = useState<"weekly" | "monthly">("weekly")
  const [reports, setReports] = useState<Report[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [generating, setGenerating] = useState<"weekly" | "monthly" | null>(null)
  const [genMsg, setGenMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [showGenPanel, setShowGenPanel] = useState(false)
  const [sampleId, setSampleId] = useState<number | null>(null)

  const [filters, setFilters] = useState<GenFilters>({
    focus: "all",
    countries: [],
    categories: [],
  })

  useEffect(() => {
    // Her zaman örnek rapor ID'sini çek (public endpoint)
    fetch(`${API_URL}/api/reports/sample`, { headers: { Accept: "application/json" } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.id) setSampleId(d.id) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!canView) return
    loadReports()
  }, [canView])

  function loadReports() {
    setLoadingReports(true)
    const token = localStorage.getItem("auth_token")
    fetch(`${API_URL}/api/reports`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setReports(d.reports ?? []))
      .catch(() => {})
      .finally(() => setLoadingReports(false))
  }

  async function generateReport(type: "weekly" | "monthly") {
    setGenerating(type)
    setGenMsg(null)
    const token = localStorage.getItem("auth_token")
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type,
          focus: filters.focus,
          countries: filters.focus === "kutuplasmalar" ? [] : filters.countries,
          categories: filters.categories,
          current: true,
          force: true,
        }),
      })
      const data = await res.json()
      setGenMsg({ type: res.ok ? "ok" : "err", text: data.message || "Rapor oluşturuldu." })
      if (res.ok) loadReports()
    } catch {
      setGenMsg({ type: "err", text: "Bağlantı hatası." })
    } finally {
      setGenerating(null)
    }
  }

  function toggleCountry(code: string) {
    setFilters(f => ({
      ...f,
      countries: f.countries.includes(code)
        ? f.countries.filter(c => c !== code)
        : [...f.countries, code],
    }))
  }

  function toggleCategory(cat: string) {
    setFilters(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }))
  }

  if (!canView) {
    return (
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--color-text)", marginBottom: "10px", lineHeight: 1.2 }}>
            Medya Analiz Raporları
          </h1>
          <p style={{ fontSize: "16px", color: "var(--color-text-2)", lineHeight: 1.7, maxWidth: "600px" }}>
            Yapay zeka destekli haftalık ve aylık medya analiz raporları. Propaganda istatistikleri,
            anlatı karşılaştırmaları ve jeopolitik gerilim özetleri.
          </p>
        </div>

        <div style={{
          background: "var(--color-surface)", border: "2px solid var(--color-accent)",
          borderRadius: "20px", padding: "36px 40px", textAlign: "center",
          boxShadow: "0 8px 40px rgba(37,99,235,0.12)", marginBottom: "32px",
        }}>
          <div style={{ fontSize: "44px", marginBottom: "12px" }}>🔒</div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text)", marginBottom: "10px" }}>
            Tüm Raporlara Erişmek İçin Pro&apos;ya Geçin
          </h2>
          <p style={{ fontSize: "14px", color: "var(--color-text-2)", lineHeight: 1.7, marginBottom: "24px", maxWidth: 480, margin: "0 auto 24px" }}>
            Haftalık ve aylık tam raporlar, PDF indirme, propaganda istatistikleri ve
            anlatı karşılaştırmaları <strong>Pro plan</strong> ile açılır.
          </p>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "10px", marginBottom: "28px" }}>
            {["📊 Haftalık & aylık raporlar", "📄 PDF indirme", "🎯 Propaganda istatistikleri",
              "🌍 Ülke anlatı karşılaştırması", "🔇 Sessiz medya tespiti"].map(f => (
              <span key={f} style={{ fontSize: "13px", color: "var(--color-text-2)", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "999px", padding: "6px 14px" }}>{f}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={user ? "/premium" : "/giris"} style={{ display: "inline-block", padding: "14px 40px", background: "linear-gradient(135deg, var(--color-accent), #7c3aed)", color: "#fff", borderRadius: "12px", fontWeight: 700, textDecoration: "none", fontSize: "16px", boxShadow: "0 4px 16px rgba(37,99,235,0.35)" }}>
              {user ? "Pro'ya Geç →" : "Giriş Yap →"}
            </Link>
            {sampleId && (
              <Link href={`/raporlar/${sampleId}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "var(--color-surface)", color: "var(--color-text-2)", border: "1px solid var(--color-border)", borderRadius: "12px", fontWeight: 600, textDecoration: "none", fontSize: "15px" }}>
                📄 Örnek Raporu Gör
              </Link>
            )}
          </div>
        </div>

        {/* Blur preview */}
        <div style={{ position: "relative" }}>
          <div style={{ userSelect: "none", pointerEvents: "none" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", filter: "blur(4px)", opacity: 0.4 }}>
              {[
                { type: "weekly", period: "17–23 Mart 2025", title: "Jeopolitik Gerilim Raporu" },
                { type: "monthly", period: "Mart 2025", title: "Aylık Medya İzleme Raporu" },
                { type: "weekly", period: "10–16 Mart 2025", title: "Medya Tonu & Duygu Analizi" },
              ].map((r, i) => (
                <div key={i} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "24px" }}>
                  <span style={{ background: r.type === "monthly" ? "var(--color-accent)" : "#7c3aed", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>
                    {r.type === "monthly" ? "AYLIK" : "HAFTALIK"}
                  </span>
                  <p style={{ fontSize: "12px", color: "var(--color-text-3)", margin: "10px 0 4px" }}>{r.period}</p>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text)", margin: "0" }}>{r.title}</h3>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60px", background: "linear-gradient(to bottom, transparent, var(--color-bg))", pointerEvents: "none" }} />
        </div>
      </main>
    )
  }

  const filtered = reports.filter(r => r.type === activeTab)

  function getExpiryInfo(report: Report): { date: Date; daysLeft: number } | null {
    const periodEnd = new Date(report.period_end)
    const deleteAfter = report.type === "weekly"
      ? new Date(periodEnd.getTime() + 8 * 7 * 24 * 60 * 60 * 1000)
      : new Date(periodEnd.getTime() + 365 * 24 * 60 * 60 * 1000)
    const daysLeft = Math.ceil((deleteAfter.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 14) return { date: deleteAfter, daysLeft }
    return null
  }

  function formatPeriod(report: Report) {
    const s = new Date(report.period_start).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    const e = new Date(report.period_end).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    return report.type === "monthly" ? s.slice(s.indexOf(" ") + 1) : `${s} – ${e}`
  }

  return (
    <main style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 20px" }}>

      {/* Hero banner */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)", borderRadius: "20px", padding: "36px", marginBottom: "32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "200px", height: "200px", background: "rgba(255,255,255,0.06)", borderRadius: "50%" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 28 }}>📊</span>
            <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>PRO</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 8, lineHeight: 1.2 }}>Medya Analiz Raporları</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, maxWidth: 520, margin: 0 }}>
            Yapay zeka destekli haftalık ve aylık medya analiz raporları. Filtreleyerek odaklanmak istediğiniz
            konuları seçin ve özelleştirilmiş rapor oluşturun.
          </p>
        </div>
      </div>

      {/* Sekme + Admin panel */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {(["weekly", "monthly"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "10px 24px", borderRadius: "10px",
              border: activeTab === tab ? "none" : "1px solid var(--color-border)",
              background: activeTab === tab ? "linear-gradient(135deg, var(--color-accent), #7c3aed)" : "var(--color-surface)",
              color: activeTab === tab ? "#fff" : "var(--color-text-2)",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>
              {tab === "weekly" ? "Haftalık" : "Aylık"}
            </button>
          ))}
        </div>

        {user?.is_admin && (
          <button
            onClick={() => setShowGenPanel(v => !v)}
            style={{
              padding: "10px 18px", fontSize: 13, fontWeight: 600, borderRadius: 10,
              background: showGenPanel ? "rgba(124,58,237,0.15)" : "var(--color-surface)",
              border: "1px solid rgba(124,58,237,0.3)", color: "#7c3aed", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            ⚡ Rapor Oluştur {showGenPanel ? "▲" : "▼"}
          </button>
        )}
      </div>

      {/* Admin rapor oluşturma paneli */}
      {user?.is_admin && showGenPanel && (
        <div style={{
          background: "var(--color-surface)", border: "1px solid rgba(124,58,237,0.25)",
          borderRadius: 16, padding: "24px", marginBottom: 24,
          boxShadow: "0 4px 24px rgba(124,58,237,0.08)",
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: "0 0 20px" }}>
            ⚙️ Rapor Parametreleri
          </h3>

          {/* Odak */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 8 }}>
              Odak Seçimi
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { value: "all",            label: "🌐 Tümü" },
                { value: "kutuplasmalar", label: "🇹🇷 Kutuplaşmalar" },
                { value: "international", label: "🌍 Uluslararası" },
              ].map(opt => (
                <button key={opt.value} onClick={() => setFilters(f => ({ ...f, focus: opt.value as GenFilters["focus"] }))}
                  style={{
                    padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    background: filters.focus === opt.value ? "var(--color-accent)" : "var(--color-surface-2)",
                    color: filters.focus === opt.value ? "#fff" : "var(--color-text-2)",
                    border: filters.focus === opt.value ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ülkeler - sadece kutuplaşmalar değilse göster */}
          {filters.focus !== "kutuplasmalar" && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 8 }}>
                Ülke Filtresi <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-3)" }}>(seçilmezse tümü dahil)</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {COUNTRIES.map(c => {
                  const sel = filters.countries.includes(c.code)
                  return (
                    <button key={c.code} onClick={() => toggleCountry(c.code)} style={{
                      padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: sel ? "rgba(37,99,235,0.12)" : "var(--color-surface-2)",
                      color: sel ? "var(--color-accent)" : "var(--color-text-2)",
                      border: sel ? "1px solid rgba(37,99,235,0.4)" : "1px solid var(--color-border)",
                    }}>
                      {c.code} <span style={{ fontSize: 11, fontWeight: 400 }}>{c.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Kategoriler */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 8 }}>
              Kategori Filtresi <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-3)" }}>(seçilmezse tümü dahil)</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map(cat => {
                const sel = filters.categories.includes(cat)
                return (
                  <button key={cat} onClick={() => toggleCategory(cat)} style={{
                    padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: sel ? "rgba(124,58,237,0.12)" : "var(--color-surface-2)",
                    color: sel ? "#7c3aed" : "var(--color-text-2)",
                    border: sel ? "1px solid rgba(124,58,237,0.4)" : "1px solid var(--color-border)",
                  }}>
                    {CAT_LABELS[cat] ?? cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mesaj */}
          {genMsg && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16,
              background: genMsg.type === "ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${genMsg.type === "ok" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: genMsg.type === "ok" ? "#16a34a" : "#dc2626",
            }}>
              {genMsg.text}
            </div>
          )}

          {/* Butonlar */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => generateReport("weekly")} disabled={!!generating} style={{
              padding: "11px 20px", fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: generating ? "not-allowed" : "pointer",
              background: generating === "weekly" ? "rgba(124,58,237,0.5)" : "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.3)", color: "#7c3aed",
              display: "flex", alignItems: "center", gap: 6, opacity: generating && generating !== "weekly" ? 0.5 : 1,
            }}>
              {generating === "weekly" ? "⏳ Üretiliyor..." : "⚡ Haftalık Rapor Üret"}
            </button>
            <button onClick={() => generateReport("monthly")} disabled={!!generating} style={{
              padding: "11px 20px", fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: generating ? "not-allowed" : "pointer",
              background: generating === "monthly" ? "rgba(37,99,235,0.5)" : "rgba(37,99,235,0.1)",
              border: "1px solid rgba(37,99,235,0.3)", color: "#2563eb",
              display: "flex", alignItems: "center", gap: 6, opacity: generating && generating !== "monthly" ? 0.5 : 1,
            }}>
              {generating === "monthly" ? "⏳ Üretiliyor..." : "⚡ Aylık Rapor Üret"}
            </button>
          </div>
        </div>
      )}

      {/* Rapor listesi */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
        {loadingReports && (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 28, animation: "pulse 1.5s ease-in-out infinite" }}>
                <div style={{ height: 14, background: "var(--color-border)", borderRadius: 4, width: "20%", marginBottom: 12 }} />
                <div style={{ height: 20, background: "var(--color-border)", borderRadius: 4, width: "60%", marginBottom: 16 }} />
                <div style={{ height: 12, background: "var(--color-border)", borderRadius: 4, width: "90%", marginBottom: 8 }} />
                <div style={{ height: 12, background: "var(--color-border)", borderRadius: 4, width: "75%" }} />
              </div>
            ))}
          </>
        )}

        {!loadingReports && filtered.length === 0 && (
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "48px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
              Henüz {activeTab === "weekly" ? "haftalık" : "aylık"} rapor yok
            </h3>
            <p style={{ fontSize: 13, color: "var(--color-text-3)", lineHeight: 1.7, margin: 0 }}>
              Raporlar yeterli veri toplandıktan sonra otomatik oluşturulur. Admin olarak yukarıdan manuel üretebilirsiniz.
            </p>
          </div>
        )}

        {!loadingReports && filtered.map(report => {
          const highlights: string[] = report.content?.highlights ?? []
          const stats = report.content?.stats ?? {}
          const meta = report.content?.meta ?? {}
          const expiry = getExpiryInfo(report)

          return (
            <div key={report.id} style={{ background: "var(--color-surface)", border: `1px solid ${expiry ? "rgba(245,158,11,0.4)" : "var(--color-border)"}`, borderRadius: 16, padding: "28px", transition: "border-color 0.2s", }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                {/* Sol */}
                <div style={{ flex: 1, minWidth: 240 }}>
                  {/* Badges */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ background: report.type === "monthly" ? "var(--color-accent)" : "#7c3aed", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                      {report.type === "monthly" ? "AYLIK" : "HAFTALIK"}
                    </span>
                    {meta.focus && meta.focus !== "all" && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(37,99,235,0.08)", color: "var(--color-accent)", border: "1px solid rgba(37,99,235,0.2)" }}>
                        {meta.focus === "kutuplasmalar" ? "🇹🇷 Kutuplaşmalar" : "🌍 Uluslararası"}
                      </span>
                    )}
                    {meta.countries && meta.countries.length > 0 && (
                      <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>
                        {meta.countries.join(", ")}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 6, fontWeight: 500 }}>
                    🗓 {formatPeriod(report)}
                  </p>

                  <h2 style={{ fontSize: 19, fontWeight: 800, color: "var(--color-text)", margin: "0 0 16px", lineHeight: 1.3 }}>
                    {report.title}
                  </h2>

                  {highlights.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                      {highlights.slice(0, 3).map((h, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-accent)", flexShrink: 0, marginTop: 7 }} />
                          <span style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.5 }}>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {(stats.events || stats.sources || stats.countries) && (
                    <div style={{ display: "flex", gap: 16, marginTop: 16, padding: "10px 16px", background: "var(--color-surface-2)", borderRadius: 10, flexWrap: "wrap" }}>
                      {[
                        { label: "Haber", value: stats.events },
                        { label: "Kaynak", value: stats.sources },
                        { label: "Ülke", value: stats.countries },
                      ].filter(s => s.value).map(s => (
                        <div key={s.label} style={{ textAlign: "center", minWidth: 50 }}>
                          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--color-accent)" }}>{s.value}</div>
                          <div style={{ fontSize: 11, color: "var(--color-text-3)", fontWeight: 500 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Silinme uyarısı */}
                  {expiry && (
                    <div style={{
                      marginTop: 14, padding: "8px 12px", borderRadius: 8, fontSize: 12,
                      background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
                      color: "#d97706", display: "flex", alignItems: "center", gap: 6,
                    }}>
                      ⚠️ Bu rapor {expiry.date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} tarihinde sistemden silinecektir.
                    </div>
                  )}
                </div>

                {/* Sağ butonlar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 150 }}>
                  <Link href={`/raporlar/${report.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 20px", background: "linear-gradient(135deg, var(--color-accent), #7c3aed)", color: "#fff", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: 14, boxShadow: "0 3px 12px rgba(37,99,235,0.3)" }}>
                    📖 Görüntüle
                  </Link>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/raporlar/${report.id}`
                      navigator.clipboard.writeText(url).catch(() => {})
                    }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 20px", background: "var(--color-surface-2)", color: "var(--color-text-2)", border: "1px solid var(--color-border)", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                  >
                    🔗 Linki Kopyala
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bilgi kartı */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 28 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)", marginBottom: 20 }}>Raporlar Hakkında</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {[
            { icon: "🤖", title: "Yapay Zeka Destekli", desc: "Tüm raporlar Gemini AI ile otomatik üretilir. Haber verileri analiz edilerek özetlenir." },
            { icon: "🎯", title: "Özelleştirilebilir", desc: "Kutuplaşma, uluslararası veya kategori odaklı raporlar oluşturabilirsiniz." },
            { icon: "📄", title: "PDF & Sesli Okuma", desc: "Raporları PDF olarak kaydedebilir veya sesli dinleyebilirsiniz." },
          ].map(item => (
            <div key={item.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
