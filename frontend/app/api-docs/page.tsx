import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Dokumantasyonu | Medya İzle",
  description: "Medya İzle herkese acik API dokumantasyonu.",
}

interface EndpointInfo {
  method: string
  path: string
  description: string
}

const ENDPOINTS: EndpointInfo[] = [
  {
    method: "GET",
    path: "/api/events",
    description: "Tum haberleri listeler. Sayfalama ve kategori filtreleme destekler.",
  },
  {
    method: "GET",
    path: "/api/events/:id",
    description: "Belirli bir haberin detayini ve mevcut ulke listesini dondurur.",
  },
  {
    method: "GET",
    path: "/api/events/:id/countries",
    description: "Haberin hangi ulkelerde kapsandigini gosterir.",
  },
  {
    method: "GET",
    path: "/api/analysis/:event_id/:country_code",
    description: "Belirli bir ulkenin yandas ve muhalif medya analizini dondurur.",
  },
  {
    method: "GET",
    path: "/api/sources",
    description: "Takip edilen tum haber kaynaklarini listeler.",
  },
  {
    method: "GET",
    path: "/api/reports/weekly",
    description: "Haftalik medya analiz raporunu dondurur.",
  },
]

export default function ApiDocsPage() {
  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "var(--color-text)",
          marginBottom: "8px",
        }}
      >
        API Dokümantasyonu
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "var(--color-text-2)",
          marginBottom: "20px",
          lineHeight: 1.6,
        }}
      >
        Medya İzle API ile haber verilerine ve medya analizlerine programatik olarak erişebilirsiniz.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          padding: "16px 20px",
          background: "rgba(37,99,235,0.06)",
          border: "1px solid rgba(37,99,235,0.2)",
          borderRadius: "var(--radius-lg)",
          marginBottom: "28px",
        }}
      >
        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>🔑</span>
        <div>
          <p style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
            API erişimi için talep gereklidir
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.6 }}>
            API anahtarı almak için{" "}
            <a href="/iletisim" style={{ color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}>
              İletişim
            </a>{" "}
            sayfasından talebinizi iletebilirsiniz. Erişim yalnızca onaylanan kullanıcılara açılmaktadır.
          </p>
        </div>
      </div>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 24px",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          Durum
        </h2>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            fontSize: "13px",
            fontWeight: 600,
            borderRadius: "var(--radius-md)",
            background: "#d97706",
            color: "#ffffff",
          }}
        >
          Yakinda
        </span>
        <p
          style={{
            margin: "12px 0 0 0",
            fontSize: "14px",
            color: "var(--color-text-3)",
          }}
        >
          API su anda gelistirme asamasindadir. Asagidaki endpointler planlanmaktadir.
        </p>
      </div>

      <h2
        style={{
          fontSize: "20px",
          fontWeight: 600,
          color: "var(--color-text)",
          marginBottom: "16px",
        }}
      >
        Planlanan Endpointler
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
        {ENDPOINTS.map((ep) => (
          <div
            key={ep.path}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: ep.method === "GET" ? "#2563eb" : "#16a34a",
                  color: "#ffffff",
                  fontFamily: "monospace",
                }}
              >
                {ep.method}
              </span>
              <code
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--color-text)",
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                }}
              >
                {ep.path}
              </code>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "var(--color-text-2)",
              }}
            >
              {ep.description}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
        }}
      >
        <h2
          style={{
            margin: "0 0 12px 0",
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          Hiz Sinirlamasi
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "15px",
            color: "var(--color-text-2)",
            lineHeight: 1.7,
          }}
        >
          API saatte <strong>100 istek</strong> ile sinirlidir. Rate limit bilgisi her yanit baslIginda{" "}
          <code
            style={{
              background: "var(--color-surface-2)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "13px",
            }}
          >
            X-RateLimit-Remaining
          </code>{" "}
          header&apos;i ile dondurulur. Sinirin asilmasi durumunda{" "}
          <code
            style={{
              background: "var(--color-surface-2)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "13px",
            }}
          >
            429 Too Many Requests
          </code>{" "}
          yaniti alinir.
        </p>
      </div>
    </main>
  )
}
