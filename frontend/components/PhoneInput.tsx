"use client"

import { useState, useRef, useEffect } from "react"

interface CountryDef {
  code: string
  flag: string
  name: string
  dial: string
  chunks: number[]
  digitCount: number
  startsWithDigit?: string
}

const COUNTRIES: CountryDef[] = [
  { code: "TR", flag: "🇹🇷", name: "Türkiye",          dial: "+90",  chunks: [3,3,2,2],   digitCount: 10, startsWithDigit: "5" },
  { code: "US", flag: "🇺🇸", name: "ABD",              dial: "+1",   chunks: [3,3,4],     digitCount: 10 },
  { code: "GB", flag: "🇬🇧", name: "İngiltere",        dial: "+44",  chunks: [4,6],       digitCount: 10 },
  { code: "DE", flag: "🇩🇪", name: "Almanya",          dial: "+49",  chunks: [3,4,4],     digitCount: 11 },
  { code: "FR", flag: "🇫🇷", name: "Fransa",           dial: "+33",  chunks: [2,2,2,2,2], digitCount: 9  },
  { code: "IT", flag: "🇮🇹", name: "İtalya",           dial: "+39",  chunks: [3,3,4],     digitCount: 10 },
  { code: "ES", flag: "🇪🇸", name: "İspanya",          dial: "+34",  chunks: [3,3,3],     digitCount: 9  },
  { code: "NL", flag: "🇳🇱", name: "Hollanda",         dial: "+31",  chunks: [2,3,4],     digitCount: 9  },
  { code: "BE", flag: "🇧🇪", name: "Belçika",          dial: "+32",  chunks: [3,2,2,2],   digitCount: 9  },
  { code: "CH", flag: "🇨🇭", name: "İsviçre",          dial: "+41",  chunks: [2,3,2,2],   digitCount: 9  },
  { code: "AT", flag: "🇦🇹", name: "Avusturya",        dial: "+43",  chunks: [3,4,4],     digitCount: 10 },
  { code: "PL", flag: "🇵🇱", name: "Polonya",          dial: "+48",  chunks: [3,3,3],     digitCount: 9  },
  { code: "RU", flag: "🇷🇺", name: "Rusya",            dial: "+7",   chunks: [3,3,2,2],   digitCount: 10, startsWithDigit: "9" },
  { code: "UA", flag: "🇺🇦", name: "Ukrayna",          dial: "+380", chunks: [2,3,2,2],   digitCount: 9  },
  { code: "CN", flag: "🇨🇳", name: "Çin",              dial: "+86",  chunks: [3,4,4],     digitCount: 11 },
  { code: "JP", flag: "🇯🇵", name: "Japonya",          dial: "+81",  chunks: [3,4,4],     digitCount: 11 },
  { code: "KR", flag: "🇰🇷", name: "Güney Kore",       dial: "+82",  chunks: [2,4,4],     digitCount: 10 },
  { code: "IN", flag: "🇮🇳", name: "Hindistan",        dial: "+91",  chunks: [5,5],       digitCount: 10 },
  { code: "AU", flag: "🇦🇺", name: "Avustralya",       dial: "+61",  chunks: [3,3,3],     digitCount: 9  },
  { code: "SA", flag: "🇸🇦", name: "Suudi Arabistan",  dial: "+966", chunks: [2,3,4],     digitCount: 9, startsWithDigit: "5" },
  { code: "AE", flag: "🇦🇪", name: "BAE",              dial: "+971", chunks: [2,3,4],     digitCount: 9, startsWithDigit: "5" },
  { code: "EG", flag: "🇪🇬", name: "Mısır",            dial: "+20",  chunks: [3,4,4],     digitCount: 10 },
  { code: "IR", flag: "🇮🇷", name: "İran",             dial: "+98",  chunks: [3,3,4],     digitCount: 10 },
  { code: "IL", flag: "🇮🇱", name: "İsrail",           dial: "+972", chunks: [2,3,4],     digitCount: 9  },
  { code: "QA", flag: "🇶🇦", name: "Katar",            dial: "+974", chunks: [4,4],       digitCount: 8  },
  { code: "KW", flag: "🇰🇼", name: "Kuveyt",           dial: "+965", chunks: [4,4],       digitCount: 8  },
  { code: "MA", flag: "🇲🇦", name: "Fas",              dial: "+212", chunks: [3,2,2,2],   digitCount: 9  },
  { code: "AZ", flag: "🇦🇿", name: "Azerbaycan",       dial: "+994", chunks: [2,3,2,2],   digitCount: 9  },
  { code: "GR", flag: "🇬🇷", name: "Yunanistan",       dial: "+30",  chunks: [3,3,4],     digitCount: 10 },
  { code: "SE", flag: "🇸🇪", name: "İsveç",            dial: "+46",  chunks: [2,3,2,2],   digitCount: 9  },
  { code: "NO", flag: "🇳🇴", name: "Norveç",           dial: "+47",  chunks: [3,2,3],     digitCount: 8  },
  { code: "DK", flag: "🇩🇰", name: "Danimarka",        dial: "+45",  chunks: [2,2,2,2],   digitCount: 8  },
  { code: "CA", flag: "🇨🇦", name: "Kanada",           dial: "+1",   chunks: [3,3,4],     digitCount: 10 },
  { code: "MX", flag: "🇲🇽", name: "Meksika",          dial: "+52",  chunks: [3,3,4],     digitCount: 10 },
  { code: "BR", flag: "🇧🇷", name: "Brezilya",         dial: "+55",  chunks: [2,5,4],     digitCount: 11 },
  { code: "ZA", flag: "🇿🇦", name: "Güney Afrika",     dial: "+27",  chunks: [2,3,4],     digitCount: 9  },
  { code: "NG", flag: "🇳🇬", name: "Nijerya",          dial: "+234", chunks: [3,3,4],     digitCount: 10 },
  { code: "PK", flag: "🇵🇰", name: "Pakistan",         dial: "+92",  chunks: [3,3,4],     digitCount: 10 },
  { code: "BD", flag: "🇧🇩", name: "Bangladeş",        dial: "+880", chunks: [5,6],       digitCount: 10 },
  { code: "ID", flag: "🇮🇩", name: "Endonezya",        dial: "+62",  chunks: [3,4,4],     digitCount: 11 },
]

