"use client"

import { useState, useEffect, useCallback } from "react"
import {
  adminGetSources,
  adminCreateSource,
  adminUpdateSource,
  adminToggleSourceActive,
  adminDeleteSource,
  type AdminSource,
} from "@/lib/api"

const COUNTRY_NAMES: Record<string, string> = {
  TR: "Türkiye", US: "ABD", GB: "İngiltere", DE: "Almanya",
  RU: "Rusya", CN: "Çin", IR: "İran", IL: "İsrail",
  SA: "Suudi Arabistan", EG: "Mısır",
}

const BIAS_LABELS: Record<string, string> = {
  pro_gov: "Yandaş",
  opposition: "Muhalif",
}

const LANG_LABELS: Record<string, string> = {
  tr: "Türkçe", en: "İngilizce", de: "Almanca",
  ru: "Rusça", zh: "Çince", ar: "Arapça", fa: "Farsça", he: "İbranice",
}

const emptyForm: Partial<AdminSource> = {
  name: "", rss_url: "", site_url: "", country_code: "TR",
  bias: "pro_gov", language: "tr", importance_score: 10, is_active: true,
  owner: "", funding_type: "", description: "",
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 7 ? "#16a34a" : score >= 4 ? "#d97706" : "#dc2626"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 60, height: 6, borderRadius: 3,
        background: "var(--color-border)", overflow: "hidden",
      }}>
        <div style={{
          width: `${score * 10}%`, height: "100%",
          background: color, borderRadius: 3, transition: "width 0.3s",
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{score}</span>
    </div>
  )
}

function Modal({
  title, onClose, children,
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "var(--color-surface)", borderRadius: 16,
        border: "1px solid var(--color-border)",
        width: "100%", maxWidth: 640, maxHeight: "90vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: "18px 24px", borderBottom: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8, border: "1px solid var(--color-border)",
            background: "var(--color-surface-2)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: "var(--color-text-3)",
          }}>×</button>
        </div>
        <div style={{ overflow: "auto", padding: 24, flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}

function SourceForm({
  initial, onSave, onCancel, saving,
}: {
  initial: Partial<AdminSource>
  onSave: (data: Partial<AdminSource>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<Partial<AdminSource>>(initial)

  const set = (key: keyof AdminSource, val: any) =>
    setForm(f => ({ ...f, [key]: val }))

  const field = (label: string, key: keyof AdminSource, type = "text", required = false) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 5 }}>
        {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
      </label>
      <input
        type={type}
        value={(form[key] as string) ?? ""}
        onChange={e => set(key, e.target.value)}
        required={required}
        style={{
          width: "100%", padding: "8px 12px", borderRadius: 8, boxSizing: "border-box",
          border: "1px solid var(--color-border)", background: "var(--color-bg-2)",
          color: "var(--color-text)", fontSize: 13,
        }}
      />
    </div>
  )

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1/-1" }}>{field("Kaynak Adı", "name", "text", true)}</div>
        {field("RSS URL", "rss_url", "url", true)}
        {field("Site URL", "site_url", "url")}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 5 }}>
            Ülke <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <select
            value={form.country_code ?? "TR"}
            onChange={e => set("country_code", e.target.value)}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: "1px solid var(--color-border)", background: "var(--color-bg-2)",
              color: "var(--color-text)", fontSize: 13,
            }}
          >
            {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
              <option key={code} value={code}>{name} ({code})</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 5 }}>
            Yönelim <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <select
            value={form.bias ?? "pro_gov"}
            onChange={e => set("bias", e.target.value as any)}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: "1px solid var(--color-border)", background: "var(--color-bg-2)",
              color: "var(--color-text)", fontSize: 13,
            }}
          >
            <option value="pro_gov">Yandaş</option>
            <option value="opposition">Muhalif</option>
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 5 }}>
            Dil <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <select
            value={form.language ?? "tr"}
            onChange={e => set("language", e.target.value)}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: "1px solid var(--color-border)", background: "var(--color-bg-2)",
              color: "var(--color-text)", fontSize: 13,
            }}
          >
            {Object.entries(LANG_LABELS).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 5 }}>
            Önem Derecesi (0-10) <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="range" min={0} max={10} step={1}
              value={form.importance_score ?? 10}
              onChange={e => set("importance_score", Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{
              minWidth: 28, textAlign: "center", fontWeight: 700, fontSize: 14,
              color: (form.importance_score ?? 10) >= 7 ? "#16a34a" : (form.importance_score ?? 10) >= 4 ? "#d97706" : "#dc2626",
            }}>
              {form.importance_score ?? 10}
            </span>
          </div>
          {(form.importance_score ?? 10) === 0 && (
            <p style={{ fontSize: 11, color: "#dc2626", margin: "4px 0 0" }}>⚠️ Önem derecesi 0 olan kaynak hiç çekilmez</p>
          )}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 5 }}>Durum</label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.is_active ?? true}
              onChange={e => set("is_active", e.target.checked)}
            />
            <span style={{ fontSize: 13, color: "var(--color-text)" }}>
              {form.is_active ? "Aktif" : "Pasif"}
            </span>
          </label>
        </div>
        {field("Sahip / Kuruluş", "owner")}
        {field("Finansman Tipi", "funding_type")}
        {field("Kuruluş Yılı", "founded_year", "number")}
        {field("Logo URL", "logo_url", "url")}
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 5 }}>Açıklama</label>
        <textarea
          rows={3}
          value={form.description ?? ""}
          onChange={e => set("description", e.target.value)}
          style={{
            width: "100%", padding: "8px 12px", borderRadius: 8, boxSizing: "border-box",
            border: "1px solid var(--color-border)", background: "var(--color-bg-2)",
            color: "var(--color-text)", fontSize: 13, resize: "vertical",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
        <button type="button" onClick={onCancel} style={{
          padding: "9px 20px", borderRadius: 9, border: "1px solid var(--color-border)",
          background: "var(--color-surface-2)", color: "var(--color-text)", cursor: "pointer", fontSize: 13,
        }}>İptal</button>
        <button type="submit" disabled={saving} style={{
          padding: "9px 20px", borderRadius: 9, border: "none",
          background: "#3b82f6", color: "#fff", cursor: saving ? "not-allowed" : "pointer",
          fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1,
        }}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  )
}

