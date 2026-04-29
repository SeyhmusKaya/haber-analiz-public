"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./auth"

const API = ""

const PLAN_HIERARCHY: Record<string, number> = { free: 0, pro: 1 }

export function usePlan() {
  const { user } = useAuth()
  const [plan, setPlan] = useState<string>("free")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setPlan("free")
      setLoading(false)
      return
    }
    const token = localStorage.getItem("auth_token")
    fetch(`${API}/api/subscription/status`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then(r => r.json())
      .then(d => { if (d.plan) setPlan(d.plan) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  function hasAccess(required: "pro"): boolean {
    return (PLAN_HIERARCHY[plan] ?? 0) >= (PLAN_HIERARCHY[required] ?? 1)
  }

  return { plan, loading, hasAccess }
}
