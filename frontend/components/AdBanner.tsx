"use client"

import { useEffect, useRef } from "react"

interface Props {
  position: "header-bottom" | "in-feed" | "in-article" | "sidebar" | "detail-bottom" | "footer-top" | "mobile-sticky"
}

const AD_CLIENT = "ca-pub-4272457897788655"

const SLOT_IDS: Record<string, string | null> = {
  "header-bottom":  "1532727687",
  "in-feed":        "5959261110",
  "in-article":     "7906564345",
  "sidebar":        "9243696746",
  "detail-bottom":  "8241704328",
  "footer-top":     "6928622653",
  "mobile-sticky":  null,
}

const FORMATS: Record<string, string> = {
  "header-bottom":  "horizontal",
  "in-feed":        "fluid",
  "in-article":     "fluid",
  "sidebar":        "rectangle",
  "detail-bottom":  "horizontal",
  "footer-top":     "horizontal",
  "mobile-sticky":  "auto",
}

export default function AdBanner({ position }: Props) {
  const adRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    const el = adRef.current
    if (!el) return

    // IntersectionObserver ile element görünür olduğunda ve width > 0 iken push yap
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && el.offsetWidth > 0 && !pushed.current) {
          try {
            // @ts-ignore
            ;(window.adsbygoogle = window.adsbygoogle || []).push({})
            pushed.current = true
          } catch {}
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const slotId = SLOT_IDS[position]
  const format = FORMATS[position] || "auto"
  const isInArticle = position === "in-article"
  const isInFeed    = position === "in-feed"

  return (
    <div style={{ overflow: "hidden", textAlign: "center", minWidth: 1 }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center", minWidth: "100%" }}
        data-ad-client={AD_CLIENT}
        {...(slotId ? { "data-ad-slot": slotId } : {})}
        data-ad-format={format}
        {...(isInArticle ? { "data-ad-layout": "in-article" } : {})}
        {...(isInFeed ? { "data-ad-layout-key": "-f1+1f-2y-of+1ih" } : {})}
        {...(!isInArticle && !isInFeed ? { "data-full-width-responsive": "true" } : {})}
      />
    </div>
  )
}
