"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"

export default function GirisPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError("")
    setLoading(true)

    try {
      const API_URL = ""
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || json.message || "E-posta veya şifre hatalı.")
        setLoading(false)
        return
      }

      login(json.user, json.token)
      window.location.href = "/"
    } catch {
      setError("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.")
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        padding: "clamp(24px, 5vw, 40px) clamp(20px, 4vw, 36px)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, marginBottom: 12,
          }}>🌐</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
            Tekrar hoş geldiniz
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-3)", marginTop: 6 }}>
            Medya İzle hesabınıza giriş yapın
          </p>
        </div>

        {/* Google ile Giriş */}
        <a
          href="/api/auth/google"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", padding: "10px 16px",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontSize: 14, fontWeight: 500, color: "var(--color-text)",
            textDecoration: "none",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.6 5.1C9.6 39.7 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4-4.2 5.3l6.2 5.2c3.7-3.4 5.7-8.5 5.7-14.5 0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Google ile Giriş Yap
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 8px" }}>
          <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
          <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>veya e-posta ile</span>
          <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>
              {error}
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-2)", marginBottom: 6 }}>
              E-posta
            </label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              style={inputStyle}
            />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-2)" }}>Şifre</label>
              <Link href="/sifremi-unuttum" style={{ fontSize: 12, color: "var(--color-accent)", textDecoration: "none" }}>
                Şifremi unuttum
              </Link>
            </div>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={loading} style={btnStyle(loading)}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--color-text-3)", marginTop: 24 }}>
          Hesabınız yok mu?{" "}
          <Link href="/kayit" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}>
            Üye olun
          </Link>
        </p>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  color: "var(--color-text)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
}

const btnStyle = (loading: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "11px 16px",
  background: loading ? "var(--color-surface-3)" : "var(--color-accent)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-md)",
  fontSize: 14,
  fontWeight: 600,
  cursor: loading ? "not-allowed" : "pointer",
  transition: "opacity 0.15s",
})