export default function AdminKaynaklarPage() {
  const [sources, setSources] = useState<AdminSource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterCountry, setFilterCountry] = useState("")
  const [filterBias, setFilterBias] = useState("")
  const [filterActive, setFilterActive] = useState("")
  const [modal, setModal] = useState<"add" | "edit" | null>(null)
  const [editSource, setEditSource] = useState<AdminSource | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminGetSources({
        search: search || undefined,
        country: filterCountry || undefined,
        bias: filterBias || undefined,
        active: filterActive || undefined,
      })
      setSources(data.sources)
    } catch (e: any) {
      setErr(e.message)
    }
    setLoading(false)
  }, [search, filterCountry, filterBias, filterActive])

  useEffect(() => { load() }, [load])

  const flash = (msg: string, isErr = false) => {
    if (isErr) { setErr(msg); setTimeout(() => setErr(null), 4000) }
    else { setOk(msg); setTimeout(() => setOk(null), 3000) }
  }

  const handleSave = async (data: Partial<AdminSource>) => {
    setSaving(true)
    try {
      if (modal === "edit" && editSource) {
        await adminUpdateSource(editSource.id, data)
        flash("Kaynak güncellendi.")
      } else {
        await adminCreateSource(data)
        flash("Kaynak eklendi.")
      }
      setModal(null)
      load()
    } catch (e: any) {
      flash(e.message, true)
    }
    setSaving(false)
  }

  const handleToggle = async (id: number) => {
    try {
      await adminToggleSourceActive(id)
      setSources(prev => prev.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s))
    } catch (e: any) {
      flash(e.message, true)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bu kaynağı silmek istediğinizden emin misiniz? İlişkili makaleler de etkilenebilir.")) return
    setDeletingId(id)
    try {
      await adminDeleteSource(id)
      setSources(prev => prev.filter(s => s.id !== id))
      flash("Kaynak silindi.")
    } catch (e: any) {
      flash(e.message, true)
    }
    setDeletingId(null)
  }

  // Ülke grupları (filtre uygulanmış listeyi grupla)
  const byCountry: Record<string, { pro_gov: AdminSource[]; opposition: AdminSource[] }> = {}
  for (const s of sources) {
    if (!byCountry[s.country_code]) byCountry[s.country_code] = { pro_gov: [], opposition: [] }
    byCountry[s.country_code][s.bias].push(s)
  }

  const totalActive = sources.filter(s => s.is_active).length
  const totalPassive = sources.filter(s => !s.is_active).length
  const totalScore0 = sources.filter(s => s.importance_score === 0).length

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "var(--color-text)" }}>📰 Kaynak Yönetimi</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-3)" }}>
            RSS kaynaklarını yönet, önem derecesi belirle, aktif/pasif yap
          </p>
        </div>
        <button
          onClick={() => { setEditSource(null); setModal("add") }}
          style={{
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: "#3b82f6", color: "#fff", cursor: "pointer",
            fontSize: 13, fontWeight: 600, flexShrink: 0,
          }}
        >
          + Kaynak Ekle
        </button>
      </div>

      {/* Flash mesajlar */}
      {ok && (
        <div style={{ padding: "10px 16px", borderRadius: 10, background: "#dcfce7", color: "#15803d", marginBottom: 16, fontSize: 13, border: "1px solid #bbf7d0" }}>
          ✓ {ok}
        </div>
      )}
      {err && (
        <div style={{ padding: "10px 16px", borderRadius: 10, background: "#fee2e2", color: "#dc2626", marginBottom: 16, fontSize: 13, border: "1px solid #fecaca" }}>
          ✕ {err}
        </div>
      )}

      {/* İstatistik özeti */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Toplam Kaynak", value: sources.length, color: "#3b82f6" },
          { label: "Aktif", value: totalActive, color: "#16a34a" },
          { label: "Pasif", value: totalPassive, color: "#9ca3af" },
          { label: "Önem=0 (Çekilmiyor)", value: totalScore0, color: "#dc2626" },
        ].map(stat => (
          <div key={stat.label} style={{
            padding: "10px 18px", borderRadius: 10, border: "1px solid var(--color-border)",
            background: "var(--color-surface)", display: "flex", flexDirection: "column", gap: 2,
          }}>
            <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>{stat.label}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap",
        padding: "14px 16px", borderRadius: 12,
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
      }}>
        <input
          type="text"
          placeholder="Kaynak adı veya URL ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8,
            border: "1px solid var(--color-border)", background: "var(--color-bg-2)",
            color: "var(--color-text)", fontSize: 13,
          }}
        />
        <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} style={{
          padding: "8px 12px", borderRadius: 8, border: "1px solid var(--color-border)",
          background: "var(--color-bg-2)", color: "var(--color-text)", fontSize: 13,
        }}>
          <option value="">Tüm Ülkeler</option>
          {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
        <select value={filterBias} onChange={e => setFilterBias(e.target.value)} style={{
          padding: "8px 12px", borderRadius: 8, border: "1px solid var(--color-border)",
          background: "var(--color-bg-2)", color: "var(--color-text)", fontSize: 13,
        }}>
          <option value="">Tüm Yönelimler</option>
          <option value="pro_gov">Yandaş</option>
          <option value="opposition">Muhalif</option>
        </select>
        <select value={filterActive} onChange={e => setFilterActive(e.target.value)} style={{
          padding: "8px 12px", borderRadius: 8, border: "1px solid var(--color-border)",
          background: "var(--color-bg-2)", color: "var(--color-text)", fontSize: 13,
        }}>
          <option value="">Tümü</option>
          <option value="1">Sadece Aktif</option>
          <option value="0">Sadece Pasif</option>
        </select>
        {(search || filterCountry || filterBias || filterActive) && (
          <button onClick={() => { setSearch(""); setFilterCountry(""); setFilterBias(""); setFilterActive("") }} style={{
            padding: "8px 14px", borderRadius: 8, border: "1px solid var(--color-border)",
            background: "var(--color-surface-2)", color: "var(--color-text-3)", cursor: "pointer", fontSize: 12,
          }}>
            Temizle
          </button>
        )}
      </div>

      {/* Kaynak Listesi */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--color-text-3)", fontSize: 14 }}>Yükleniyor...</div>
      ) : sources.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--color-text-3)", fontSize: 14 }}>Kaynak bulunamadı.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {Object.entries(byCountry).map(([code, { pro_gov, opposition }]) => (
            <div key={code} style={{
              background: "var(--color-surface)", borderRadius: 14,
              border: "1px solid var(--color-border)", overflow: "hidden",
            }}>
              {/* Ülke başlığı */}
              <div style={{
                padding: "12px 20px", borderBottom: "1px solid var(--color-border)",
                display: "flex", alignItems: "center", gap: 10,
                background: "var(--color-surface-2)",
              }}>
                <img
                  src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`}
                  alt={code}
                  style={{ borderRadius: 2 }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                />
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text)" }}>
                  {COUNTRY_NAMES[code] ?? code}
                </span>
                <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>
                  {pro_gov.length + opposition.length} kaynak
                </span>
              </div>

              {/* Kaynaklar tablosu */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--color-bg-2)" }}>
                      {["Kaynak", "Yönelim", "Dil", "Önem", "Makaleler", "Durum", "İşlemler"].map(h => (
                        <th key={h} style={{
                          padding: "8px 14px", textAlign: "left", fontSize: 11,
                          fontWeight: 600, color: "var(--color-text-3)",
                          borderBottom: "1px solid var(--color-border)", whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...pro_gov, ...opposition].map(source => (
                      <tr
                        key={source.id}
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                          opacity: source.is_active ? 1 : 0.5,
                        }}
                      >
                        {/* Kaynak adı */}
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {source.site_url && (
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${new URL(source.site_url).hostname}&sz=16`}
                                alt=""
                                style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0 }}
                                onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                              />
                            )}
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                                {source.name}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--color-text-3)" }}>
                                {source.site_url ? (
                                  <a href={source.site_url} target="_blank" rel="noopener noreferrer"
                                    style={{ color: "var(--color-accent)", textDecoration: "none" }}>
                                    {new URL(source.site_url).hostname}
                                  </a>
                                ) : source.rss_url.substring(0, 40) + "..."}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Yönelim */}
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center",
                            padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: source.bias === "pro_gov" ? "#fee2e2" : "#dcfce7",
                            color: source.bias === "pro_gov" ? "#dc2626" : "#16a34a",
                          }}>
                            {BIAS_LABELS[source.bias]}
                          </span>
                        </td>
                        {/* Dil */}
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontSize: 12, color: "var(--color-text-2)" }}>
                            {LANG_LABELS[source.language] ?? source.language}
                          </span>
                        </td>
                        {/* Önem derecesi */}
                        <td style={{ padding: "10px 14px" }}>
                          <ScoreBar score={source.importance_score} />
                        </td>
                        {/* Makale sayısı */}
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>
                            {source.article_count?.toLocaleString("tr-TR") ?? 0}
                          </span>
                        </td>
                        {/* Durum */}
                        <td style={{ padding: "10px 14px" }}>
                          <button
                            onClick={() => handleToggle(source.id)}
                            title={source.is_active ? "Pasif yap" : "Aktif yap"}
                            style={{
                              padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                              border: "none", cursor: "pointer",
                              background: source.is_active ? "#dcfce7" : "#f3f4f6",
                              color: source.is_active ? "#16a34a" : "#6b7280",
                              transition: "all 0.15s",
                            }}
                          >
                            {source.is_active ? "✓ Aktif" : "✗ Pasif"}
                          </button>
                        </td>
                        {/* İşlemler */}
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => { setEditSource(source); setModal("edit") }}
                              style={{
                                padding: "5px 12px", borderRadius: 7, fontSize: 12,
                                border: "1px solid var(--color-border)", background: "var(--color-surface-2)",
                                color: "var(--color-text-2)", cursor: "pointer",
                              }}
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleDelete(source.id)}
                              disabled={deletingId === source.id}
                              style={{
                                padding: "5px 12px", borderRadius: 7, fontSize: 12,
                                border: "1px solid #fecaca", background: "#fff1f2",
                                color: "#dc2626", cursor: "pointer", opacity: deletingId === source.id ? 0.5 : 1,
                              }}
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal
          title={modal === "add" ? "Yeni Kaynak Ekle" : `Kaynağı Düzenle: ${editSource?.name}`}
          onClose={() => setModal(null)}
        >
          <SourceForm
            initial={modal === "edit" && editSource ? editSource : emptyForm}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  )
}
