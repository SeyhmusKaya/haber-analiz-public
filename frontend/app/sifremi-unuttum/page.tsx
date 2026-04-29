"use client"

import { useState } from "react"
import Link from "next/link"
import { apiForgotPassword } from "@/lib/api"

export default function SifremiUnuttumPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await apiForgotPassword(email)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "İşlem başarısız.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        padding: "clamp(24px, 5vw, 40px) clamp(20px, 4vw, 36px)",
        textAlign: "center",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, marginBottom: 20,
        }}>🔑</div>

        {sent ? (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>📬</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 10 }}>
              E-posta gönderildi
            </h1>
            <p style={{ fontSize: 14, color: "var(--color-text-2)", lineHeight: 1.6 }}>
              <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderdik.
              Gelen kutunuzu kontrol edin.
            </p>
            <Link href="/giris" style={{
              display: "inline-block", marginTop: 24,
              fontSize: 14, fontWeight: 500, color: "var(--color-accent)", textDecoration: "none",
            }}>
              ← Giriş sayfasına dön
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
              Şifremi Unuttum
            </h1>
            <p style={{ fontSize: 14, color: "var(--color-text-3)", marginTop: 8, marginBottom: 28, lineHeight: 1.6 }}>
              E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>
                  {error}
                </div>
              )}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-2)", marginBottom: 6 }}>
                  E-posta adresi
                </label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  style={{ width: "100%", padding: "10px 14px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "11px 16px",
                background: loading ? "var(--color-surface-3)" : "var(--color-accent)",
                color: "#fff", border: "none", borderRadius: "var(--radius-md)",
                fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              }}>
                {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </button>
            </form>

            <Link href="/giris" style={{ display: "inline-block", marginTop: 20, fontSize: 13, color: "var(--color-text-3)", textDecoration: "none" }}>
              ← Giriş sayfasına dön
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
