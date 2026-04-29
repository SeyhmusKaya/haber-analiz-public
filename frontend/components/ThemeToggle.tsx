"use client"

import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const isDark = stored ? stored === "dark" : prefersDark
    setDark(isDark)
    document.documentElement.classList.toggle("light", !isDark)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("light", !next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return (
    <button
      onClick={toggle}
      aria-label="Tema değiştir"
      style={{
        width: 36,
        height: 36,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-2)",
        color: "var(--color-text-2)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  )
}
