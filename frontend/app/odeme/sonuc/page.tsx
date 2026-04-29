"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

const API = ""

type Status = "loading" | "success" | "failed" | "error"

interface VerifyResult {
  status: string
  plan?: string
  period?: string
  amount?: number
}

function OdemeSonucInner() {
  const searchParams = useSearchParams()
  const [status, setStatus]   = useState<Status>("loading")
  const [result, setResult]   = useState<VerifyResult | null>(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const transactionId = searchParams.get("transaction_id")
    const statusParam   = searchParams.get("status")

    if (!transactionId) {
      setStatus("error")
      setMessage("Geçersiz ödeme bağlantısı. İşlem kimliği bulunamadı.")
      return
    }

    // Başarısız dönüş — bankadan doğrudan failed geldi
    if (statusParam === "failed" || statusParam === "cancelled") {
      setStatus("failed")
      setMessage("Ödeme işlemi tamamlanamadı veya iptal edildi.")
      return
    }

    // Backend ile doğrula
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    fetch(`${API}/api/subscription/verify/${transactionId}`, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(r => r.json())
      .then(data => {
        if (data.status === "completed" || data.status === "success") {
          setStatus("success")
          setResult(data)
        } else {
          setStatus("failed")
          setMessage(data.message || "Ödeme doğrulanamadı.")
        }
      })
      .catch(() => {
        setStatus("error")
        setMessage("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.")
      })
  }, [searchParams])

  return (
    <div style={{
      minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 480, background: "var(--color-surface)",
        border: "1px solid var(--color-border)", borderRadius: 20, padding: "44px 36px",
        textAlign: "center",
      }}>

        {status === "loading" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Ödeme Doğrulanıyor</h1>
            <p style={{ fontSize: 14, color: "var(--color-text-2)", lineHeight: 1.65 }}>
              Lütfen bekleyin, işleminiz kontrol ediliyor...
            </p>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)",
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(22,163,74,0.12)", border: "3px solid #16a34a",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, margin: "0 auto 22px",
            }}>✓</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, color: "#16a34a" }}>
              Ödeme Başarılı!
            </h1>
            <p style={{ fontSize: 14, color: "var(--color-text-2)", lineHeight: 1.65, marginBottom: 24 }}>
              {result?.plan
                ? `${result.plan.charAt(0).toUpperCase() + result.plan.slice(1)} planınız aktif edildi. İyi okumalar!`
                : "Aboneliğiniz başarıyla aktif edildi. İyi okumalar!"}
            </p>
            {result?.amount && (
              <div style={{
                background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)",
                borderRadius: 12, padding: "14px 18px", marginBottom: 24,
              }}>
                <div style={{ fontSize: 13, color: "var(--color-text-2)" }}>Ödenen tutar</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a" }}>₺{result.amount}</div>
              </div>
            )}
            <Link href="/" style={{
              display: "inline-block", padding: "12px 32px",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              color: "#fff", textDecoration: "none", borderRadius: 12, fontWeight: 700, fontSize: 15,
            }}>
              Ana Sayfaya Dön
            </Link>
          </>
        )}

        {(status === "failed" || status === "error") && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(220,38,38,0.1)", border: "3px solid #dc2626",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, margin: "0 auto 22px",
            }}>✕</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, color: "#dc2626" }}>
              {status === "error" ? "Bir Hata Oluştu" : "Ödeme Başarısız"}
            </h1>
            <p style={{ fontSize: 14, color: "var(--color-text-2)", lineHeight: 1.65, marginBottom: 28 }}>
              {message || "Ödeme işlemi sırasında bir sorun oluştu. Lütfen tekrar deneyin."}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/premium" style={{
                padding: "11px 24px", background: "var(--color-accent)", color: "#fff",
                textDecoration: "none", borderRadius: 10, fontWeight: 600, fontSize: 14,
              }}>
                Tekrar Dene
              </Link>
              <Link href="/" style={{
                padding: "11px 24px", border: "1px solid var(--color-border)",
                color: "var(--color-text-2)", textDecoration: "none", borderRadius: 10, fontSize: 14,
              }}>
                Ana Sayfa
              </Link>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

export default function OdemeSonucPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: "var(--color-text-2)", fontSize: 14 }}>Yükleniyor...</p>
        </div>
      </div>
    }>
      <OdemeSonucInner />
    </Suspense>
  )
}
