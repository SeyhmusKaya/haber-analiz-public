"use client"

import { useState, useEffect } from "react"
import { adminGetAiSettings, adminUpdateAiSettings, adminTestAiConnection } from "@/lib/api"

export default function AdminAiSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; response?: string } | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [newKey, setNewKey] = useState("")

  useEffect(() => {
    adminGetAiSettings()
      .then((d) => {
        setSettings(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const payload: Record<string, string> = {
        gemini_model: settings.gemini_model || "",
        gemini_embedding_model: settings.gemini_embedding_model || "",
        ai_max_tokens: settings.ai_max_tokens || "",
        ai_temperature: settings.ai_temperature || "",
      }
      // Only send key if user typed a new one
      if (newKey.trim()) {
        payload.gemini_api_key = newKey.trim()
      }
      await adminUpdateAiSettings(payload)
      setMsg({ type: "ok", text: "AI ayarları güncellendi." })
      setNewKey("")
      // Refresh to get updated masked key
      const fresh = await adminGetAiSettings()
      setSettings(fresh)
    } catch (e: any) {
      setMsg({ type: "err", text: e.message })
    }
    setSaving(false)
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await adminTestAiConnection()
      setTestResult(result)
    } catch {
      setTestResult({ success: false, message: "Sunucuya ulaşılamadı" })
    }
    setTesting(false)
  }

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 32 }}>
          <div style={{ height: 24, background: "var(--color-border)", borderRadius: 6, width: 200, marginBottom: 24 }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 44, background: "var(--color-border)", borderRadius: 6, marginBottom: 16, opacity: 0.5 }} />
          ))}
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    fontSize: 14,
    background: "var(--color-bg)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    outline: "none",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--color-text-2)",
    marginBottom: 6,
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>
        AI Ayarları
      </h2>
      <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 24 }}>
        Gemini API bağlantı ayarları ve model seçimi
      </p>

      {msg && (
        <div style={{
          padding: "10px 16px", marginBottom: 16, borderRadius: "var(--radius-md)", fontSize: 13,
          background: msg.type === "ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          color: msg.type === "ok" ? "#22c55e" : "#ef4444",
          border: `1px solid ${msg.type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
        }}>
          {msg.text}
        </div>
      )}

      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: 28,
      }}>
        {/* Gemini API Key */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Gemini API Key</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <div style={{
              flex: 1, padding: "10px 14px", fontSize: 13,
              background: "var(--color-bg)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)", color: "var(--color-text-3)",
              fontFamily: "monospace",
            }}>
              {showKey ? (settings.gemini_api_key || "Ayarlanmamış") : (settings.gemini_api_key_masked || "***")}
            </div>
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                padding: "10px 14px", fontSize: 12, background: "var(--color-bg)",
                border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
                color: "var(--color-text-2)", cursor: "pointer",
              }}
            >
              {showKey ? "Gizle" : "Göster"}
            </button>
          </div>
          <input
            type="text"
            placeholder="Yeni API key girin (boş bırakırsanız mevcut key korunur)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            style={inputStyle}
          />
          <p style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 4 }}>
            Google AI Studio'dan alınır: aistudio.google.com/apikey
          </p>
        </div>

        {/* Model */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Gemini Model</label>
          <select
            value={settings.gemini_model || "gemini-2.5-flash"}
            onChange={(e) => setSettings({ ...settings, gemini_model: e.target.value })}
            style={inputStyle}
          >
            <option value="gemini-2.5-flash">gemini-2.5-flash (Önerilen)</option>
            <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
            <option value="gemini-3.1-flash-lite-preview">gemini-3.1-flash-lite-preview</option>
            <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
          </select>
        </div>

        {/* Embedding Model */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Embedding Model</label>
          <select
            value={settings.gemini_embedding_model || "gemini-embedding-001"}
            onChange={(e) => setSettings({ ...settings, gemini_embedding_model: e.target.value })}
            style={inputStyle}
          >
            <option value="gemini-embedding-001">gemini-embedding-001 (Önerilen)</option>
            <option value="text-embedding-004">text-embedding-004</option>
          </select>
        </div>

        {/* Max Tokens */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Max Output Token</label>
            <input
              type="number"
              value={settings.ai_max_tokens || "2048"}
              onChange={(e) => setSettings({ ...settings, ai_max_tokens: e.target.value })}
              style={inputStyle}
              min={100}
              max={8192}
            />
          </div>
          <div>
            <label style={labelStyle}>Temperature</label>
            <input
              type="number"
              value={settings.ai_temperature || "0.7"}
              onChange={(e) => setSettings({ ...settings, ai_temperature: e.target.value })}
              style={inputStyle}
              min={0}
              max={2}
              step={0.1}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--color-border)" }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: "10px 24px", fontSize: 14, fontWeight: 600,
              background: "var(--color-accent)", color: "#fff",
              border: "none", borderRadius: "var(--radius-md)",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>

          <button
            onClick={testConnection}
            disabled={testing}
            style={{
              padding: "10px 24px", fontSize: 14, fontWeight: 500,
              background: "transparent",
              color: "var(--color-accent)",
              border: "1px solid var(--color-accent)",
              borderRadius: "var(--radius-md)",
              cursor: testing ? "not-allowed" : "pointer",
              opacity: testing ? 0.6 : 1,
            }}
          >
            {testing ? "Test ediliyor..." : "Bağlantı Test Et"}
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div style={{
            marginTop: 16, padding: "12px 16px", borderRadius: "var(--radius-md)", fontSize: 13,
            background: testResult.success ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${testResult.success ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}>
            <div style={{ fontWeight: 600, color: testResult.success ? "#22c55e" : "#ef4444", marginBottom: 4 }}>
              {testResult.success ? "Başarılı" : "Başarısız"}
            </div>
            <div style={{ color: "var(--color-text-2)" }}>{testResult.message}</div>
            {testResult.response && (
              <div style={{ marginTop: 6, color: "var(--color-text-3)", fontStyle: "italic" }}>
                Gemini yanıtı: "{testResult.response}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
