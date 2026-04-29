"use client"
import { useState, useEffect } from "react"

const API = ""

const PLAN_COLORS: Record<string, string> = { pro: "#7c3aed" }
const PLAN_LABELS: Record<string, string> = { pro: "Pro" }

export default function AbonelerPage() {
  const [data, setData]       = useState<any>(null)
  const [stats, setStats]     = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)

  function load(p = 1) {
    setLoading(true)
    const token = localStorage.getItem("auth_token")
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }

    Promise.all([
      fetch(`${API}/api/admin/subscriptions?page=${p}`, { headers }).then(r => r.json()),
      fetch(`${API}/api/admin/subscriptions/stats`, { headers }).then(r => r.json()),
    ]).then(([d, s]) => {
      setData(d)
      setStats(s)
      setPage(p)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load(1) }, [])

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(16px,3vw,32px) 16px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Aboneler</h1>
      <p style={{ color: "var(--color-text-2)", marginBottom: 24, fontSize: 14 }}>
        Aktif premium üyelikler
      </p>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Toplam Aktif",  value: stats.total_active,  color: "#2563eb" },
            { label: "Pro",           value: stats.pro,           color: "#7c3aed" },
            { label: "Toplam Gelir",  value: `₺${(stats.monthly_revenue || 0).toLocaleString("tr")}`, color: "#16a34a" },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-2)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-2)" }}>
                {["Kullanıcı", "Email", "Plan", "Dönem", "Tutar", "Başlangıç", "Bitiş", "Durum"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--color-text-2)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-3)" }}>Yükleniyor...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-3)" }}>Henüz abone yok.</td></tr>
              ) : data?.data?.map((sub: any) => (
                <tr key={sub.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                    {sub.user?.name || sub.user?.display_name || `#${sub.user_id}`}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-2)" }}>
                    {sub.user?.email || "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: (PLAN_COLORS[sub.plan] || "#6b7280") + "22",
                      color: PLAN_COLORS[sub.plan] || "#6b7280",
                    }}>
                      {PLAN_LABELS[sub.plan] || sub.plan}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-2)" }}>
                    {sub.is_yearly ? "Yıllık" : "Aylık"}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                    ₺{sub.amount}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-2)", whiteSpace: "nowrap" }}>
                    {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-2)", whiteSpace: "nowrap" }}>
                    {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                      background: sub.status === "active" ? "#dcfce7" : "#f3f4f6",
                      color: sub.status === "active" ? "#16a34a" : "#6b7280",
                    }}>
                      {sub.status === "active" ? "Aktif" : sub.status === "cancelled" ? "İptal" : "Sona Erdi"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div style={{ padding: "14px 16px", borderTop: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <button
              onClick={() => load(page - 1)}
              disabled={page <= 1}
              style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "transparent", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1, fontSize: 13 }}
            >
              ← Önceki
            </button>
            <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>
              {page} / {data.last_page}
            </span>
            <button
              onClick={() => load(page + 1)}
              disabled={page >= data.last_page}
              style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "transparent", cursor: page >= data.last_page ? "not-allowed" : "pointer", opacity: page >= data.last_page ? 0.4 : 1, fontSize: 13 }}
            >
              Sonraki →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
