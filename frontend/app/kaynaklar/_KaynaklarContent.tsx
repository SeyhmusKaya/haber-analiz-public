"use client"

import { useState, useEffect } from "react"

interface ApiSource {
  id: number
  name: string
  slug: string
  rss_url: string
  site_url?: string
  country_code: string
  bias: "pro_gov" | "opposition"
  language: string
  importance_score: number
  is_active: boolean
  article_count?: number
}

interface CountryMeta {
  name: string
  gradient: string
}

const COUNTRY_META: Record<string, CountryMeta> = {
  TR: { name: "Türkiye",           gradient: "linear-gradient(135deg, #e11d48 0%, #9f1239 100%)" },
  US: { name: "ABD",               gradient: "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)" },
  GB: { name: "İngiltere",         gradient: "linear-gradient(135deg, #0f172a 0%, #1e40af 100%)" },
  DE: { name: "Almanya",           gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" },
  RU: { name: "Rusya",             gradient: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)" },
  CN: { name: "Çin",               gradient: "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)" },
  IR: { name: "İran",              gradient: "linear-gradient(135deg, #166534 0%, #14532d 100%)" },
  IL: { name: "İsrail",            gradient: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)" },
  SA: { name: "Suudi Arabistan",   gradient: "linear-gradient(135deg, #14532d 0%, #166534 100%)" },
  EG: { name: "Mısır",             gradient: "linear-gradient(135deg, #92400e 0%, #78350f 100%)" },
}

function faviconUrl(url?: string) {
  if (!url) return ""
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ""
  }
}

const ExtIcon = () => (
  <svg
    width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ opacity: 0.35, flexShrink: 0, transition: "opacity 0.15s" }}
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

