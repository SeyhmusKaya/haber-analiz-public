export default function LoadingSpinner() {
  return (
    <div style={{
      width: 20,
      height: 20,
      borderRadius: "50%",
      border: "2px solid var(--color-border)",
      borderTopColor: "var(--color-accent)",
      animation: "spin 0.7s linear infinite",
    }} />
  )
}

export function SkeletonCard() {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div className="animate-shimmer" style={{ height: 20, width: 70, borderRadius: 99 }} />
        <div className="animate-shimmer" style={{ height: 20, width: 50, borderRadius: 99, marginLeft: "auto" }} />
      </div>
      <div className="animate-shimmer" style={{ height: 16, borderRadius: 6 }} />
      <div className="animate-shimmer" style={{ height: 16, borderRadius: 6, width: "80%" }} />
      <div className="animate-shimmer" style={{ height: 13, borderRadius: 6 }} />
      <div className="animate-shimmer" style={{ height: 13, borderRadius: 6, width: "60%" }} />
      <div style={{ display: "flex", gap: 4, paddingTop: 8, borderTop: "1px solid var(--color-border-subtle)", marginTop: "auto" }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-shimmer" style={{ height: 18, width: 18, borderRadius: "50%" }} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonAnalysis() {
  return (
    <div style={{ position: "relative" }}>
      {/* Skeleton cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[1, 2].map(i => (
          <div key={i} style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            <div className="animate-shimmer" style={{ height: 14, width: 120, borderRadius: 6 }} />
            {[1, 2, 3, 4].map(j => (
              <div key={j} className="animate-shimmer" style={{ height: 14, borderRadius: 6, width: j === 4 ? "70%" : "100%" }} />
            ))}
          </div>
        ))}
      </div>

      {/* Loading overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        borderRadius: "var(--radius-lg)",
        backdropFilter: "blur(3px)",
        background: "var(--color-overlay)",
      }}>
        {/* Spinner */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid var(--color-border)",
          borderTopColor: "var(--color-accent)",
          animation: "spin 0.8s linear infinite",
        }} />
        <div style={{ textAlign: "center" }}>
          <p style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: 4,
          }}>
            Yapay zeka verileri getiriyor
          </p>
          <p style={{
            fontSize: 13,
            color: "var(--color-text-3)",
          }}>
            Kaynaklar analiz ediliyor...
          </p>
        </div>
      </div>
    </div>
  )
}
