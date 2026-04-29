"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const API_URL = "";

const CATEGORY_LABELS: Record<string, string> = {
  siyaset: "Siyaset",
  ekonomi: "Ekonomi",
  "savas-catisma": "Savaş",
  diplomasi: "Diplomasi",
  teknoloji: "Teknoloji",
  spor: "Spor",
};

const CATEGORY_COLORS: Record<string, string> = {
  siyaset: "#2563eb",
  ekonomi: "#16a34a",
  "savas-catisma": "#dc2626",
  diplomasi: "#7c3aed",
  teknoloji: "#0891b2",
  spor: "#d97706",
};

const COUNTRY_FLAGS: Record<string, string> = {
  TR: "🇹🇷",
  US: "🇺🇸",
  GB: "🇬🇧",
  DE: "🇩🇪",
  RU: "🇷🇺",
  CN: "🇨🇳",
  IR: "🇮🇷",
  IL: "🇮🇱",
  SA: "🇸🇦",
  EG: "🇪🇬",
};

const COUNTRY_NAMES: Record<string, string> = {
  TR: "Türkiye",
  US: "ABD",
  GB: "İngiltere",
  DE: "Almanya",
  RU: "Rusya",
  CN: "Çin",
  IR: "İran",
  IL: "İsrail",
  SA: "Suudi Arabistan",
  EG: "Mısır",
};

const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const TR_DAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

