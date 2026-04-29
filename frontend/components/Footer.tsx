"use client"

import Link from "next/link"

const CATEGORIES = [
  { label: "Siyaset",    href: "/?category=siyaset",      icon: "🏛️" },
  { label: "Ekonomi",    href: "/?category=ekonomi",      icon: "📈" },
  { label: "Savaş",      href: "/?category=savas-catisma", icon: "⚔️" },
  { label: "Diplomasi",  href: "/?category=diplomasi",    icon: "🤝" },
  { label: "Teknoloji",  href: "/?category=teknoloji",    icon: "💻" },
  { label: "Spor",       href: "/?category=spor",         icon: "⚽" },
]

const EXPLORE = [
  { label: "Kaynaklar",           href: "/kaynaklar" },
  { label: "Raporlar",            href: "/raporlar" },
  { label: "Medya Okuryazarlığı", href: "/medya-okuryazarligi" },
  { label: "Arşiv",               href: "/arsiv" },
  { label: "Arama",               href: "/arama" },
  { label: "Konsensüs",           href: "/konsensus" },
  { label: "Bültene Abone Ol",    href: "/profil/bulten" },
]

const LEGAL = [
  { label: "Hakkımızda",         href: "/hakkimizda" },
  { label: "Metodoloji",         href: "/metodoloji" },
  { label: "İletişim",           href: "/iletisim" },
  { label: "Kullanım Koşulları", href: "/kullanim-kosullari" },
  { label: "Gizlilik Politikası", href: "/gizlilik" },
  { label: "Çerez Politikası",   href: "/cerez-politikasi" },
  { label: "S.S.S.",             href: "/sikca-sorulan-sorular" },
  { label: "API Dokümantasyonu", href: "/api-docs" },
]


export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--color-border)",
      background: "var(--color-surface)",
      marginTop: 64,
      position: "relative",
      overflowX: "hidden",
      width: "100%",
    }}>
      {/* Gradient line top */}
      <div style={{
        position: "absolute", top: -1, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, #2563eb, #7c3aed, #ec4899, #10b981, #2563eb)",
        backgroundSize: "200% 100%",
      }} />

      {/* Main grid */}
      <div className="footer-grid" style={{
        width: "100%",
        padding: "52px clamp(16px, 3vw, 32px) 32px",
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: "clamp(24px, 3vw, 48px)",
      }}>

        {/* Brand */}
        <div>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <img src="/logo.png" alt="Medya İzle" style={{ width: 32, height: 32, borderRadius: 9, objectFit: "cover" }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: "var(--color-text)", letterSpacing: "-0.03em" }}>
              Medya İzle
            </span>
          </Link>
          <p style={{ fontSize: 13, color: "var(--color-text-3)", lineHeight: 1.7, marginBottom: 18, maxWidth: 260 }}>
            Haberi değil, bakış açısını oku. Aynı olayın farklı ülkelerde nasıl yorumlandığını
            yapay zeka ile keşfet.
          </p>

        </div>

        {/* Categories */}
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-2)", marginBottom: 16 }}>
            Kategoriler
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {CATEGORIES.map(cat => (
              <Link key={cat.href} href={cat.href} style={{
                fontSize: 13, color: "var(--color-text-3)", textDecoration: "none",
                display: "flex", alignItems: "center", gap: 7,
                padding: "4px 0", transition: "color 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-accent)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-3)")}
              >
                <span style={{ fontSize: 12 }}>{cat.icon}</span>
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Corporate */}
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-2)", marginBottom: 16 }}>
            Kurumsal
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {LEGAL.map(item => (
              <Link key={item.href} href={item.href} style={{
                fontSize: 13, color: "var(--color-text-3)", textDecoration: "none",
                padding: "4px 0", transition: "color 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-accent)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-3)")}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-2)", marginBottom: 16 }}>
            Keşfet
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {EXPLORE.map(item => (
              <Link key={item.href} href={item.href} style={{
                fontSize: 13, color: "var(--color-text-3)", textDecoration: "none",
                padding: "4px 0", transition: "color 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-accent)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-3)")}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="footer-bottom" style={{
        maxWidth: 1280, margin: "0 auto",
        padding: "16px 20px",
        borderTop: "1px solid var(--color-border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 10,
      }}>
        <p style={{ fontSize: 12, color: "var(--color-text-3)", margin: 0 }}>
          © {new Date().getFullYear()} Medya İzle. Tüm hakları saklıdır.
        </p>
        <div className="footer-bottom-right" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <p style={{ fontSize: 12, color: "var(--color-text-3)", fontStyle: "italic", margin: 0 }}>
            Haberi değil, bakış açısını oku
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "Gizlilik", href: "/gizlilik" },
              { label: "Çerezler", href: "/cerez-politikasi" },
              { label: "Koşullar", href: "/kullanim-kosullari" },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{
                fontSize: 11, color: "var(--color-text-3)", textDecoration: "none",
                transition: "color 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-accent)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-3)")}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </footer>
  )
}
