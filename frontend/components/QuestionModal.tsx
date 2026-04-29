"use client"

import { useState } from "react"

interface Question {
  question: string
  answer: string
}

interface Props {
  questions: Question[]
  onClose: () => void
}

export default function QuestionModal({ questions, onClose }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560, background: "var(--color-surface)",
          border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)",
          overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--color-border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>Bu Haberle İlgili Sorular</span>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: "50%", border: "none",
            background: "var(--color-surface-2)", color: "var(--color-text-3)",
            cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {questions.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--color-text-3)", fontSize: 14 }}>
              Bu haber için henüz soru üretilmedi.
            </div>
          ) : (
            questions.map((q, i) => (
              <div key={i} style={{
                border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}>
                <div
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  style={{
                    padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between",
                    alignItems: "center", background: openIdx === i ? "var(--color-surface-2)" : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>{q.question}</span>
                  <span style={{ color: "var(--color-text-3)", fontSize: 12, transform: openIdx === i ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                </div>
                {openIdx === i && (
                  <div style={{
                    padding: "12px 16px", borderTop: "1px solid var(--color-border)",
                    fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.7,
                    background: "var(--color-bg)",
                  }}>
                    {q.answer}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
