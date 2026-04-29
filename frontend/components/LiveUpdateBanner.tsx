"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSSE } from "@/hooks/useSSE"
import BreakingNewsBanner from "./BreakingNewsBanner"

export default function LiveUpdateBanner() {
  const { newEventsCount, latestEvent, reset } = useSSE()
  const [breakingDismissed, setBreakingDismissed] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(true)
  const router = useRouter()

  const showBreaking = !breakingDismissed && latestEvent && latestEvent.importance_score >= 7

  // Auto-hide banner after 3 seconds
  useEffect(() => {
    if (newEventsCount > 0) {
      setBannerVisible(true)
      const timer = setTimeout(() => setBannerVisible(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [newEventsCount])

  return (
    <>
      {showBreaking && (
        <BreakingNewsBanner
          eventId={latestEvent!.id}
          title={latestEvent!.title_tr}
          onDismiss={() => setBreakingDismissed(true)}
        />
      )}

      {newEventsCount > 0 && bannerVisible && (
        <div style={{
          position: "fixed",
          top: showBreaking ? 100 : 60,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 45,
          animation: "fadeUp 0.3s ease",
          width: "max-content",
          maxWidth: "calc(100vw - 32px)",
        }}>
          <button
            onClick={() => {
              reset()
              setBreakingDismissed(true)
              setBannerVisible(false)
              router.refresh()
            }}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "#fff",
              border: "none",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#93c5fd",
              boxShadow: "0 0 6px rgba(147,197,253,0.8)",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
            {newEventsCount} yeni haber — Güncelle
          </button>
        </div>
      )}
    </>
  )
}
