import type { NextConfig } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://medyaizle.com"

const nextConfig: NextConfig = {
  experimental: {},

  async rewrites() {
    return [
      // Proxy /api/* -> Laravel backend (client-side fetch calls)
      { source: "/api/:path*", destination: "http://localhost:8000/api/:path*" },
    ]
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",          value: "DENY" },
          { key: "X-XSS-Protection",         value: "1; mode=block" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Statik assetler uzun süreli cache
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Görseller
      {
        source: "/(.*)\\.(jpg|jpeg|png|gif|webp|svg|ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      // Haber sayfaları — arama motorlarına öncelikli
      {
        source: "/haber/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" },
          { key: "Link",          value: `<${SITE_URL}>; rel="canonical"` },
        ],
      },
    ]
  },
}

export default nextConfig
