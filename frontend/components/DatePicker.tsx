"use client"

interface Props {
  value: string
  onChange: (date: string) => void
  label?: string
}

export default function DatePicker({ value, onChange, label }: Props) {
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 6 }}>{label}</label>}
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: "8px 12px", fontSize: 13, background: "var(--color-bg)",
          border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
          color: "var(--color-text)", outline: "none", width: "100%",
          colorScheme: "dark",
        }}
      />
    </div>
  )
}
