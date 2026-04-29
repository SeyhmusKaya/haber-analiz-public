interface FactCheckBadgeProps {
  rating: "true" | "false" | "half-true" | "unverified"
}

const BADGE_CONFIG: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  true: { label: "Dogrulanmis", bg: "#16a34a", color: "#ffffff" },
  false: { label: "Yanlis", bg: "#dc2626", color: "#ffffff" },
  "half-true": { label: "Yarim Dogru", bg: "#d97706", color: "#ffffff" },
  unverified: { label: "Dogrulanmamis", bg: "#6b7280", color: "#ffffff" },
}

export default function FactCheckBadge({ rating }: FactCheckBadgeProps) {
  const config = BADGE_CONFIG[rating] || BADGE_CONFIG.unverified

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        fontSize: "12px",
        fontWeight: 600,
        borderRadius: "var(--radius-md)",
        background: config.bg,
        color: config.color,
        lineHeight: "20px",
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  )
}
