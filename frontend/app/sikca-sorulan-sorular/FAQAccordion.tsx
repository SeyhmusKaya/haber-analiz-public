"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { FAQCategory, FAQItem } from "./page"

interface Props {
  items: FAQItem[]
  categories: { key: FAQCategory; label: string; icon: string }[]
}

export default function FAQAccordion({ items, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<FAQCategory | "tumu">("tumu")
  const [search, setSearch] = useState("")
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const filtered = items.filter((item) => {
    const matchCategory = activeCategory === "tumu" || item.category === activeCategory
    if (!search.trim()) return matchCategory
    const q = search.toLowerCase()
    return (
      matchCategory &&
      (item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q))
    )
  })

  // Reset open index when filter changes
  useEffect(() => {
    setOpenIndex(null)
  }, [activeCategory, search])

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 16px 48px" }}>
      {/* Search */}
      <div style={{ marginBottom: 28, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-text-3)",
            fontSize: 16,
            pointerEvents: "none",
            lineHeight: 1,
          }}
        >
          🔍
        </div>
        <input
          type="text"
          placeholder="Soru ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 16px 14px 44px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            color: "var(--color-text)",
            fontSize: 15,
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
      </div>

      {/* Category Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 32,
          overflowX: "auto",
          paddingBottom: 4,
          WebkitOverflowScrolling: "touch",
        }}
        className="scrollbar-hide"
      >
        <TabButton
          active={activeCategory === "tumu"}
          onClick={() => setActiveCategory("tumu")}
          icon="📋"
          label="Tümü"
          count={items.length}
        />
        {categories.map((cat) => (
          <TabButton
            key={cat.key}
            active={activeCategory === cat.key}
            onClick={() => setActiveCategory(cat.key)}
            icon={cat.icon}
            label={cat.label}
            count={items.filter((i) => i.category === cat.key).length}
          />
        ))}
      </div>

      {/* Results count */}
      {search.trim() && (
        <div
          style={{
            fontSize: 13,
            color: "var(--color-text-3)",
            marginBottom: 16,
          }}
        >
          {filtered.length} sonuç bulundu
        </div>
      )}

      {/* Accordion Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              color: "var(--color-text-3)",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15, fontWeight: 500 }}>
              Aramanızla eşleşen soru bulunamadı.
            </p>
            <p style={{ fontSize: 13, marginTop: 6, color: "var(--color-text-3)" }}>
              Farklı anahtar kelimeler deneyin veya tüm kategorilere göz atın.
            </p>
          </div>
        ) : (
          filtered.map((item, i) => (
            <AccordionItem
              key={`${item.category}-${i}`}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              categoryLabel={
                categories.find((c) => c.key === item.category)?.label || ""
              }
              categoryIcon={
                categories.find((c) => c.key === item.category)?.icon || ""
              }
            />
          ))
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 16px",
        borderRadius: 10,
        border: active
          ? "1px solid var(--color-accent)"
          : "1px solid var(--color-border)",
        background: active ? "rgba(59,130,246,0.1)" : "var(--color-surface)",
        color: active ? "var(--color-accent)" : "var(--color-text-2)",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
        minHeight: 44,
        transition: "all 0.15s",
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      {label}
      <span
        style={{
          fontSize: 11,
          background: active ? "rgba(59,130,246,0.15)" : "var(--color-surface-2)",
          padding: "2px 7px",
          borderRadius: 99,
          fontWeight: 500,
        }}
      >
        {count}
      </span>
    </button>
  )
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
  categoryLabel,
  categoryIcon,
}: {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
  categoryLabel: string
  categoryIcon: string
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0)
    }
  }, [isOpen])

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: isOpen
          ? "1px solid rgba(59,130,246,0.3)"
          : "1px solid var(--color-border)",
        borderRadius: 14,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "var(--color-text)",
          minHeight: 56,
        }}
      >
        <span
          style={{
            fontSize: 12,
            background: isOpen ? "rgba(59,130,246,0.1)" : "var(--color-surface-2)",
            border: isOpen
              ? "1px solid rgba(59,130,246,0.2)"
              : "1px solid var(--color-border)",
            borderRadius: 6,
            padding: "3px 8px",
            flexShrink: 0,
            color: isOpen ? "var(--color-accent)" : "var(--color-text-3)",
            transition: "all 0.2s",
          }}
        >
          {categoryIcon}
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.45,
          }}
        >
          {item.question}
        </span>
        <span
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            background: isOpen ? "rgba(59,130,246,0.1)" : "var(--color-surface-2)",
            flexShrink: 0,
            fontSize: 18,
            fontWeight: 300,
            color: isOpen ? "var(--color-accent)" : "var(--color-text-3)",
            transition: "all 0.2s",
            lineHeight: 1,
          }}
        >
          {isOpen ? "−" : "+"}
        </span>
      </button>

      <div
        ref={contentRef}
        style={{
          maxHeight: height,
          overflow: "hidden",
          transition: "max-height 0.25s ease",
        }}
      >
        <div
          style={{
            padding: "0 20px 20px 52px",
            fontSize: 14,
            lineHeight: 1.75,
            color: "var(--color-text-2)",
          }}
        >
          {item.answer}
        </div>
      </div>
    </div>
  )
}
