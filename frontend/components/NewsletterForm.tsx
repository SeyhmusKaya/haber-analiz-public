"use client"

import { useState } from "react"

const API_URL = ""

export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle")
  const [msg, setMsg] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus("loading")
    try {
      const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus("ok")
        setMsg("Abone oldunuz!")
        setEmail("")
      } else {
        setStatus("err")
        setMsg(data.message || "Bir hata olustu.")
      }
    } catch {
      setStatus("err")
      setMsg("Baglanti hatasi.")
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
        Bultene Abone Ol
      </div>
      <p style={{ fontSize: 12, color: "var(--color-text-3)", margin: 0, lineHeight: 1.4 }}>
        Haftalik haber ozetlerini e-posta ile alin.
      </p>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          type="email"
          placeholder="E-posta adresiniz"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle") }}
          required
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: 13,
            background: "var(--color-bg)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            outline: "none",
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            background: "var(--color-accent)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: status === "loading" ? "not-allowed" : "pointer",
            opacity: status === "loading" ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {status === "loading" ? "..." : "Abone Ol"}
        </button>
      </div>
      {status === "ok" && <div style={{ fontSize: 12, color: "#22c55e" }}>{msg}</div>}
      {status === "err" && <div style={{ fontSize: 12, color: "#ef4444" }}>{msg}</div>}
    </form>
  )
}
