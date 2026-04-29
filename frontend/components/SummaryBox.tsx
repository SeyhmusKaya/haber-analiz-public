"use client"

import AudioPlayer from "./AudioPlayer"
import AiFlagButton from "./AiFlagButton"

interface Props {
  title: string
  summary: string
  eventId: number
}

export default function SummaryBox({ title, summary, eventId }: Props) {
  return (
    <div style={{
      background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)", padding: "20px 22px", marginBottom: 32,
    }}>
      <AudioPlayer text={`${title}. ${summary}`} />
      <p data-speakable="summary" style={{ fontSize: 15, lineHeight: 1.7, color: "var(--color-text-2)", marginTop: 14 }}>
        {summary}
      </p>
      <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
        <AiFlagButton eventId={eventId} type="summary" />
      </div>
    </div>
  )
}
