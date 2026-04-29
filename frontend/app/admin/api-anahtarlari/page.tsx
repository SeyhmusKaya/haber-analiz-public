"use client"

import { useState, useEffect, useCallback } from "react"

const API = ""

interface ApiKey {
  id: number
  user_id: number | null
  user_email: string | null
  user_name: string | null
  key_masked: string          // örn: "miz_sk_****abcd"
  key_full?: string           // sadece oluşturulduğu anda gelir
  allowed_ips: string[]       // boş = tüm IP'lere açık
  rate_limit_daily: number    // günlük istek limiti
  requests_today: number
  total_requests: number
  note: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

interface NewKeyForm {
  user_email: string
  allowed_ips: string         // virgülle ayrılmış
  rate_limit_daily: number
  note: string
}

type ModalMode = "create" | "edit" | null

const token = () => typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
const authHeaders = () => ({
  Authorization: `Bearer ${token()}`,
  "Content-Type": "application/json",
  Accept: "application/json",
})

export default function ApiAnahtarlariPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalMode>(null)
  const [editTarget, setEditTarget] = useState<ApiKey | null>(null)
  const [form, setForm] = useState<NewKeyForm>({ user_email: "", allowed_ips: "", rate_limit_daily: 1000, note: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [filterActive, setFilterActive] = useState<"all" | "active" | "revoked">("all")

  const load = useCallback(() => {
    setLoading(true)
    fetch(`${API}/api/admin/api-keys`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setKeys(Array.isArray(d.keys) ? d.keys : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({ user_email: "", allowed_ips: "", rate_limit_daily: 1000, note: "" })
    setError("")
    setNewKeyResult(null)
    setEditTarget(null)
    setModal("create")
  }

  function openEdit(key: ApiKey) {
    setForm({
      user_email: key.user_email || "",
      allowed_ips: key.allowed_ips.join(", "),
      rate_limit_daily: key.rate_limit_daily,
      note: key.note,
    })
    setError("")
    setNewKeyResult(null)
    setEditTarget(key)
    setModal("edit")
  }

  async function handleCreate() {
    if (!form.user_email.trim()) { setError("Kullanıcı e-postası zorunludur."); return }
    setSaving(true); setError("")
    try {
      const res = await fetch(`${API}/api/admin/api-keys`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          user_email: form.user_email.trim(),
          allowed_ips: form.allowed_ips.split(",").map(s => s.trim()).filter(Boolean),
          rate_limit_daily: form.rate_limit_daily,
          note: form.note.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Anahtar oluşturulamadı."); return }
      setNewKeyResult(data.key_full || data.key)
      load()
    } catch { setError("Sunucuya bağlanılamadı.") }
    finally { setSaving(false) }
  }

  async function handleEdit() {
    if (!editTarget) return
    setSaving(true); setError("")
    try {
      const res = await fetch(`${API}/api/admin/api-keys/${editTarget.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          allowed_ips: form.allowed_ips.split(",").map(s => s.trim()).filter(Boolean),
          rate_limit_daily: form.rate_limit_daily,
          note: form.note.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Güncellenemedi."); return }
      setModal(null)
      load()
    } catch { setError("Sunucuya bağlanılamadı.") }
    finally { setSaving(false) }
  }

  async function handleToggle(key: ApiKey) {
    const endpoint = key.is_active
      ? `${API}/api/admin/api-keys/${key.id}/revoke`
      : `${API}/api/admin/api-keys/${key.id}/activate`
    try {
      await fetch(endpoint, { method: "POST", headers: authHeaders() })
      load()
    } catch {}
  }

  async function handleDelete(id: number) {
    if (!confirm("Bu API anahtarını kalıcı olarak silmek istediğinize emin misiniz?")) return
    try {
      await fetch(`${API}/api/admin/api-keys/${id}`, { method: "DELETE", headers: authHeaders() })
      load()
    } catch {}
  }

  function copyKey(text: string, id?: number) {
    navigator.clipboard.writeText(text).then(() => {
      if (id) setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const displayed = keys.filter(k => {
    const matchSearch = !search || k.user_email?.toLowerCase().includes(search.toLowerCase()) || k.note?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filterActive === "all" || (filterActive === "active" ? k.is_active : !k.is_active)
    return matchSearch && matchFilter
  })

  const stats = {
    total: keys.length,
    active: keys.filter(k => k.is_active).length,
    revoked: keys.filter(k => !k.is_active).length,
    todayRequests: keys.reduce((s, k) => s + k.requests_today, 0),
  }

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>API Anahtarları</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-2)", margin: 0 }}>
            Kullanıcılara özel API anahtarı üretin, IP kısıtlaması ve rate limit belirleyin.
          </p>
        </div>
        <button onClick={openCreate} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 20px", background: "var(--color-accent)", color: "#fff",
          border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
        }}>
          🔑 Yeni Anahtar Üret
        </button>
      </div>

      {/* İstatistik kartları */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Toplam Anahtar", value: stats.total,          color: "#2563eb" },
          { label: "Aktif",          value: stats.active,         color: "#16a34a" },
          { label: "İptal Edilmiş",  value: stats.revoked,        color: "#dc2626" },
          { label: "Bugünkü İstek",  value: stats.todayRequests,  color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-2)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="E-posta veya not ara..."
          style={{
            flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 9,
            border: "1px solid var(--color-border)", background: "var(--color-surface)",
            fontSize: 13, color: "var(--color-text)", outline: "none",
          }}
        />
        {(["all", "active", "revoked"] as const).map(f => (
          <button key={f} onClick={() => setFilterActive(f)} style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${filterActive === f ? "var(--color-accent)" : "var(--color-border)"}`,
            background: filterActive === f ? "rgba(37,99,235,0.1)" : "var(--color-surface)",
            color: filterActive === f ? "var(--color-accent)" : "var(--color-text-2)",
          }}>
            {f === "all" ? "Tümü" : f === "active" ? "✓ Aktif" : "✕ İptal"}
          </button>
        ))}
        <button onClick={load} style={{
          padding: "8px 14px", borderRadius: 8, border: "1px solid var(--color-border)",
          background: "var(--color-surface)", cursor: "pointer", fontSize: 12, color: "var(--color-text-2)",
        }}>⟳ Yenile</button>
      </div>

      {/* Tablo */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-3)", fontSize: 13 }}>Yükleniyor...</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>Henüz API anahtarı yok</div>
            <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>Yeni Anahtar Üret butonuna tıklayarak başlayın.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
                  {["Kullanıcı", "Anahtar", "İzin Verilen IP'ler", "Limit / Bugün", "Not", "Durum", "İşlemler"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-3)", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((key, i) => (
                  <tr key={key.id} style={{ borderBottom: i < displayed.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Kullanıcı */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{key.user_name || "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-3)" }}>{key.user_email || "Anonim"}</div>
                    </td>

                    {/* Anahtar */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <code style={{ fontSize: 12, background: "var(--color-surface-2,rgba(0,0,0,0.05))", padding: "3px 8px", borderRadius: 6, fontFamily: "monospace", color: "var(--color-text-2)" }}>
                          {key.key_masked}
                        </code>
                        <button onClick={() => copyKey(key.key_masked, key.id)} title="Kopyala" style={{
                          width: 26, height: 26, borderRadius: 6, border: "1px solid var(--color-border)",
                          background: copiedId === key.id ? "rgba(22,163,74,0.1)" : "var(--color-surface)",
                          cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                          color: copiedId === key.id ? "#16a34a" : "var(--color-text-3)",
                        }}>
                          {copiedId === key.id ? "✓" : "⎘"}
                        </button>
                      </div>
                      <div style={{ fontSize: 10, color: "var(--color-text-3)", marginTop: 4 }}>
                        {key.last_used_at ? `Son: ${new Date(key.last_used_at).toLocaleDateString("tr-TR")}` : "Hiç kullanılmadı"}
                      </div>
                    </td>

                    {/* IP'ler */}
                    <td style={{ padding: "14px 16px" }}>
                      {key.allowed_ips.length === 0 ? (
                        <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>Tüm IP'ler</span>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {key.allowed_ips.slice(0, 3).map(ip => (
                            <code key={ip} style={{ fontSize: 11, background: "rgba(37,99,235,0.08)", color: "var(--color-accent)", padding: "2px 7px", borderRadius: 5 }}>{ip}</code>
                          ))}
                          {key.allowed_ips.length > 3 && (
                            <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>+{key.allowed_ips.length - 3} daha</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Limit */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                        {key.rate_limit_daily.toLocaleString("tr")} / gün
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <div style={{ flex: 1, height: 4, background: "var(--color-border)", borderRadius: 2, overflow: "hidden", maxWidth: 80 }}>
                          <div style={{
                            height: "100%", borderRadius: 2,
                            width: `${Math.min(100, (key.requests_today / key.rate_limit_daily) * 100)}%`,
                            background: key.requests_today / key.rate_limit_daily > 0.8 ? "#dc2626" : "var(--color-accent)",
                            transition: "width 0.3s",
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>
                          {key.requests_today.toLocaleString("tr")} bugün
                        </span>
                      </div>
                    </td>

                    {/* Not */}
                    <td style={{ padding: "14px 16px", maxWidth: 160 }}>
                      <div style={{ fontSize: 12, color: "var(--color-text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {key.note || <span style={{ color: "var(--color-text-3)" }}>—</span>}
                      </div>
                    </td>

                    {/* Durum */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: key.is_active ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                        color: key.is_active ? "#16a34a" : "#dc2626",
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
                        {key.is_active ? "Aktif" : "İptal"}
                      </span>
                      <div style={{ fontSize: 10, color: "var(--color-text-3)", marginTop: 4 }}>
                        {new Date(key.created_at).toLocaleDateString("tr-TR")}
                      </div>
                    </td>

                    {/* İşlemler */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(key)} title="Düzenle" style={{
                          padding: "5px 10px", borderRadius: 7, border: "1px solid var(--color-border)",
                          background: "var(--color-surface)", cursor: "pointer", fontSize: 12, color: "var(--color-text-2)",
                        }}>✎</button>
                        <button onClick={() => handleToggle(key)} title={key.is_active ? "İptal Et" : "Aktifleştir"} style={{
                          padding: "5px 10px", borderRadius: 7, border: `1px solid ${key.is_active ? "rgba(220,38,38,0.3)" : "rgba(22,163,74,0.3)"}`,
                          background: key.is_active ? "rgba(220,38,38,0.06)" : "rgba(22,163,74,0.06)",
                          cursor: "pointer", fontSize: 12,
                          color: key.is_active ? "#dc2626" : "#16a34a",
                        }}>
                          {key.is_active ? "✕" : "✓"}
                        </button>
                        <button onClick={() => handleDelete(key.id)} title="Sil" style={{
                          padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(220,38,38,0.2)",
                          background: "rgba(220,38,38,0.04)", cursor: "pointer", fontSize: 12, color: "#dc2626",
                        }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={e => { if (e.target === e.currentTarget && !newKeyResult) setModal(null) }}>
          <div style={{
            width: "100%", maxWidth: 520, background: "var(--color-surface)",
            border: "1px solid var(--color-border)", borderRadius: 20,
            overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            {/* Modal başlık */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>
                {newKeyResult ? "🎉 Anahtar Oluşturuldu" : modal === "create" ? "🔑 Yeni API Anahtarı" : "✎ Anahtarı Düzenle"}
              </span>
              <button onClick={() => { setModal(null); setNewKeyResult(null) }} style={{
                width: 28, height: 28, borderRadius: "50%", border: "none",
                background: "var(--color-surface-2)", cursor: "pointer", fontSize: 14, color: "var(--color-text-3)",
              }}>✕</button>
            </div>

            <div style={{ padding: "24px" }}>

              {/* Yeni anahtar göster — tek seferlik */}
              {newKeyResult ? (
                <div>
                  <div style={{
                    background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)",
                    borderRadius: 12, padding: "16px 18px", marginBottom: 20,
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#16a34a", margin: "0 0 8px" }}>
                      ⚠️ Bu anahtarı şimdi kopyalayın — bir daha tam olarak gösterilmeyecek!
                    </p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <code style={{
                        flex: 1, fontSize: 13, background: "var(--color-bg)",
                        border: "1px solid var(--color-border)", borderRadius: 8,
                        padding: "10px 14px", fontFamily: "monospace",
                        wordBreak: "break-all", color: "var(--color-text)",
                      }}>
                        {newKeyResult}
                      </code>
                      <button onClick={() => copyKey(newKeyResult)} style={{
                        flexShrink: 0, padding: "10px 14px", borderRadius: 8,
                        border: "1px solid var(--color-border)", background: "var(--color-surface)",
                        cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--color-accent)",
                        whiteSpace: "nowrap",
                      }}>
                        ⎘ Kopyala
                      </button>
                    </div>
                  </div>
                  <button onClick={() => { setModal(null); setNewKeyResult(null) }} style={{
                    width: "100%", padding: "12px", borderRadius: 10, border: "none",
                    background: "var(--color-accent)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}>
                    Tamam, kopyaladım
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {error && (
                    <div style={{ padding: "10px 14px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 9, fontSize: 13, color: "#dc2626" }}>
                      ⚠️ {error}
                    </div>
                  )}

                  {/* Kullanıcı e-postası (sadece oluşturma) */}
                  {modal === "create" && (
                    <div>
                      <label style={labelSt}>Kullanıcı E-postası *</label>
                      <input
                        type="email"
                        value={form.user_email}
                        onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))}
                        placeholder="kullanici@ornek.com"
                        style={inputSt}
                      />
                      <p style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 5 }}>
                        Bu e-postaya ait kullanıcıya anahtar atanacak. Kullanıcı kayıtlı değilse anonim anahtar oluşturulur.
                      </p>
                    </div>
                  )}

                  {/* IP Kısıtlaması */}
                  <div>
                    <label style={labelSt}>İzin Verilen IP Adresleri</label>
                    <input
                      type="text"
                      value={form.allowed_ips}
                      onChange={e => setForm(f => ({ ...f, allowed_ips: e.target.value }))}
                      placeholder="192.168.1.1, 10.0.0.0/24"
                      style={inputSt}
                    />
                    <p style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 5 }}>
                      Virgülle ayırın. Boş bırakılırsa tüm IP'lere açık olur. CIDR notasyonu desteklenir.
                    </p>
                  </div>

                  {/* Rate limit */}
                  <div>
                    <label style={labelSt}>Günlük İstek Limiti</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[100, 500, 1000, 5000, 10000].map(n => (
                        <button key={n} onClick={() => setForm(f => ({ ...f, rate_limit_daily: n }))} style={{
                          padding: "7px 14px", borderRadius: 8, border: `1px solid ${form.rate_limit_daily === n ? "var(--color-accent)" : "var(--color-border)"}`,
                          background: form.rate_limit_daily === n ? "rgba(37,99,235,0.1)" : "var(--color-surface)",
                          color: form.rate_limit_daily === n ? "var(--color-accent)" : "var(--color-text-2)",
                          fontSize: 13, fontWeight: form.rate_limit_daily === n ? 700 : 400, cursor: "pointer",
                        }}>
                          {n.toLocaleString("tr")}
                        </button>
                      ))}
                      <input
                        type="number" min={1} max={100000}
                        value={form.rate_limit_daily}
                        onChange={e => setForm(f => ({ ...f, rate_limit_daily: parseInt(e.target.value) || 1000 }))}
                        style={{ ...inputSt, width: 100 }}
                        placeholder="Özel"
                      />
                    </div>
                  </div>

                  {/* Not */}
                  <div>
                    <label style={labelSt}>Not (isteğe bağlı)</label>
                    <input
                      type="text"
                      value={form.note}
                      onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                      placeholder="Kullanım amacı, proje adı..."
                      style={inputSt}
                    />
                  </div>

                  {/* Butonlar */}
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button onClick={() => setModal(null)} style={{
                      flex: 1, padding: "11px", borderRadius: 10,
                      border: "1px solid var(--color-border)", background: "transparent",
                      color: "var(--color-text-2)", fontSize: 14, cursor: "pointer",
                    }}>İptal</button>
                    <button
                      onClick={modal === "create" ? handleCreate : handleEdit}
                      disabled={saving}
                      style={{
                        flex: 2, padding: "11px", borderRadius: 10, border: "none",
                        background: saving ? "var(--color-border)" : "var(--color-accent)",
                        color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                      }}
                    >
                      {saving ? "İşleniyor..." : modal === "create" ? "🔑 Anahtar Üret" : "Kaydet"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bilgi kutusu */}
      <div style={{
        marginTop: 28, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)",
        borderRadius: 12, padding: "16px 20px",
        display: "flex", gap: 14, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>ℹ️</span>
        <div style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--color-text)" }}>API Anahtarı Kullanımı:</strong>{" "}
          Kullanıcılar HTTP isteklerinde <code style={{ background: "var(--color-surface-2,rgba(0,0,0,0.06))", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 12 }}>Authorization: Bearer {"<api-key>"}</code> veya{" "}
          <code style={{ background: "var(--color-surface-2,rgba(0,0,0,0.06))", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 12 }}>X-API-Key: {"<api-key>"}</code> başlığı ile kimlik doğrulaması yapabilir.
          IP kısıtlaması aktifse diğer IP'lerden gelen istekler 403 döner. Rate limit aşılırsa 429 döner.
        </div>
      </div>
    </div>
  )
}

const labelSt: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--color-text-2)", marginBottom: 7,
}

const inputSt: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 9,
  border: "1px solid var(--color-border)", background: "var(--color-bg)",
  fontSize: 13, color: "var(--color-text)", outline: "none", boxSizing: "border-box",
}
