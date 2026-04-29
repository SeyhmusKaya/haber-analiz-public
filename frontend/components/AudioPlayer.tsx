"use client"

import { useState, useRef, useEffect } from "react"

interface Props {
  text: string
}

const RATES = [0.75, 1, 1.25, 1.5, 2]

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

const charsPerSec = (r: number) => r * 14

export default function AudioPlayer({ text }: Props) {
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [currentChar, setCurrentChar] = useState(0)
  const totalChars = text.length

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const startCharRef = useRef<number>(0)
  // Her startFrom çağrısı kendi neslini alır; eski callback'ler geçersiz olur
  const genRef = useRef(0)
  // handlePlayPause / handleSeek / handleRate en güncel state'e erişebilsin
  const playingRef = useRef(false)
  const rateRef = useRef(1)
  const currentCharRef = useRef(0)

  const totalDuration = totalChars / charsPerSec(rate)
  const currentTime = currentChar / charsPerSec(rate)
  const progress = totalChars > 0 ? Math.min(currentChar / totalChars, 1) : 0

  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function startFrom(charPos: number, r: number) {
    const myGen = ++genRef.current

    speechSynthesis.cancel()
    clearTimer()

    // Immediately anchor the bar at charPos so it doesn't jump
    currentCharRef.current = charPos
    setCurrentChar(charPos)

    const sliced = text.slice(charPos)
    if (!sliced.trim()) return

    const utter = new SpeechSynthesisUtterance(sliced)
    utter.lang = "tr-TR"
    utter.rate = r

    utter.onboundary = (e) => {
      if (genRef.current !== myGen) return
      const pos = charPos + e.charIndex
      // Only move forward — never let a stale boundary event pull bar backward
      if (pos < currentCharRef.current) return
      currentCharRef.current = pos
      setCurrentChar(pos)
    }

    utter.onend = () => {
      if (genRef.current !== myGen) return
      playingRef.current = false
      setPlaying(false)
      currentCharRef.current = totalChars
      setCurrentChar(totalChars)
      clearTimer()
    }

    utter.onerror = (e) => {
      if (genRef.current !== myGen) return
      // "interrupted" / "canceled" hataları kasıtlı cancel() çağrısından gelir, yok say
      if (e.error === "interrupted" || e.error === "canceled") return
      playingRef.current = false
      setPlaying(false)
      clearTimer()
    }

    startTimeRef.current = Date.now()
    startCharRef.current = charPos

    speechSynthesis.speak(utter)
    playingRef.current = true
    setPlaying(true)

    // Boundary event desteği zayıf tarayıcılar için smooth fallback
    intervalRef.current = setInterval(() => {
      if (genRef.current !== myGen) return
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const estimated = startCharRef.current + elapsed * charsPerSec(r)
      setCurrentChar(c => {
        const next = Math.min(Math.max(c, Math.floor(estimated)), totalChars)
        currentCharRef.current = next
        return next
      })
    }, 200)
  }

  function handlePlayPause() {
    if (!("speechSynthesis" in window)) return

    if (playingRef.current) {
      genRef.current++ // eski callback'leri geçersiz kıl
      speechSynthesis.cancel()
      playingRef.current = false
      setPlaying(false)
      clearTimer()
      return
    }

    const from = currentCharRef.current >= totalChars ? 0 : currentCharRef.current
    if (from === 0) {
      currentCharRef.current = 0
      setCurrentChar(0)
    }
    startFrom(from, rateRef.current)
  }

  function handleStop() {
    genRef.current++
    speechSynthesis.cancel()
    playingRef.current = false
    setPlaying(false)
    currentCharRef.current = 0
    setCurrentChar(0)
    clearTimer()
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1))
    const charPos = Math.floor(pct * totalChars)
    currentCharRef.current = charPos
    setCurrentChar(charPos)
    if (playingRef.current) {
      startFrom(charPos, rateRef.current)
    }
  }

  function handleRate() {
    const idx = RATES.indexOf(rateRef.current)
    const next = RATES[(idx + 1) % RATES.length]
    rateRef.current = next
    setRate(next)
    if (playingRef.current) {
      startFrom(currentCharRef.current, next)
    }
  }

  useEffect(() => () => {
    genRef.current++
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesis.cancel()
    }
    clearTimer()
  }, [])

  const [hasSpeech, setHasSpeech] = useState<boolean | null>(null)
  useEffect(() => {
    // WebView'da SpeechSynthesis kararsız — devre dışı bırak
    if (typeof (window as any).MedyaIzleApp !== "undefined") { setHasSpeech(false); return }
    setHasSpeech("speechSynthesis" in window)
  }, [])
  if (hasSpeech === null || !hasSpeech) return null

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 16,
      padding: "16px 20px",
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔊</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>Sesli Dinle</span>
          {playing && (
            <span style={{
              fontSize: 10, fontWeight: 700, background: "var(--color-accent)",
              color: "#fff", padding: "2px 7px", borderRadius: 99, letterSpacing: "0.05em",
            }}>CANLI</span>
          )}
        </div>
        <button
          onClick={handleRate}
          style={{
            padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700,
            background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
            color: "var(--color-text-2)", cursor: "pointer",
          }}
        >
          {rate}x
        </button>
      </div>

      {/* Progress bar */}
      <div
        onClick={handleSeek}
        style={{
          height: 6, background: "var(--color-border)", borderRadius: 99,
          cursor: "pointer", position: "relative", marginBottom: 8,
        }}
      >
        <div style={{
          height: "100%", width: `${progress * 100}%`,
          background: "var(--color-accent)", borderRadius: 99,
          transition: playing ? "none" : "width 0.15s",
          position: "relative",
          pointerEvents: "none",
        }}>
          <div style={{
            position: "absolute", right: -5, top: -4,
            width: 14, height: 14, borderRadius: "50%",
            background: "var(--color-accent)",
            boxShadow: "0 0 0 3px var(--color-surface), 0 0 0 4px var(--color-accent)",
            opacity: playing ? 1 : 0.6,
          }} />
        </div>
      </div>

      {/* Time */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-3)", marginBottom: 14 }}>
        <span>{fmtTime(currentTime)}</span>
        <span>{fmtTime(totalDuration)}</span>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        {/* Rewind 10s */}
        <button
          onClick={() => {
            const to = Math.max(0, currentCharRef.current - Math.floor(charsPerSec(rateRef.current) * 10))
            currentCharRef.current = to
            setCurrentChar(to)
            if (playingRef.current) startFrom(to, rateRef.current)
          }}
          title="10 saniye geri"
          style={ctrlBtn}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
            <text x="7" y="16" fontSize="7" fontWeight="bold" stroke="none" fill="currentColor">10</text>
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "var(--color-accent)", border: "none",
            color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
            transition: "transform 0.15s, opacity 0.15s",
            fontSize: 18,
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          {playing ? "⏸" : "▶"}
        </button>

        {/* Stop */}
        <button onClick={handleStop} title="Durdur" style={ctrlBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </button>

        {/* Forward 10s */}
        <button
          onClick={() => {
            const to = Math.min(totalChars, currentCharRef.current + Math.floor(charsPerSec(rateRef.current) * 10))
            currentCharRef.current = to
            setCurrentChar(to)
            if (playingRef.current) startFrom(to, rateRef.current)
          }}
          title="10 saniye ileri"
          style={ctrlBtn}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-.49-3.51" />
            <text x="7" y="16" fontSize="7" fontWeight="bold" stroke="none" fill="currentColor">10</text>
          </svg>
        </button>
      </div>
    </div>
  )
}

const ctrlBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: "50%",
  background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
  color: "var(--color-text-2)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "all 0.15s",
}