function FaviconImg({ url, name }: { url?: string; name: string }) {
  const src = faviconUrl(url)
  if (!src) return null
  return (
    <img
      src={src}
      alt=""
      width={14}
      height={14}
      style={{
        width: 14, height: 14, borderRadius: 3,
        objectFit: "contain", flexShrink: 0,
        background: "var(--color-surface-2)",
      }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
    />
  )
}

function SourceItem({ source }: { source: ApiSource }) {
  const href = source.site_url || source.rss_url
  const biasColor = source.bias === "pro_gov" ? "#dc2626" : "#16a34a"
  return (
    <li>
      <a href={href} target="_blank" rel="noopener noreferrer" className="kaynak-link">
        <span className="bias-dot" style={{ background: biasColor }} />
        <FaviconImg url={source.site_url || source.rss_url} name={source.name} />
        <span className="source-name">{source.name}</span>
        <ExtIcon />
      </a>
    </li>
  )
}

function CountryCard({ code, proGov, opposition }: {
  code: string
  proGov: ApiSource[]
  opposition: ApiSource[]
}) {
  const meta = COUNTRY_META[code] ?? { name: code, gradient: "linear-gradient(135deg, #374151, #1f2937)" }
  const total = proGov.length + opposition.length

  const half = Math.ceil(proGov.length / 2)
  const proGov1 = proGov.slice(0, half)
  const proGov2 = proGov.slice(half)
  const oppHalf = Math.ceil(opposition.length / 2)
  const opp1 = opposition.slice(0, oppHalf)
  const opp2 = opposition.slice(oppHalf)

  return (
    <div className="country-card">
      <div className="country-header" style={{ background: meta.gradient }}>
        <img
          className="country-flag"
          src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
          alt={meta.name}
        />
        <span className="country-name">{meta.name}</span>
        <span className="source-count-badge">{total} kaynak</span>
      </div>

      <div className="country-body">
        {/* Yandaş sütun 1 */}
        {proGov1.length > 0 && (
          <div className="sources-column">
            <h3 className="col-header pro-gov">
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#dc2626" }} />
              Yandaş
            </h3>
            <ul className="sources-list">
              {proGov1.map(s => <SourceItem key={s.id} source={s} />)}
            </ul>
          </div>
        )}

        {/* Yandaş sütun 2 */}
        {proGov2.length > 0 && (
          <div className="sources-column">
            <h3 className="col-header pro-gov">
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#dc2626" }} />
              Yandaş
            </h3>
            <ul className="sources-list">
              {proGov2.map(s => <SourceItem key={s.id} source={s} />)}
            </ul>
          </div>
        )}

        {/* Muhalif sütun 1 */}
        {opp1.length > 0 && (
          <div className="sources-column">
            <h3 className="col-header opp">
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#16a34a" }} />
              Muhalif
            </h3>
            <ul className="sources-list">
              {opp1.map(s => <SourceItem key={s.id} source={s} />)}
            </ul>
          </div>
        )}

        {/* Muhalif sütun 2 */}
        {opp2.length > 0 && (
          <div className="sources-column">
            <h3 className="col-header opp">
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#16a34a" }} />
              Muhalif
            </h3>
            <ul className="sources-list">
              {opp2.map(s => <SourceItem key={s.id} source={s} />)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default function KaynaklarContent() {
  const [sources, setSources] = useState<ApiSource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/sources")
      .then(r => r.json())
      .then(d => {
        // API zaten sadece is_active=true döndürür; importance_score'a göre sırala
        const sorted = (d.sources ?? []).sort(
          (a: ApiSource, b: ApiSource) => b.importance_score - a.importance_score
        )
        setSources(sorted)
      })
      .catch(() => setSources([]))
      .finally(() => setLoading(false))
  }, [])

  // Ülke grupları
  const byCountry: Record<string, { proGov: ApiSource[]; opposition: ApiSource[] }> = {}
  for (const s of sources) {
    if (!byCountry[s.country_code]) byCountry[s.country_code] = { proGov: [], opposition: [] }
    if (s.bias === "pro_gov") byCountry[s.country_code].proGov.push(s)
    else byCountry[s.country_code].opposition.push(s)
  }

  const countryCount = Object.keys(byCountry).length
  const totalSources = sources.length

  return (
    <>
      <style>{`
        .kaynak-link {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          color: var(--color-text);
          text-decoration: none;
          padding: 7px 10px;
          border-radius: 8px;
          transition: background 0.15s ease, color 0.15s ease;
          width: 100%;
        }
        .kaynak-link:hover {
          background: rgba(37, 99, 235, 0.08);
          color: var(--color-accent, #2563eb);
        }
        .kaynak-link:hover svg {
          opacity: 0.8 !important;
        }
        .source-name {
          flex: 1;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bias-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .country-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .country-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        }
        .country-header {
          padding: 18px 24px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .country-flag {
          width: 44px;
          height: 33px;
          object-fit: cover;
          border-radius: 5px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          flex-shrink: 0;
        }
        .country-name {
          font-size: 19px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.3px;
        }
        .source-count-badge {
          margin-left: auto;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          background: rgba(255,255,255,0.15);
          border-radius: 999px;
          padding: 3px 12px;
          backdrop-filter: blur(4px);
        }
        .country-body {
          padding: 18px 20px 22px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 860px) {
          .country-body { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .country-body { grid-template-columns: 1fr; }
        }
        .sources-column {}
        .col-header {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          margin: 0 0 8px 0;
          padding: 0 0 8px 0;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .col-header.pro-gov { color: #dc2626; }
        .col-header.opp { color: #16a34a; }
        .sources-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .hero-stat {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(37, 99, 235, 0.07);
          border: 1px solid rgba(37, 99, 235, 0.18);
          border-radius: 999px;
          padding: 7px 18px;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-accent, #2563eb);
        }
        .legend-row {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--color-text-2);
        }
        .skeleton-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          overflow: hidden;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 20px 64px" }}>

        {/* Başlık */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: "clamp(24px,5vw,34px)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            Haber Kaynakları
          </h1>
          <p style={{ fontSize: 15, color: "var(--color-text-2)", lineHeight: 1.7, margin: "0 0 24px", maxWidth: 640 }}>
            {loading ? (
              "Kaynaklar yükleniyor..."
            ) : (
              <>
                <strong>{countryCount}</strong> ülkeden{" "}
                <strong style={{ color: "var(--color-text)" }}>{totalSources} haber kaynağını</strong> takip ediyoruz.
                Yandaş ve muhalif medya dengeli biçimde temsil edilmektedir.
              </>
            )}
          </p>

          {/* Stats */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
            <span className="hero-stat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {loading ? "..." : `${countryCount} Ülke`}
            </span>
            <span className="hero-stat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
              </svg>
              {loading ? "..." : `${totalSources} Kaynak`}
            </span>
            <span className="hero-stat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Dengeli Temsil
            </span>
          </div>

          {/* Legend */}
          <div className="legend-row">
            <div className="legend-item">
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#dc2626" }} />
              <span>Yandaş Medya</span>
            </div>
            <div className="legend-item">
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a" }} />
              <span>Muhalif Medya</span>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-text-3)" }}>
              Kaynağa gitmek için üzerine tıklayın
            </div>
          </div>
        </div>

        {/* Yükleniyor skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-card">
                <div style={{ height: 70, background: "var(--color-border)" }} />
                <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} style={{ height: 160, borderRadius: 8, background: "var(--color-border)" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ülke kartları */}
        {!loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {Object.entries(byCountry).sort(([a], [b]) => a === "TR" ? -1 : b === "TR" ? 1 : a.localeCompare(b)).map(([code, { proGov, opposition }]) => (
              <CountryCard key={code} code={code} proGov={proGov} opposition={opposition} />
            ))}
            {Object.keys(byCountry).length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: "var(--color-text-3)", fontSize: 14 }}>
                Henüz kaynak bulunmuyor.
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        {!loading && (
          <div style={{
            marginTop: 48,
            background: "linear-gradient(135deg, rgba(37,99,235,0.07), rgba(139,92,246,0.07))",
            border: "1px solid rgba(37,99,235,0.18)",
            borderRadius: 16,
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>💡</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                  Kaynak veya Ülke Önerisi
                </h3>
              </div>
              <p style={{ fontSize: 13, color: "var(--color-text-2)", margin: 0, maxWidth: 500, lineHeight: 1.6 }}>
                Takip etmemizi istediğiniz bir haber kaynağı ya da sisteme eklenmesini istediğiniz bir ülke mi var?
              </p>
            </div>
            <a
              href="/iletisim"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 22px", background: "var(--color-accent)",
                color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 600,
                textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              İletişime Geç
            </a>
          </div>
        )}
      </main>
    </>
  )
}
