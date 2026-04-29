export const dynamic = "force-dynamic"

import type { Metadata } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://medyaizle.com"

export const metadata: Metadata = {
  title: "Medya İzle — Yapay Zeka ile Medya Analizi ve Haber Karşılaştırma",
  description:
    "Aynı haberi 10 ülkenin yandaş ve muhalif medyasıyla karşılaştırın. Yapay zeka destekli propaganda analizi, medya yanlılığı tespiti ve tarafsız haber okuryazarlığı platformu.",
  keywords: [
    "yapay zeka haber analizi",
    "medya analizi",
    "haber karşılaştırma",
    "yandaş medya",
    "muhalif medya",
    "tarafsız haber",
    "propaganda tespiti",
    "medya yanlılığı",
    "dünya haberleri",
    "Türkçe haber analizi",
    "AI haber",
    "medya okuryazarlığı",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Medya İzle — Yapay Zeka ile Medya Analizi",
    description:
      "Aynı haberi 10 ülkenin yandaş ve muhalif medyasıyla karşılaştırın. Propaganda analizi, medya yanlılığı tespiti.",
    url: SITE_URL,
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Medya İzle" }],
  },
}

import { Suspense } from "react"
import { getEvents, getSliderEvents, getPopularEvents, getGundemEvents, getMostReadEvents, getStats, getTensions, getTurkiyeGundemEvents, getTurkiyeKutuplasmaEvents, TensionPair } from "@/lib/api"
import NewsList from "@/components/NewsList"
import CategoryFilter from "@/components/CategoryFilter"
import HeroSlider from "@/components/HeroSlider"
import NewsTicker from "@/components/NewsTicker"
import StatsBand from "@/components/StatsBand"
import PopularNews from "@/components/PopularNews"
import MostReadSection from "@/components/MostReadSection"
import GundemSection from "@/components/GundemSection"
import WorldMap from "@/components/WorldMap"
import TensionSection from "@/components/TensionSection"
import NedenMedyaIzle from "@/components/NedenMedyaIzle"
import AdBanner from "@/components/AdBanner"
import LiveUpdateBanner from "@/components/LiveUpdateBanner"
import SiteChatbot from "@/components/SiteChatbot"

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function Home({ searchParams }: PageProps) {
  const { category } = await searchParams

  let initialEvents: import("@/types").Event[] = []
  let initialTotal = 0
  let sliderEvents: import("@/types").Event[] = []
  let popularEvents: import("@/types").Event[] = []
  let gundemEvents: import("@/types").Event[] = []
  let mostReadEvents: import("@/types").Event[] = []
  let turkiyeGundemEvents: import("@/types").Event[] = []
  let turkiyeKutuplasmaEvents: import("@/types").Event[] = []
  let stats = { total_events: 0, today_events: 0, total_sources: 0, total_countries: 0, total_articles: 0 }
  let tensions: TensionPair[] = []

  try {
    const [eventsData, sliderData, popularData, gundemData, mostReadData, statsData, tensionsData, turkiyeGundemData, turkiyeKutuplasmaData] = await Promise.all([
      getEvents(1, category),
      getSliderEvents(),
      getPopularEvents(),
      getGundemEvents(),
      getMostReadEvents(),
      getStats(),
      getTensions(),
      getTurkiyeGundemEvents(),
      getTurkiyeKutuplasmaEvents(),
    ])
    initialEvents = eventsData.events
    initialTotal = eventsData.total
    sliderEvents = sliderData.events.filter((e: any) => e.image_url).slice(0, 10)
    popularEvents = popularData.events
    gundemEvents = gundemData.events
    mostReadEvents = mostReadData.events
    turkiyeGundemEvents = turkiyeGundemData.events
    turkiyeKutuplasmaEvents = turkiyeKutuplasmaData.events
    stats = statsData
    tensions = tensionsData.tensions
  } catch {
    // Backend not running
  }

  const showDashboard = !category || category === "tumu"

  return (
    <div>
      {/* News Ticker */}
      <LiveUpdateBanner />
      {showDashboard && sliderEvents.length > 0 && (
        <NewsTicker events={initialEvents.slice(0, 10)} />
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        {/* Hero Slider - only on main dashboard */}
        {showDashboard && sliderEvents.length > 0 && (
          <div style={{
            marginTop: 24, marginBottom: 24,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}>
            <HeroSlider events={sliderEvents} />
          </div>
        )}

        {/* Stats Band */}
        {showDashboard && stats.total_events > 0 && (
          <StatsBand stats={stats} />
        )}

        {/* World Map */}
        {showDashboard && stats.total_events > 0 && (
          <WorldMap stats={(stats as any).country_stats || []} />
        )}

        {/* Tension Section */}
        {showDashboard && <TensionSection initialTensions={tensions} />}

        {/* Neden Medya İzle — AdSense katma değer kanıtı */}
        {showDashboard && <NedenMedyaIzle />}

        {/* Dünya Gündemi Section - only on main dashboard */}
        {showDashboard && gundemEvents.length > 0 && (
          <GundemSection events={gundemEvents} title="🗞️ Dünya Gündemi" moreHref="/dunyadan-haberler" />
        )}

        {/* Türkiye Gündemi Section */}
        {showDashboard && turkiyeGundemEvents.length > 0 && (
          <GundemSection events={turkiyeGundemEvents} title={<><img src="https://flagcdn.com/20x15/tr.png" alt="TR" style={{ height: 13, borderRadius: 1, verticalAlign: "middle" }} /> Türkiye Gündemi</>} moreHref="/turkiyeden-haberler" showSources />
        )}

        {/* Türkiye'den Kutuplaşmalar Section */}
        {showDashboard && turkiyeKutuplasmaEvents.length > 0 && (
          <GundemSection events={turkiyeKutuplasmaEvents} title={<><img src="https://flagcdn.com/20x15/tr.png" alt="TR" style={{ height: 13, borderRadius: 1, verticalAlign: "middle" }} /> ⚡ Türkiye'den Kutuplaşmalar</>} moreHref="/kutuplasmalar" showSources />
        )}

        {initialEvents.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingBlock: 80,
            gap: 12,
            textAlign: "center",
          }}>
            <span style={{ fontSize: 48 }}>📰</span>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)" }}>
              Henüz haber yok
            </h2>
            <p style={{ fontSize: 14, color: "var(--color-text-3)", maxWidth: 320 }}>
              Backend çalışıyor mu? RSS kaynakları çekildiğinde haberler burada görünecek.
            </p>
          </div>
        ) : (
          <div className="mobile-grid-1" style={{
            display: "grid",
            gridTemplateColumns: showDashboard ? "1fr 300px" : "1fr",
            gap: 28,
            alignItems: "start",
          }}>
            {/* Main content */}
            <div style={{
              minWidth: 0,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
            }}>
              {showDashboard && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h2 style={{
                    fontSize: 14, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.05em", color: "var(--color-text-2)",
                    display: "flex", alignItems: "center", gap: 8, margin: 0,
                  }}>
                    🌍 Dünyadan Haberler
                  </h2>
                </div>
              )}
              <Suspense fallback={null}>
                <CategoryFilter />
              </Suspense>
              <NewsList
                key={category ?? "tumu"}
                initialEvents={initialEvents}
                initialTotal={initialTotal}
                category={category}
              />
            </div>

            {/* Sidebar - only on dashboard */}
            {showDashboard && (
              <aside className="sidebar-hide-mobile" style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
                position: "sticky",
                top: 76,
                maxHeight: "calc(100vh - 96px)",
                overflowY: "auto",
              }}
              >
                <PopularNews events={popularEvents} />
                <MostReadSection events={mostReadEvents} />
                <AdBanner position="sidebar" />
              </aside>
            )}
          </div>
        )}
      </div>
      <SiteChatbot />
    </div>
  )
}
