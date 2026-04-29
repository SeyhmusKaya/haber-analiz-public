"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { apiMe } from "@/lib/api"

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const token = params.get("token")
    const error = params.get("error")

    if (error || !token) {
      router.replace("/giris?error=google_failed")
      return
    }

    localStorage.setItem("auth_token", token)
    apiMe()
      .then(user => {
        login(user, token)
        router.replace("/")
      })
      .catch(() => {
        localStorage.removeItem("auth_token")
        router.replace("/giris?error=google_failed")
      })
  }, [])

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
        <p style={{ color: "var(--color-text-2)", fontSize: 14 }}>Giriş yapılıyor...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          <p style={{ color: "var(--color-text-2)", fontSize: 14 }}>Giriş yapılıyor...</p>
        </div>
      </div>
    }>
      <CallbackInner />
    </Suspense>
  )
}
