"use client"

import { useState } from "react"

export default function EmbedOlusturucuPage() {
  const [eventId, setEventId] = useState("")
  const [width, setWidth] = useState("600")
  const [height, setHeight] = useState("400")
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const embedUrl = `${baseUrl}/embed/event/${eventId}?theme=${theme}`
  const iframeCode = `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" style="border-radius:12px;border:1px solid #333;"></iframe>`

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
        Embed Widget Olusturucu
      </h1>
      <p style={{ fontSize: 14, color: "var(--color-text-3)", marginBottom: 32 }}>
        Haber analizini kendi sitenize gomun
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={labelStyle}>Haber ID</label>
          <input type="number" value={eventId} onChange={e => setEventId(e.target.value)} placeholder="ornegin: 285" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Tema</label>
          <select value={theme} onChange={e => setTheme(e.target.value as any)} style={inputStyle}>
            <option value="dark">Koyu</option>
            <option value="light">Acik</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Genislik (px)</label>
          <input type="number" value={width} onChange={e => setWidth(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Yukseklik (px)</label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} style={inputStyle} />
        </div>
      </div>

      {eventId && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Embed Kodu</label>
            <textarea
              readOnly value={iframeCode}
              onClick={e => (e.target as HTMLTextAreaElement).select()}
              rows={3}
              style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12, resize: "none" }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Onizleme</label>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--color-border)" }}>
              <iframe src={embedUrl} width={width} height={height} style={{ border: "none", display: "block" }} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 6 }
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", fontSize: 13, background: "var(--color-bg)",
  border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
  color: "var(--color-text)", outline: "none", boxSizing: "border-box" as const,
}
