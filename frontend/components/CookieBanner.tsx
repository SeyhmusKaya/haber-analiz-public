"use client"

import { useState, useEffect } from "react"

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent")
    if (consent !== "accepted") {
      setVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "linear-gradient(135deg, rgba(15, 15, 15, 0.97), rgba(30, 30, 30, 0.97))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "0 clamp(16px, 4vw, 40px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          padding: "18px 0",
        }}
      >
        <div style={{ flex: "1 1 400px", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>🍪</span>
          <div>
            <p
              style={{
                margin: 0,
                color: "#f0f0f0",
                fontSize: 14,
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              Bu site, deneyiminizi iyileştirmek için çerezleri kullanmaktadır.
            </p>
            <p
              style={{
                margin: "4px 0 0",
                color: "#999",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              Siteyi kullanmaya devam ederek çerez politikamızı kabul etmiş olursunuz.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <a
            href="/cerez-politikasi"
            style={{
              color: "#aaa",
              fontSize: 13,
              textDecoration: "none",
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.1)",
              transition: "all 200ms ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)"
              e.currentTarget.style.color = "#ddd"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"
              e.currentTarget.style.color = "#aaa"
            }}
          >
            Çerez Politikası
          </a>
          <button
            onClick={handleAccept}
            style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 28px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              minWidth: 44,
              minHeight: 44,
              transition: "all 200ms ease",
              boxShadow: "0 2px 12px rgba(37, 99, 235, 0.3)",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)"
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(37, 99, 235, 0.45)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 2px 12px rgba(37, 99, 235, 0.3)"
            }}
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  )
}
