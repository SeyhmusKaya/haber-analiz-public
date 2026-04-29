export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { getEvents } from "@/lib/api"
import TurkiyeHaberleriClient from "./TurkiyeHaberleriClient"

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function TurkiyeHaberleriPage({ searchParams }: PageProps) {
  const { category } = await searchParams

  let initialEvents: import("@/types").Event[] = []
  let initialTotal = 0

  try {
    const data = await getEvents(1, category === "tumu" ? undefined : category, { country: "TR", showAll: true })
    initialEvents = data.events
    initialTotal = data.total
  } catch {
    // backend çalışmıyor olabilir
  }

  return (
    <Suspense fallback={null}>
      <TurkiyeHaberleriClient
        initialEvents={initialEvents}
        initialTotal={initialTotal}
        initialCategory={category || "tumu"}
      />
    </Suspense>
  )
}
