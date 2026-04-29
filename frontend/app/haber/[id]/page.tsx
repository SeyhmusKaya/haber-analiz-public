/**
 * Legacy redirect: /haber/123 → /haber/siyaset/123-haber-adi
 * Eski bağlantıları yeni URL formatına yönlendirir.
 */
import { notFound, redirect } from "next/navigation"
import { getEvent } from "@/lib/api"
import { eventUrl } from "@/lib/utils"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ id: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://medyaizle.com"

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const event = await getEvent(parseInt(id))
    const canonicalUrl = `${SITE_URL}${eventUrl(parseInt(id), event.title_tr, event.category)}`
    return {
      title: event.title_tr,
      alternates: { canonical: canonicalUrl },
    }
  } catch {
    return { title: "Haber | Medya İzle" }
  }
}

export default async function HaberLegacyRedirect({ params }: PageProps) {
  const { id } = await params
  const eventId = parseInt(id)
  if (isNaN(eventId)) notFound()

  let event
  try {
    event = await getEvent(eventId)
  } catch {
    notFound()
  }

  redirect(eventUrl(eventId, event.title_tr, event.category))
}
