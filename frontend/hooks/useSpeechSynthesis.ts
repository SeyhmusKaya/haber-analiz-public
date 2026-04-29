"use client"

import { useState, useCallback, useRef } from "react"

export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string, lang = "tr-TR") => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = 0.95
    utter.pitch = 1

    // Try to find Turkish voice
    const voices = window.speechSynthesis.getVoices()
    const trVoice = voices.find(v => v.lang.startsWith("tr"))
    if (trVoice) utter.voice = trVoice

    utter.onstart = () => { setSpeaking(true); setPaused(false) }
    utter.onend = () => { setSpeaking(false); setPaused(false) }
    utter.onerror = () => { setSpeaking(false); setPaused(false) }

    utterRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [])

  const pause = useCallback(() => {
    if (typeof window === "undefined") return
    window.speechSynthesis.pause()
    setPaused(true)
  }, [])

  const resume = useCallback(() => {
    if (typeof window === "undefined") return
    window.speechSynthesis.resume()
    setPaused(false)
  }, [])

  const stop = useCallback(() => {
    if (typeof window === "undefined") return
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
  }, [])

  return { speak, pause, resume, stop, speaking, paused }
}
