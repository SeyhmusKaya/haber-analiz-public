"use client"

import { useEffect, useState, useCallback } from "react"

const API_URL = ""

interface SSEEvent {
  type: string
  event?: {
    id: number
    title_tr: string
    category: string
    importance_score: number
    created_at: string
  }
}

export function useSSE() {
  const [newEventsCount, setNewEventsCount] = useState(0)
  const [latestEvent, setLatestEvent] = useState<SSEEvent["event"] | null>(null)
  const [connected, setConnected] = useState(false)

  const reset = useCallback(() => {
    setNewEventsCount(0)
    setLatestEvent(null)
  }, [])

  useEffect(() => {
    // WebView'da SSE devre dışı — reconnect döngüsü crash'e yol açıyor
    // window.MedyaIzleApp Flutter'ın addJavaScriptChannel ile enjekte edilir
    if (typeof window !== "undefined" && typeof (window as any).MedyaIzleApp !== "undefined") return

    let es: EventSource | null = null
    let reconnectTimer: NodeJS.Timeout | null = null

    function connect() {
      try {
        es = new EventSource(`${API_URL}/api/events/stream`)

        es.onmessage = (event) => {
          try {
            const data: SSEEvent = JSON.parse(event.data)
            if (data.type === "connected") {
              setConnected(true)
            } else if (data.type === "new_event" && data.event) {
              setNewEventsCount(c => c + 1)
              setLatestEvent(data.event)
            }
          } catch { /* ignore parse errors */ }
        }

        es.onerror = () => {
          setConnected(false)
          es?.close()
          // Reconnect after 10 seconds
          reconnectTimer = setTimeout(connect, 10000)
        }
      } catch { /* SSE not supported */ }
    }

    connect()

    return () => {
      es?.close()
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }
  }, [])

  return { newEventsCount, latestEvent, connected, reset }
}
