"use client"

import { useState, useEffect } from "react"

const API_URL = ""

const COUNTRY_META: Record<string, { name: string; code: string }> = {
  TR: { name: "Türkiye", code: "tr" },
  US: { name: "ABD", code: "us" },
  GB: { name: "İngiltere", code: "gb" },
  DE: { name: "Almanya", code: "de" },
  RU: { name: "Rusya", code: "ru" },
  CN: { name: "Çin", code: "cn" },
  IR: { name: "İran", code: "ir" },
  IL: { name: "İsrail", code: "il" },
  SA: { name: "Suudi Arabistan", code: "sa" },
  EG: { name: "Mısır", code: "eg" },
}

interface CountryVote {
  code: string
  name: string
  count: number
  pct: number
}

interface Stats {
  total_votes: number
  countries: CountryVote[]
}

interface CountryWin {
  country_code: string
  name: string
  wins: number
  total_events: number
  win_pct: number
}

function CountryFlag({ code, size = 24 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
      alt={code}
      width={size}
      height={Math.round(size * 0.7)}
      style={{ borderRadius: 3, objectFit: "cover", display: "block", flexShrink: 0 }}
      onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
    />
  )
}

function BarRow({ label, pct, color, flag }: { label: string; pct: number; color: string; flag?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "var(--color-text-2)", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {flag && <CountryFlag code={flag} size={18} />}
          <span>{label}</span>
        </div>
        <span style={{ fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: "var(--color-border)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
    </div>
  )
}

const BAR_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#6366f1", "#14b8a6", "#f97316"]

interface TrBiasStats {
  total_votes: number
  pro_gov: number; opposition: number; both: number; undecided: number
  pro_gov_pct: number; opposition_pct: number; both_pct: number; undecided_pct: number
}

export default function KonsensusPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [countryWins, setCountryWins] = useState<CountryWin[]>([])
  const [trBias, setTrBias] = useState<TrBiasStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/votes/stats`).then(r => r.json()),
      fetch(`${API_URL}/api/votes/country-stats`).then(r => r.json()),
      fetch(`${API_URL}/api/votes/tr-bias-stats`).then(r => r.json()),
    ])
      .then(([s, cs, tb]) => {
        setStats(s)
        setCountryWins(Array.isArray(cs) ? cs : [])
        setTrBias(tb?.total_votes > 0 ? tb : null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px 60px" }}>
      {/* Hero header */}
      <div style={{
        background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))",
        border: "1px solid var(--color-border)",
        borderRadius: 20, padding: "32px 28px", marginBottom: 28,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🗳️</div>
        <h1 style={{ fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
          Okuyucu Konsensüs
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-text-3)", maxWidth: 500, margin: "0 auto" }}>
          Okuyucular haberlerde hangi ülkenin medyasını daha doğru buluyor?
        </p>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 110, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : !stats || stats.total_votes === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--color-text-3)", fontSize: 15 }}>
          Henüz oy verisi bulunmuyor.
        </div>
      ) : (
        <>
          {/* Toplam oy + en çok seçilen */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
            <div style={{
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
              borderRadius: 16, padding: "20px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>📊</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-accent)", letterSpacing: "-0.02em" }}>{stats.total_votes}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 4, fontWeight: 500 }}>Toplam Oy</div>
            </div>
            {stats.countries.slice(0, 3).map((c, i) => {
              const meta = COUNTRY_META[c.code]
              return (
                <div key={c.code} style={{
                  background: "var(--color-surface)", border: "1px solid var(--color-border)",
                  borderRadius: 16, padding: "20px 16px", textAlign: "center",
                }}>
                  <CountryFlag code={meta?.code ?? c.code.toLowerCase()} size={28} />
                  <div style={{ fontSize: 26, fontWeight: 800, color: BAR_COLORS[i], letterSpacing: "-0.02em", marginTop: 6 }}>{c.pct}%</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 4, fontWeight: 500 }}>{c.name}</div>
                </div>
              )
            })}
          </div>

          {/* Ülke bazlı oy dağılımı — sıralı kartlar */}
          <div style={{
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: 16, padding: "24px 28px", marginBottom: 20,
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>
              🌍 Ülke Bazlı Oy Dağılımı
            </h2>
            <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 20 }}>
              Okuyucular hangi ülkenin medyasını daha güvenilir buluyor?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.countries.map((c, i) => {
                const meta = COUNTRY_META[c.code]
                const color = BAR_COLORS[i % BAR_COLORS.length]
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null
                return (
                  <div key={c.code} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px",
                    background: i < 3 ? `${color}0a` : "var(--color-surface-2)",
                    border: `1px solid ${i < 3 ? `${color}25` : "var(--color-border)"}`,
                    borderRadius: 14,
                    position: "relative", overflow: "hidden",
                  }}>
                    {/* Background bar */}
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0,
                      width: `${c.pct}%`, background: `${color}10`,
                      borderRadius: 14, transition: "width 0.6s ease",
                    }} />
                    {/* Rank */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: i < 3 ? `${color}18` : "var(--color-surface)",
                      border: `1px solid ${i < 3 ? `${color}30` : "var(--color-border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: medal ? 16 : 13, fontWeight: 700, color: i < 3 ? color : "var(--color-text-3)",
                      flexShrink: 0, position: "relative",
                    }}>
                      {medal || (i + 1)}
                    </div>
                    {/* Flag + name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, position: "relative" }}>
                      <CountryFlag code={meta?.code ?? c.code.toLowerCase()} size={24} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{c.name}</span>
                    </div>
                    {/* Count + pct */}
                    <div style={{ textAlign: "right", flexShrink: 0, position: "relative" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: "-0.02em" }}>{c.pct}%</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-3)" }}>{c.count} oy</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Türkiye Kutuplaşma Konsensüs */}
          {trBias && (
            <div style={{
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
              borderRadius: 16, padding: "24px 28px", marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <CountryFlag code="tr" size={28} />
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                  Türkiye Kutuplaşma Konsensüs
                </h2>
              </div>
              <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 18 }}>
                Türkiye haberlerinde okuyucular yandaş mı muhalif medyayı mı daha haklı buluyor?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 500 }}>
                {[
                  { key: "pro_gov", label: "Yandaş medya haklı", pct: trBias.pro_gov_pct, count: trBias.pro_gov, color: "#dc2626" },
                  { key: "opposition", label: "Muhalif medya haklı", pct: trBias.opposition_pct, count: trBias.opposition, color: "#16a34a" },
                  { key: "both", label: "Her ikisi de yanlı", pct: trBias.both_pct, count: trBias.both, color: "#d97706" },
                  { key: "undecided", label: "Kararsız", pct: trBias.undecided_pct, count: trBias.undecided, color: "#6366f1" },
                ].map((opt, i) => (
                  <div key={opt.key} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 16px",
                    background: i === 0 ? `${opt.color}0a` : "var(--color-surface-2)",
                    border: `1px solid ${i === 0 ? `${opt.color}25` : "var(--color-border)"}`,
                    borderRadius: 12, position: "relative", overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0,
                      width: `${opt.pct}%`, background: `${opt.color}10`,
                      borderRadius: 12, transition: "width 0.6s ease",
                    }} />
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: opt.color, flexShrink: 0, position: "relative",
                    }} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--color-text)", position: "relative" }}>
                      {opt.label}
                    </span>
                    <div style={{ textAlign: "right", flexShrink: 0, position: "relative" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: opt.color }}>{opt.pct}%</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-3)" }}>{opt.count} oy</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                fontSize: 11, color: "var(--color-text-3)", marginTop: 14,
                padding: "6px 12px", background: "var(--color-surface-2)", borderRadius: 99,
                display: "inline-block",
              }}>
                Toplam {trBias.total_votes} oy
              </div>
            </div>
          )}

          {/* Haber bazlı kazanma */}
          {countryWins.length > 0 && (
            <div style={{
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
              borderRadius: 16, padding: "24px 28px",
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>
                🏆 En Güvenilir Bulunan Medya
              </h2>
              <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 20 }}>
                Haberlerde en çok hangi ülkenin medyası &quot;daha doğru&quot; seçildi?
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {countryWins.map((cw, i) => {
                  const meta = COUNTRY_META[cw.country_code]
                  return (
                    <div key={cw.country_code} style={{
                      background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
                      borderRadius: 14, padding: "18px 20px", textAlign: "center",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
                        {i === 0 && <span style={{ fontSize: 18 }}>🥇</span>}
                        {i === 1 && <span style={{ fontSize: 18 }}>🥈</span>}
                        {i === 2 && <span style={{ fontSize: 18 }}>🥉</span>}
                        <CountryFlag code={meta?.code ?? cw.country_code.toLowerCase()} size={28} />
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", marginBottom: 4 }}>
                        {cw.name}
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: BAR_COLORS[i % BAR_COLORS.length] }}>
                        {cw.wins}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 2 }}>
                        haberde en doğru seçildi
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
