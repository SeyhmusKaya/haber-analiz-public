"use client"

import { useState } from "react"
import Link from "next/link"

interface Props {
  eventId: number
  title: string
  onDismiss: () => void
}

export default function BreakingNewsBanner({ eventId, title, onDismiss }: Props) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 900,
      background: "linear-gradient(90deg, #dc2626, #b91c1c)",
      padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
      animation: "slideDown 0.3s ease",
    }}>
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "#fff",
        background: "rgba(0,0,0,0.3)", padding: "3px 8px", borderRadius: 4,
        textTransform: "uppercase", whiteSpace: "nowrap",
      }}>
        SON DAKİKA
      </span>
      <Link href={`/haber/${eventId}`} style={{
        color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600,
        flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {title}
      </Link>
      <button
        onClick={() => { setVisible(false); onDismiss() }}
        style={{
          background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
          width: 24, height: 24, borderRadius: "50%", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}