function formatDigits(digits: string, chunks: number[]): string {
  let result = ""
  let pos = 0
  for (let i = 0; i < chunks.length; i++) {
    const chunk = digits.slice(pos, pos + chunks[i])
    if (!chunk) break
    if (i > 0) result += " "
    result += chunk
    pos += chunks[i]
  }
  return result
}

function parseInitial(val: string): { country: CountryDef; digits: string } {
  const defaultCountry = COUNTRIES[0]
  if (!val) return { country: defaultCountry, digits: "" }
  // Sort by dial length desc to match longest prefix first (e.g. +972 before +97)
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  for (const c of sorted) {
    if (val.startsWith(c.dial)) {
      return { country: c, digits: val.slice(c.dial.length).replace(/\D/g, "") }
    }
  }
  return { country: defaultCountry, digits: val.replace(/\D/g, "") }
}

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  hasError?: boolean
}

export function PhoneInput({ value, onChange, hasError }: PhoneInputProps) {
  const parsed = parseInitial(value)
  const [country, setCountry] = useState<CountryDef>(parsed.country)
  const [digits, setDigits] = useState(parsed.digits)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Sync when value changes externally (e.g. profile loads)
  useEffect(() => {
    if (value) {
      const p = parseInitial(value)
      setCountry(p.country)
      setDigits(p.digits)
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  const filteredCountries = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, country.digitCount)
    setDigits(raw)
    onChange(raw ? country.dial + raw : "")
  }

  function selectCountry(c: CountryDef) {
    setCountry(c)
    setDigits("")
    setOpen(false)
    setSearch("")
    onChange("")
  }

  const displayValue = formatDigits(digits, country.chunks)

  const isComplete = digits.length === country.digitCount
  const hasStartError = country.startsWithDigit && digits.length > 0 && !digits.startsWith(country.startsWithDigit)
  const isValid = isComplete && !hasStartError
  const showValidation = digits.length > 0

  const placeholder = country.chunks.map(n => "X".repeat(n)).join(" ")

  const borderColor = hasError
    ? "rgba(239,68,68,0.6)"
    : showValidation && !isValid
    ? "rgba(239,68,68,0.5)"
    : showValidation && isValid
    ? "rgba(34,197,94,0.6)"
    : "var(--color-border)"

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {/* Input row */}
      <div style={{
        display: "flex",
        border: `1px solid ${borderColor}`,
        borderRadius: "var(--radius-md)",
        background: "var(--color-surface-2)",
        transition: "border-color 0.15s",
        overflow: "visible",
      }}>
        {/* Flag + dial code button */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            flexShrink: 0,
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 10px 9px 12px",
            background: "transparent",
            border: "none",
            borderRight: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
            cursor: "pointer",
            color: "var(--color-text)",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 19, lineHeight: 1 }}>{country.flag}</span>
          <span style={{ fontSize: 9, color: "var(--color-text-3)", marginLeft: 2 }}>▾</span>
        </button>

        {/* Number input */}
        <input
          type="tel"
          value={displayValue}
          onChange={handleInput}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--color-text)",
            fontSize: 14,
            borderRadius: "0 var(--radius-md) var(--radius-md) 0",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.02em",
            minWidth: 0,
          }}
        />

        {/* Validation icon */}
        {showValidation && (
          <div style={{
            display: "flex", alignItems: "center",
            paddingRight: 12, flexShrink: 0,
            fontSize: 14,
          }}>
            {isValid ? (
              <span style={{ color: "#22c55e" }}>✓</span>
            ) : (
              <span style={{ color: "#ef4444" }}>✗</span>
            )}
          </div>
        )}
      </div>

      {/* Validation message */}
      {showValidation && !isValid && (
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#ef4444" }}>
          {hasStartError
            ? `${country.name} numaraları ${country.startsWithDigit} ile başlamalı`
            : `${country.digitCount} rakam girilmeli (${digits.length}/${country.digitCount})`}
        </p>
      )}
      {showValidation && isValid && (
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#22c55e" }}>
          Geçerli numara
        </p>
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 9999,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          width: 260, maxHeight: 300,
          display: "flex", flexDirection: "column",
        }}>
          {/* Search */}
          <div style={{ padding: "8px 8px 0" }}>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ülke veya kod ara..."
              style={{
                width: "100%", padding: "7px 10px",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text)", fontSize: 13,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Country list */}
          <div style={{ overflowY: "auto", flex: 1, padding: "4px 0 6px" }}>
            {filteredCountries.length === 0 ? (
              <div style={{ padding: "14px 12px", color: "var(--color-text-3)", fontSize: 13, textAlign: "center" }}>
                Ülke bulunamadı
              </div>
            ) : filteredCountries.map(c => (
              <button
                key={c.code + c.dial}
                type="button"
                onClick={() => selectCountry(c)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "7px 12px",
                  background: c.code === country.code && c.dial === country.dial
                    ? "var(--color-surface-2)"
                    : "transparent",
                  border: "none", cursor: "pointer",
                  color: "var(--color-text)", fontSize: 13,
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{c.flag}</span>
                <span style={{ flex: 1 }}>{c.name}</span>
                <span style={{ color: "var(--color-text-3)", fontVariantNumeric: "tabular-nums" }}>{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
