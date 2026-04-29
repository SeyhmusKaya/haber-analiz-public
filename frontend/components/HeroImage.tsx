"use client"

import { useState } from "react"

interface Props {
  src: string
  alt: string
  videoUrl?: string | null
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m?.[1] ?? null
}

export default function HeroImage({ src, alt, videoUrl }: Props) {
  const [imgVisible, setImgVisible] = useState(false)

  const ytId = videoUrl ? getYouTubeId(videoUrl) : null
  const isNativeVideo = videoUrl && !ytId && (
    videoUrl.endsWith('.mp4') || videoUrl.endsWith('.webm') ||
    videoUrl.includes('video') || videoUrl.includes('.m3u8')
  )

  // ── YouTube embed ────────────────────────────────────────────────────────
  if (ytId) {
    return (
      <div style={{
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        marginBottom: 28,
        position: "relative",
        paddingBottom: "56.25%", // 16:9
        height: 0,
        background: "#000",
      }}>
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
          title={alt}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%", border: 0,
          }}
        />
      </div>
    )
  }

  // ── Native video ─────────────────────────────────────────────────────────
  if (isNativeVideo) {
    return (
      <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 28 }}>
        <video
          controls
          preload="metadata"
          poster={src}
          style={{ width: "100%", maxHeight: 400, background: "#000", display: "block" }}
        >
          <source src={videoUrl!} />
        </video>
      </div>
    )
  }

  // ── Statik resim (varsayılan) ────────────────────────────────────────────
  return (
    <div style={{
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      marginBottom: imgVisible ? 28 : 0,
      maxHeight: 400,
      display: imgVisible ? "block" : "none",
    }}>
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onLoad={(e) => {
          const img = e.target as HTMLImageElement
          if (img.naturalWidth > 300 && img.naturalHeight > 300) setImgVisible(true)
        }}
        onError={() => setImgVisible(false)}
      />
    </div>
  )
}