interface Event {
  id: number;
  title_tr: string;
  summary_tr: string;
  category: string;
  importance_score: number;
  article_count: number;
  country_codes: string[];
  created_at: string;
  view_count?: number;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d} ${TR_MONTHS[parseInt(m) - 1]} ${y}`;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  const days = Math.floor(diff / 86400);
  if (days < 7) return `${days} gün önce`;
  return formatDisplayDate(dateStr.split("T")[0]);
}

// ─── Custom Calendar Component ───────────────────────────────────────────────

interface CalendarProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

function Calendar({ selectedDate, onSelect }: CalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);

  // Monday-first: convert Sunday(0) → 6, Mon(1)→0, ...
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const atFutureMonth = () => {
    const limit = new Date(today.getFullYear(), today.getMonth(), 1);
    const current = new Date(viewYear, viewMonth, 1);
    return current >= limit;
  };

  const nextMonth = () => {
    if (atFutureMonth()) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const isFuture = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d > t;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate === `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      viewMonth === today.getMonth() &&
      viewYear === today.getFullYear()
    );
  };

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "20px",
      userSelect: "none",
    }}>
      {/* Month navigation */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "16px",
      }}>
        <button
          onClick={prevMonth}
          style={{
            width: 34, height: 34,
            borderRadius: "50%",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-2)",
            color: "var(--color-text)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--color-accent)", e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--color-surface-2)", e.currentTarget.style.color = "var(--color-text)")}
        >
          ‹
        </button>
        <span style={{
          fontWeight: 700,
          fontSize: 15,
          color: "var(--color-text)",
          letterSpacing: "0.01em",
        }}>
          {TR_MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          disabled={atFutureMonth()}
          style={{
            width: 34, height: 34,
            borderRadius: "50%",
            border: "1px solid var(--color-border)",
            background: atFutureMonth() ? "transparent" : "var(--color-surface-2)",
            color: atFutureMonth() ? "var(--color-text-3)" : "var(--color-text)",
            cursor: atFutureMonth() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
            opacity: atFutureMonth() ? 0.35 : 1,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => { if (!atFutureMonth()) { e.currentTarget.style.background = "var(--color-accent)"; e.currentTarget.style.color = "#fff"; } }}
          onMouseLeave={e => { if (!atFutureMonth()) { e.currentTarget.style.background = "var(--color-surface-2)"; e.currentTarget.style.color = "var(--color-text)"; } }}
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 2,
        marginBottom: 6,
      }}>
        {TR_DAYS_SHORT.map(d => (
          <div key={d} style={{
            textAlign: "center",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--color-text-3)",
            padding: "4px 0",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 2,
      }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const future = isFuture(day);
          const selected = isSelected(day);
          const todayCell = isToday(day);

          return (
            <button
              key={day}
              disabled={future}
              onClick={() => {
                if (!future) {
                  onSelect(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
                }
              }}
              style={{
                height: 36,
                borderRadius: "var(--radius-md, 8px)",
                border: selected
                  ? "2px solid var(--color-accent)"
                  : todayCell
                  ? "1px solid var(--color-accent)"
                  : "1px solid transparent",
                background: selected
                  ? "var(--color-accent)"
                  : todayCell
                  ? "rgba(37,99,235,0.1)"
                  : "transparent",
                color: selected ? "#fff" : future ? "var(--color-text-3)" : "var(--color-text)",
                cursor: future ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: selected || todayCell ? 700 : 400,
                opacity: future ? 0.3 : 1,
                transition: "all 0.12s ease",
              }}
              onMouseEnter={e => {
                if (!future && !selected) {
                  e.currentTarget.style.background = "var(--color-surface-2)";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                }
              }}
              onMouseLeave={e => {
                if (!future && !selected) {
                  e.currentTarget.style.background = todayCell ? "rgba(37,99,235,0.1)" : "transparent";
                  e.currentTarget.style.borderColor = todayCell ? "var(--color-accent)" : "transparent";
                }
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonCard() {
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
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ width: 68, height: 22, borderRadius: 6, background: "var(--color-surface-2)", animation: "archivePulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: 44, height: 18, borderRadius: 6, background: "var(--color-surface-2)", animation: "archivePulse 1.5s ease-in-out infinite" }} />
      </div>
      <div style={{ height: 20, borderRadius: 6, background: "var(--color-surface-2)", animation: "archivePulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 16, width: "70%", borderRadius: 6, background: "var(--color-surface-2)", animation: "archivePulse 1.5s ease-in-out infinite" }} />
      <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ width: 26, height: 18, borderRadius: 4, background: "var(--color-surface-2)", animation: "archivePulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event }: { event: Event }) {
  const catLabel = CATEGORY_LABELS[event.category] || event.category;
  const catColor = CATEGORY_COLORS[event.category] || "var(--color-accent)";

  return (
    <Link href={`/haber/${event.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          height: "100%",
          boxSizing: "border-box",
          transition: "all 0.2s ease",
          cursor: "pointer",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "var(--color-accent)";
          el.style.transform = "translateY(-2px)";
          el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "var(--color-border)";
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "none";
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            background: `${catColor}18`,
            color: catColor,
            border: `1px solid ${catColor}30`,
            flexShrink: 0,
          }}>
            {catLabel}
          </span>
          {event.importance_score >= 8 && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: "#dc262612", color: "#dc2626", border: "1px solid #dc262628",
              flexShrink: 0,
            }}>
              🔥 Önemli
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-text-3)", flexShrink: 0 }} suppressHydrationWarning>
            {timeAgo(event.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--color-text)",
          lineHeight: 1.5,
          margin: "0 0 8px 0",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {event.title_tr}
        </h3>

        {/* Summary */}
        {event.summary_tr && (
          <p style={{
            fontSize: 13,
            color: "var(--color-text-2)",
            lineHeight: 1.6,
            margin: "0 0 14px 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {event.summary_tr}
          </p>
        )}

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: "auto" }}>
          <div style={{ display: "flex", gap: 2 }}>
            {(event.country_codes || []).slice(0, 6).map(cc => (
              <span key={cc} title={COUNTRY_NAMES[cc] || cc} style={{ fontSize: 16 }}>
                {COUNTRY_FLAGS[cc] || cc}
              </span>
            ))}
            {(event.country_codes || []).length > 6 && (
              <span style={{ fontSize: 11, color: "var(--color-text-3)", alignSelf: "center", marginLeft: 2 }}>
                +{(event.country_codes || []).length - 6}
              </span>
            )}
          </div>
          <span style={{
            marginLeft: "auto", fontSize: 12, color: "var(--color-text-3)",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <span>📰</span> {event.article_count || 0} kaynak
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── On This Day Card ─────────────────────────────────────────────────────────

function OnThisDayCard({ event, yearsAgo }: { event: Event; yearsAgo: number }) {
  const catLabel = CATEGORY_LABELS[event.category] || event.category;
  const catColor = CATEGORY_COLORS[event.category] || "var(--color-accent)";

  return (
    <Link href={`/haber/${event.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "16px 18px",
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
          transition: "all 0.2s ease",
          cursor: "pointer",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "#d97706";
          el.style.transform = "translateY(-1px)";
          el.style.boxShadow = "0 4px 16px rgba(217,119,6,0.12)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "var(--color-border)";
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "none";
        }}
      >
        {/* Year badge */}
        <div style={{
          minWidth: 50,
          height: 50,
          borderRadius: "var(--radius-md, 10px)",
          background: "linear-gradient(135deg, #d97706, #92400e)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          flexShrink: 0,
          boxShadow: "0 3px 10px rgba(217,119,6,0.3)",
        }}>
          <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>{yearsAgo}</span>
          <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.04em", marginTop: 2, opacity: 0.9 }}>YIL</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{
              padding: "2px 8px",
              borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: `${catColor}18`, color: catColor,
              flexShrink: 0,
            }}>
              {catLabel}
            </span>
            <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>
              {new Date(event.created_at).getFullYear()}
            </span>
          </div>
          <p style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-text)",
            margin: "0 0 8px 0",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {event.title_tr}
          </p>
          <div style={{ display: "flex", gap: 2 }}>
            {(event.country_codes || []).slice(0, 5).map(cc => (
              <span key={cc} style={{ fontSize: 13 }}>{COUNTRY_FLAGS[cc] || cc}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ArsivPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [onThisDay, setOnThisDay] = useState<{ event: Event; yearsAgo: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOTD, setLoadingOTD] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/events?date=${date}&per_page=50`);
      if (!res.ok) throw new Error("Haberler yüklenemedi");
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      setError("Haberler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOnThisDay = useCallback(async () => {
    setLoadingOTD(true);
    try {
      const res = await fetch(`${API_URL}/api/events/on-this-day`);
      if (!res.ok) return;
      const data = await res.json();
      const todayYear = new Date().getFullYear();
      const items = (data.events || [])
        .map((event: Event) => {
          const year = new Date(event.created_at).getFullYear();
          return { event, yearsAgo: todayYear - year };
        })
        .filter((item: { event: Event; yearsAgo: number }) => item.yearsAgo > 0);
      setOnThisDay(items);
    } catch {
      // silently ignore
    } finally {
      setLoadingOTD(false);
    }
  }, []);

  useEffect(() => {
    fetchOnThisDay();
  }, [fetchOnThisDay]);

  useEffect(() => {
    if (selectedDate) {
      fetchEvents(selectedDate);
    }
  }, [selectedDate, fetchEvents]);

  const handleShortcut = (type: "yesterday" | "last-week" | "last-month") => {
    const d = new Date();
    if (type === "yesterday") d.setDate(d.getDate() - 1);
    else if (type === "last-week") d.setDate(d.getDate() - 7);
    else if (type === "last-month") d.setMonth(d.getMonth() - 1);
    setSelectedDate(formatDate(d));
  };

  const uniqueCountries = Array.from(
    new Set((events || []).flatMap(e => e.country_codes || []))
  );

  return (
    <>
      <style>{`
        @keyframes archivePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes archiveFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .archive-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 28px;
          align-items: start;
        }
        .archive-events-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .archive-otd-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 900px) {
          .archive-events-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (min-width: 700px) {
          .archive-otd-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (min-width: 1100px) {
          .archive-otd-grid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        @media (max-width: 800px) {
          .archive-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 28%, #1e3a5f 60%, #0f172a 100%)",
        padding: "56px 24px 48px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: -100, right: -60,
          width: 340, height: 340, borderRadius: "50%",
          background: "rgba(99,102,241,0.1)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: "25%",
          width: 180, height: 180, borderRadius: "50%",
          background: "rgba(217,119,6,0.07)", pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 13, transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
            >
              Ana Sayfa
            </Link>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>›</span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 500 }}>Arşiv</span>
          </div>

          {/* Icon + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
            <div style={{
              width: 58, height: 58, borderRadius: 16,
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.14)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 30,
            }}>
              🕰️
            </div>
            <h1 style={{
              fontSize: "clamp(26px, 5vw, 42px)",
              fontWeight: 800,
              color: "#fff",
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}>
              Zaman Makinesi
            </h1>
          </div>

          <p style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.6)",
            maxWidth: 520,
            lineHeight: 1.7,
            margin: "0 0 26px 0",
          }}>
            Geçmişe yolculuk yapın. İstediğiniz tarihi seçerek o günün haberlerini ve dünya medyasının olaylara bakış açısını keşfedin.
          </p>

          {/* Quick shortcuts */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {([
              { label: "📅 Dün", type: "yesterday" as const },
              { label: "📆 Geçen Hafta", type: "last-week" as const },
              { label: "🗓 Geçen Ay", type: "last-month" as const },
            ]).map(({ label, type }) => (
              <button
                key={type}
                onClick={() => handleShortcut(type)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.07)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  backdropFilter: "blur(4px)",
                  transition: "all 0.15s ease",
                  minHeight: 44,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.16)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.38)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 24px" }}>

        {/* Archive Layout: Calendar | Results */}
        <div className="archive-layout">

          {/* ── Left column: Calendar + Stats ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} />

            {/* Selected date display */}
            {selectedDate && (
              <div style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "14px 18px",
                animation: "archiveFadeIn 0.3s ease",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                  Seçili Tarih
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)" }}>
                  📅 {formatDisplayDate(selectedDate)}
                </div>
              </div>
            )}

            {/* Stats */}
            {selectedDate && !loading && events.length > 0 && (
              <div style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "16px 18px",
                animation: "archiveFadeIn 0.4s ease",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                  İstatistikler
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Event count */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: "rgba(37,99,235,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                    }}>📰</div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", lineHeight: 1 }}>{events.length}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-3)" }}>Toplam Haber</div>
                    </div>
                  </div>

                  {/* Country count */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: "rgba(22,163,74,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                    }}>🌍</div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", lineHeight: 1 }}>{uniqueCountries.length}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-3)" }}>Ülkeden Haber</div>
                    </div>
                  </div>
                </div>

                {/* Country flags */}
                {uniqueCountries.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--color-border)" }}>
                    <div style={{ fontSize: 11, color: "var(--color-text-3)", marginBottom: 8, fontWeight: 600 }}>Ülkeler</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {uniqueCountries.map(cc => (
                        <span
                          key={cc}
                          title={COUNTRY_NAMES[cc] || cc}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "3px 8px",
                            borderRadius: 20, fontSize: 12,
                            background: "var(--color-surface-2)",
                            color: "var(--color-text-2)",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          {COUNTRY_FLAGS[cc] || cc}{" "}
                          <span style={{ fontWeight: 600 }}>{cc}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right column: Results ── */}
          <div>

            {/* No date selected */}
            {!selectedDate && !loading && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "64px 24px",
                background: "var(--color-surface)",
                border: "2px dashed var(--color-border)",
                borderRadius: "var(--radius-lg)",
                textAlign: "center",
                animation: "archiveFadeIn 0.5s ease",
              }}>
                <div style={{ fontSize: 60, marginBottom: 16, lineHeight: 1 }}>🗓️</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", margin: "0 0 10px 0" }}>
                  Bir Tarih Seçin
                </h2>
                <p style={{ fontSize: 14, color: "var(--color-text-2)", maxWidth: 320, lineHeight: 1.7, margin: "0 0 28px 0" }}>
                  Soldaki takvimden bir tarih seçin ya da aşağıdaki kısayolları kullanın. O güne ait tüm haberler burada görünecek.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  {([
                    { label: "📅 Dün", type: "yesterday" as const },
                    { label: "📆 Geçen Hafta", type: "last-week" as const },
                    { label: "🗓 Geçen Ay", type: "last-month" as const },
                  ]).map(({ label, type }) => (
                    <button
                      key={type}
                      onClick={() => handleShortcut(type)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "var(--radius-md, 10px)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-surface-2)",
                        color: "var(--color-text)",
                        fontSize: 13, fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        minHeight: 44,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = "var(--color-accent)";
                        e.currentTarget.style.color = "var(--color-accent)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "var(--color-border)";
                        e.currentTarget.style.color = "var(--color-text)";
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 140, height: 22, borderRadius: 6, background: "var(--color-surface-2)", animation: "archivePulse 1.5s ease-in-out infinite" }} />
                </div>
                <div className="archive-events-grid">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div style={{
                padding: "44px 24px",
                background: "rgba(220,38,38,0.06)",
                border: "1px solid rgba(220,38,38,0.2)",
                borderRadius: "var(--radius-lg)",
                textAlign: "center",
                animation: "archiveFadeIn 0.4s ease",
              }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
                <p style={{ color: "#dc2626", fontSize: 15, fontWeight: 700, margin: "0 0 6px 0" }}>Hata</p>
                <p style={{ color: "var(--color-text-2)", fontSize: 13, margin: "0 0 20px 0" }}>{error}</p>
                <button
                  onClick={() => selectedDate && fetchEvents(selectedDate)}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "var(--radius-md, 10px)",
                    border: "none",
                    background: "var(--color-accent)",
                    color: "#fff", fontWeight: 700, fontSize: 13,
                    cursor: "pointer", minHeight: 44,
                  }}
                >
                  Tekrar Dene
                </button>
              </div>
            )}

            {/* No results */}
            {selectedDate && !loading && !error && events.length === 0 && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "60px 24px",
                background: "var(--color-surface)",
                border: "2px dashed var(--color-border)",
                borderRadius: "var(--radius-lg)",
                textAlign: "center",
                animation: "archiveFadeIn 0.4s ease",
              }}>
                <div style={{ fontSize: 54, marginBottom: 14, lineHeight: 1 }}>📭</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: "0 0 8px 0" }}>
                  Haber Bulunamadı
                </h3>
                <p style={{ fontSize: 14, color: "var(--color-text-2)", maxWidth: 300, lineHeight: 1.6, margin: 0 }}>
                  <strong>{formatDisplayDate(selectedDate)}</strong> tarihi için arşivde haber bulunmuyor. Farklı bir tarih seçmeyi deneyin.
                </p>
              </div>
            )}

            {/* Results */}
            {!loading && !error && events.length > 0 && (
              <div style={{ animation: "archiveFadeIn 0.4s ease" }}>
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16, gap: 12, flexWrap: "wrap",
                }}>
                  <h2 style={{
                    fontSize: 17, fontWeight: 700, color: "var(--color-text)",
                    margin: 0, display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span>{formatDisplayDate(selectedDate!)}</span>
                    <span style={{
                      padding: "2px 10px", borderRadius: 20, fontSize: 13,
                      background: "rgba(37,99,235,0.12)",
                      color: "var(--color-accent)", fontWeight: 700,
                    }}>
                      {events.length} haber
                    </span>
                  </h2>
                </div>

                <div className="archive-events-grid">
                  {events.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Tarihte Bugün ──────────────────────────────────────────── */}
        <section style={{ marginTop: 64 }}>
          {/* Section header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 24,
            paddingBottom: 18,
            borderBottom: "2px solid var(--color-border)",
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13,
              background: "linear-gradient(135deg, #d97706, #92400e)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
              boxShadow: "0 4px 14px rgba(217,119,6,0.28)",
              flexShrink: 0,
            }}>
              📅
            </div>
            <div>
              <h2 style={{
                fontSize: 22, fontWeight: 800, color: "var(--color-text)",
                margin: 0, letterSpacing: "-0.01em",
              }}>
                Tarihte Bugün
              </h2>
              <p style={{ fontSize: 13, color: "var(--color-text-3)", margin: "3px 0 0 0" }}>
                Geçmiş yıllarda bugün neler olmuştu?
              </p>
            </div>
          </div>

          {/* OTD loading */}
          {loadingOTD && (
            <div className="archive-otd-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "16px",
                  display: "flex", gap: 12,
                }}>
                  <div style={{ width: 50, height: 50, borderRadius: "var(--radius-md, 10px)", background: "var(--color-surface-2)", animation: "archivePulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ height: 13, borderRadius: 6, background: "var(--color-surface-2)", width: "40%", animation: "archivePulse 1.5s ease-in-out infinite" }} />
                    <div style={{ height: 16, borderRadius: 6, background: "var(--color-surface-2)", animation: "archivePulse 1.5s ease-in-out infinite" }} />
                    <div style={{ height: 13, borderRadius: 6, background: "var(--color-surface-2)", width: "55%", animation: "archivePulse 1.5s ease-in-out infinite" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* OTD empty */}
          {!loadingOTD && onThisDay.length === 0 && (
            <div style={{
              padding: "48px 24px",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              <p style={{ fontSize: 15, color: "var(--color-text-2)", margin: 0 }}>
                Geçmiş yıllara ait haber bulunamadı.
              </p>
            </div>
          )}

          {/* OTD cards */}
          {!loadingOTD && onThisDay.length > 0 && (
            <div className="archive-otd-grid" style={{ animation: "archiveFadeIn 0.5s ease" }}>
              {onThisDay.map(({ event, yearsAgo }) => (
                <OnThisDayCard key={event.id} event={event} yearsAgo={yearsAgo} />
              ))}
            </div>
          )}
        </section>

        {/* Bottom spacing */}
        <div style={{ height: 64 }} />
      </main>
    </>
  );
}
