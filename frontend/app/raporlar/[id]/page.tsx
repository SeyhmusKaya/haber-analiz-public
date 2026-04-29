"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis"

const API_URL = ""

const CAT_LABEL: Record<string, string> = {
  "siyaset": "Siyaset", "ekonomi": "Ekonomi", "savas-catisma": "Savaş/Çatışma",
  "diplomasi": "Diplomasi", "teknoloji": "Teknoloji", "saglik": "Sağlık",
  "cevre": "Çevre", "spor": "Spor", "kultur": "Kültür", "diger": "Diğer",
}

interface ReportContent {
  title?: string
  summary?: string
  highlights?: string[]
  top_categories?: string[]
  stats?: { events?: number; sources?: number; countries?: number }
  meta?: { focus?: string; countries?: string[] | null; categories?: string[] | null }
}

interface Report {
  id: number
  type: "weekly" | "monthly"
  title: string
  period_start: string
  period_end: string
  content: ReportContent
  html_content?: string | null
  pdf_url?: string | null
  created_at: string
}

export default function RaporDetayPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const { speak, pause, resume, stop, speaking, paused } = useSpeechSynthesis()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

    async function load() {
      try {
        const r = await fetch(`${API_URL}/api/reports/${id}`, {
          headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })
        if (r.ok) {
          const d = await r.json()
          if (d && !d.message) { setReport(d); return }
        }
        // 401/403 veya boş → örnek raporu getir
        if (r.status === 401 || r.status === 403 || r.status === 404) {
          const s = await fetch(`${API_URL}/api/reports/sample`, { headers: { Accept: "application/json" } })
          const d = await s.json()
          if (d && !d.message) setReport(d)
        }
      } catch { /* sessizce atla */ }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  function buildAudioText(report: Report): string {
    const c = report.content ?? {}
    const parts: string[] = [report.title]
    if (c.summary) parts.push(c.summary)
    if (c.highlights?.length) {
      parts.push("Öne çıkan bulgular:")
      c.highlights.forEach((h, i) => parts.push(`${i + 1}. ${h}`))
    }
    return parts.join(". ")
  }

  function handleAudio() {
    if (!report) return
    if (speaking && !paused) { pause(); return }
    if (paused) { resume(); return }
    speak(buildAudioText(report))
  }

  function handleShare() {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }).catch(() => {})
  }

  async function handlePrint() {
    if (pdfLoading) return
    setPdfLoading(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      const res = await fetch(`${API_URL}/api/reports/${id}/pdf`, {
        headers: {
          Accept: "application/pdf",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) throw new Error("PDF oluşturulamadı")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `medyaizle-rapor-${report?.period_start ?? id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("PDF indirilemedi. Lütfen tekrar deneyin.")
    } finally {
      setPdfLoading(false)
    }
  }

  function formatPeriod(report: Report) {
    const s = new Date(report.period_start).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    const e = new Date(report.period_end).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    return report.type === "monthly" ? s.slice(s.indexOf(" ") + 1) : `${s} – ${e}`
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: "48px auto", padding: "0 20px" }}>
        {[80, 60, 90, 70, 50].map((w, i) => (
          <div key={i} style={{ height: i === 2 ? 24 : 14, background: "var(--color-border)", borderRadius: 6, marginBottom: 16, width: `${w}%`, animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
    )
  }

  if (!report) {
    return (
      <div style={{ maxWidth: 800, margin: "48px auto", padding: "0 20px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <h2 style={{ fontSize: 20, color: "var(--color-text)", marginBottom: 8 }}>Rapor bulunamadı</h2>
        <p style={{ color: "var(--color-text-3)", marginBottom: 24 }}>Bu rapor mevcut değil veya erişim yetkiniz yok.</p>
        <Link href="/raporlar" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>← Raporlara Dön</Link>
      </div>
    )
  }

  const content = report.content ?? {}
  const highlights = content.highlights ?? []
  const topCats = content.top_categories ?? []
  const stats = content.stats ?? {}
  const meta = content.meta ?? {}
  const typeLabel = report.type === "weekly" ? "Haftalık Rapor" : "Aylık Rapor"

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          header, nav, footer, .no-print { display: none !important; }
          .print-area { max-width: 100% !important; padding: 20px !important; }
          body { background: white !important; }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      <div className="print-area" style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>

        {/* Breadcrumb */}
        <div className="no-print" style={{ marginBottom: 24 }}>
          <Link href="/raporlar" style={{ fontSize: 13, color: "var(--color-text-3)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            ← Raporlara Dön
          </Link>
        </div>

        {/* Başlık alanı */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99,
              background: report.type === "monthly" ? "var(--color-accent)" : "#7c3aed",
              color: "#fff",
            }}>
              {typeLabel.toUpperCase()}
            </span>
            {meta.focus && meta.focus !== "all" && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99, background: "rgba(37,99,235,0.08)", color: "var(--color-accent)", border: "1px solid rgba(37,99,235,0.2)" }}>
                {meta.focus === "kutuplasmalar" ? "🇹🇷 Kutuplaşmalar" : "🌍 Uluslararası"}
              </span>
            )}
            <span style={{ fontSize: 12, color: "var(--color-text-3)", fontWeight: 500 }}>
              🗓 {formatPeriod(report)}
            </span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text)", margin: "0 0 8px", lineHeight: 1.25 }}>
            {report.title}
          </h1>

          <p style={{ fontSize: 13, color: "var(--color-text-3)", margin: 0 }}>
            Oluşturulma: {new Date(report.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Aksiyon çubuğu */}
        <div className="no-print" style={{
          display: "flex", gap: 10, marginBottom: 28, padding: "14px 18px",
          background: "var(--color-surface)", border: "1px solid var(--color-border)",
          borderRadius: 14, flexWrap: "wrap", alignItems: "center",
        }}>
          {/* Sesli okuma */}
          <button
            onClick={handleAudio}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: speaking ? "rgba(37,99,235,0.12)" : "var(--color-surface-2)",
              color: speaking ? "var(--color-accent)" : "var(--color-text-2)",
              border: speaking ? "1px solid rgba(37,99,235,0.3)" : "1px solid var(--color-border)",
            }}
          >
            {speaking && !paused ? "⏸" : paused ? "▶️" : "🔊"}
            {speaking && !paused ? "Duraklat" : paused ? "Devam Et" : "Sesli Dinle"}
          </button>

          {speaking && (
            <button onClick={stop} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "var(--color-surface-2)", color: "var(--color-text-3)", border: "1px solid var(--color-border)" }}>
              ⏹ Durdur
            </button>
          )}

          <div style={{ width: 1, height: 28, background: "var(--color-border)", margin: "0 2px" }} />

          {/* Paylaş */}
          <button onClick={handleShare} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", background: copied ? "rgba(34,197,94,0.1)" : "var(--color-surface-2)", color: copied ? "#16a34a" : "var(--color-text-2)", border: copied ? "1px solid rgba(34,197,94,0.3)" : "1px solid var(--color-border)", transition: "all 0.2s" }}>
            {copied ? "✓ Kopyalandı!" : "🔗 Linki Paylaş"}
          </button>

          {/* PDF */}
          <button onClick={handlePrint} disabled={pdfLoading} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: pdfLoading ? "wait" : "pointer", background: pdfLoading ? "rgba(37,99,235,0.1)" : "var(--color-surface-2)", color: pdfLoading ? "var(--color-accent)" : "var(--color-text-2)", border: pdfLoading ? "1px solid rgba(37,99,235,0.3)" : "1px solid var(--color-border)", transition: "all 0.2s" }}>
            {pdfLoading ? "⏳ Hazırlanıyor..." : "⬇️ PDF İndir"}
          </button>

          {report.pdf_url && (
            <a href={report.pdf_url} target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "rgba(37,99,235,0.1)", color: "var(--color-accent)", border: "1px solid rgba(37,99,235,0.2)" }}>
              📄 PDF Dosyası
            </a>
          )}

          <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-text-3)" }}>
            {user ? (
              <span style={{ fontSize: 11 }}>🔒 Yalnızca üyeler görüntüleyebilir</span>
            ) : null}
          </div>
        </div>

        {/* İçerik */}
        <div ref={contentRef}>
          {report.html_content ? (
            // Yeni raporlar - önceden üretilmiş HTML
            <div
              dangerouslySetInnerHTML={{ __html: report.html_content }}
              style={{ fontSize: 14, color: "var(--color-text-2)", lineHeight: 1.8 }}
            />
          ) : (
            // Eski raporlar veya fallback - JSON alanlardan structured render
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

              {/* Özet */}
              {content.summary && (
                <ReportSection title="📝 Dönem Özeti">
                  <p style={{ fontSize: 15, lineHeight: 1.85, color: "var(--color-text-2)", margin: 0 }}>
                    {content.summary}
                  </p>
                </ReportSection>
              )}

              {/* Öne çıkan bulgular */}
              {highlights.length > 0 && (
                <ReportSection title="🔍 Öne Çıkan Bulgular">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {highlights.map((h, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px", background: "var(--color-surface-2)", borderRadius: 10, borderLeft: "3px solid var(--color-accent)" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-accent)", flexShrink: 0, minWidth: 20 }}>{i + 1}.</span>
                        <span style={{ fontSize: 14, color: "var(--color-text-2)", lineHeight: 1.65 }}>{h}</span>
                      </div>
                    ))}
                  </div>
                </ReportSection>
              )}

              {/* Kategoriler */}
              {topCats.length > 0 && (
                <ReportSection title="📂 Öne Çıkan Kategoriler">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {topCats.map(cat => (
                      <span key={cat} style={{ fontSize: 13, fontWeight: 600, padding: "6px 16px", borderRadius: 99, background: "rgba(124,58,237,0.1)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)" }}>
                        {CAT_LABEL[cat] ?? cat}
                      </span>
                    ))}
                  </div>
                </ReportSection>
              )}

              {/* İstatistikler */}
              {(stats.events || stats.sources || stats.countries) && (
                <ReportSection title="📊 Dönem İstatistikleri">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                    {[
                      { icon: "📰", value: stats.events,    label: "Haber Analiz Edildi" },
                      { icon: "📡", value: stats.sources,   label: "Aktif Kaynak" },
                      { icon: "🌍", value: stats.countries, label: "Ülke Kapsandı" },
                    ].map(s => s.value ? (
                      <div key={s.label} style={{ textAlign: "center", padding: "20px 16px", background: "var(--color-surface-2)", borderRadius: 12, border: "1px solid var(--color-border)" }}>
                        <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-accent)", marginBottom: 4 }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "var(--color-text-3)", fontWeight: 500 }}>{s.label}</div>
                      </div>
                    ) : null)}
                  </div>
                </ReportSection>
              )}

              {/* Filtre metadata */}
              {(meta.focus && meta.focus !== "all") || (meta.countries?.length) || (meta.categories?.length) ? (
                <ReportSection title="⚙️ Rapor Parametreleri">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {meta.focus && meta.focus !== "all" && (
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8, background: "var(--color-accent)", color: "#fff" }}>
                        {meta.focus === "kutuplasmalar" ? "🇹🇷 Kutuplaşmalar" : "🌍 Uluslararası"}
                      </span>
                    )}
                    {meta.countries?.map(c => (
                      <span key={c} style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: "rgba(37,99,235,0.08)", color: "var(--color-accent)", border: "1px solid rgba(37,99,235,0.2)" }}>{c}</span>
                    ))}
                    {meta.categories?.map(c => (
                      <span key={c} style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)" }}>{CAT_LABEL[c] ?? c}</span>
                    ))}
                  </div>
                </ReportSection>
              ) : null}
            </div>
          )}
        </div>

        {/* Alt navigasyon */}
        <div className="no-print" style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Link href="/raporlar" style={{ fontSize: 14, color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>
            ← Tüm Raporlar
          </Link>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleShare} style={{ padding: "9px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text-2)", border: "1px solid var(--color-border)" }}>
              🔗 {copied ? "Kopyalandı!" : "Paylaş"}
            </button>
            <button onClick={handlePrint} disabled={pdfLoading} style={{ padding: "9px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: pdfLoading ? "wait" : "pointer", background: "var(--color-surface)", color: "var(--color-text-2)", border: "1px solid var(--color-border)" }}>
              {pdfLoading ? "⏳ Hazırlanıyor..." : "⬇️ PDF İndir"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
