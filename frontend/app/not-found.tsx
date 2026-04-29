import Link from "next/link"

export default function NotFound() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      paddingBlock: 100,
      gap: 12,
      textAlign: "center",
    }}>
      <span style={{ fontSize: 48 }}>🔍</span>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
        Sayfa Bulunamadı
      </h2>
      <p style={{ fontSize: 14, color: "var(--color-text-3)" }}>
        Aradığınız haber mevcut değil veya kaldırılmış.
      </p>
      <Link
        href="/"
        style={{
          marginTop: 8,
          height: 40,
          paddingInline: 24,
          borderRadius: "var(--radius-md)",
          background: "var(--color-accent)",
          color: "white",
          fontSize: 14,
          fontWeight: 500,
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
        }}
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  )
}
