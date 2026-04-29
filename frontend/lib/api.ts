import { Event, EventsResponse, EventDetail, Analysis, Tweet } from "@/types"

// Server-side: direct to backend. Client-side: relative URL (proxied via next.config rewrites)
const API_URL = typeof window === "undefined"
  ? (process.env.BACKEND_URL || "http://localhost:8000")
  : ""

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// SSR fetch: 8 saniye timeout ile — backend yavaşsa sayfa boş kalmaz
async function ssrFetch(url: string, init?: RequestInit): Promise<Response> {
  if (typeof window !== "undefined") return fetch(url, init)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function getEvents(
  page = 1,
  category?: string,
  options?: { search?: string; country?: string; sort?: string; date_from?: string; date_to?: string; showAll?: boolean },
  trBias?: boolean
): Promise<EventsResponse> {
  const params = new URLSearchParams({ page: String(page) })
  if (category && category !== "tumu") params.set("category", category)
  if (options?.search) params.set("search", options.search)
  if (options?.country) params.set("country", options.country)
  if (options?.sort) params.set("sort", options.sort)
  if (options?.date_from) params.set("date_from", options.date_from)
  if (options?.date_to) params.set("date_to", options.date_to)
  if (options?.showAll) params.set("show_all", "1")
  if (trBias) params.set("tr_bias", "1")

  const res = await ssrFetch(`${API_URL}/api/events?${params}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Haberler yüklenemedi")
  return res.json()
}

// Gündem sayfası için hızlı özel endpoint — basit sorgu, 5dk cache
export async function getGundemEvents(): Promise<EventsResponse> {
  const res = await ssrFetch(`${API_URL}/api/events/gundem`, {
    next: { revalidate: 300 },
  })
  if (!res.ok) return { events: [], total: 0, page: 1, per_page: 20 }
  const data = await res.json()
  return { events: data.events ?? [], total: data.events?.length ?? 0, page: 1, per_page: 20 }
}

export async function getEvent(id: number): Promise<EventDetail> {
  const res = await fetch(`${API_URL}/api/events/${id}`, {
    next: { revalidate: 60 }
  })
  if (!res.ok) throw new Error("Haber bulunamadı")
  return res.json()
}

export async function getPopularEvents(): Promise<{ events: Event[] }> {
  const res = await fetch(`${API_URL}/api/events/popular`, { next: { revalidate: 120 } })
  if (!res.ok) return { events: [] }
  return res.json()
}

export async function getSliderEvents(): Promise<{ events: Event[] }> {
  const res = await fetch(`${API_URL}/api/events/slider`, { next: { revalidate: 120 } })
  if (!res.ok) return { events: [] }
  return res.json()
}

export interface TensionPair {
  country_a: string
  country_b: string
  country_a_name: string
  country_b_name: string
  country_a_flag: string
  country_b_flag: string
  tension_score: number
  article_count: number
  calculated_at: string | null
}

export async function getTensions(): Promise<{ tensions: TensionPair[] }> {
  try {
    const res = await fetch(`${API_URL}/api/tensions`, {
      cache: "no-store",
    })
    if (!res.ok) return { tensions: [] }
    return res.json()
  } catch {
    return { tensions: [] }
  }
}

export interface TensionArticlesResponse {
  country_a: { code: string; name: string; flag: string }
  country_b: { code: string; name: string; flag: string }
  events: Array<{
    id: number
    title_tr: string
    summary_tr: string | null
    category: string | null
    importance_score: number
    created_at: string
    image_url: string | null
  }>
}

export async function getTensionArticles(a: string, b: string): Promise<TensionArticlesResponse | null> {
  try {
    const res = await fetch(`/api/tensions/${a}/${b}/articles`, { cache: "no-store" })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getStats(): Promise<{
  total_events: number; today_events: number; total_sources: number;
  total_countries: number; total_articles: number;
  country_stats?: Array<{ code: string; name: string; flag: string; count: number }>;
}> {
  const res = await fetch(`${API_URL}/api/events/stats`, { next: { revalidate: 300 } })
  if (!res.ok) return { total_events: 0, today_events: 0, total_sources: 0, total_countries: 0, total_articles: 0 }
  return res.json()
}

export async function getTurkiyeGundemEvents(): Promise<{ events: Event[] }> {
  const res = await fetch(`${API_URL}/api/events/turkiye-gundem`, { cache: "no-store" })
  if (!res.ok) return { events: [] }
  return res.json()
}

export async function getTurkiyeKutuplasmaEvents(): Promise<{ events: Event[] }> {
  const res = await fetch(`${API_URL}/api/events/turkiye-kutuplasma`, { cache: "no-store" })
  if (!res.ok) return { events: [] }
  return res.json()
}

export async function getMostReadEvents(): Promise<{ events: Event[] }> {
  const res = await fetch(`${API_URL}/api/events/most-read`, { cache: "no-store" })
  if (!res.ok) return { events: [] }
  return res.json()
}

export async function getRelatedEvents(eventId: number): Promise<{ events: Event[] }> {
  const res = await fetch(`${API_URL}/api/events/${eventId}/related`, { next: { revalidate: 300 } })
  if (!res.ok) return { events: [] }
  return res.json()
}

export async function getAnalysis(eventId: number, countryCode: string): Promise<Analysis> {
  const res = await fetch(`${API_URL}/api/analysis/${eventId}/${countryCode}`, {
    headers: authHeaders(),
  })
  if (res.status === 401) throw new Error("UNAUTHORIZED")
  if (res.status === 429) throw new Error("DAILY_LIMIT")
  if (res.status === 403) throw new Error("PREMIUM_REQUIRED")
  if (!res.ok) throw new Error("Analiz yüklenemedi")
  return res.json()
}

export async function getTweets(query: string): Promise<Tweet[]> {
  const res = await fetch(`${API_URL}/api/tweets?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.tweets || []
}

// --- Comments API ---

export interface CommentData {
  id: number
  content: string
  user: { id: number; name: string }
  likes_count: number
  dislikes_count: number
  user_vote: string | null
  replies: CommentData[]
  created_at: string
}

export async function getComments(eventId: number, sort = "newest", page = 1): Promise<{ comments: CommentData[]; total: number }> {
  const params = new URLSearchParams({ sort, page: String(page) })
  const res = await fetch(`${API_URL}/api/events/${eventId}/comments?${params}`, {
    headers: authHeaders(),
  })
  if (!res.ok) return { comments: [], total: 0 }
  return res.json()
}

export async function postComment(eventId: number, content: string, parentId?: number): Promise<CommentData> {
  const res = await fetch(`${API_URL}/api/events/${eventId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ content, parent_id: parentId }),
  })
  if (res.status === 401) throw new Error("UNAUTHORIZED")
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Yorum gönderilemedi.")
  return json
}

export async function voteComment(commentId: number, voteType: "like" | "dislike"): Promise<{ likes_count: number; dislikes_count: number; user_vote: string | null }> {
  const res = await fetch(`${API_URL}/api/comments/${commentId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ vote_type: voteType }),
  })
  return res.json()
}

export async function deleteComment(commentId: number): Promise<void> {
  await fetch(`${API_URL}/api/comments/${commentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
}

// --- Catalog API ---

export interface CatalogData {
  id: number
  name: string
  description: string | null
  is_public: boolean
  event_count: number
  created_at: string
}

export async function getCatalogs(): Promise<CatalogData[]> {
  const res = await fetch(`${API_URL}/api/catalogs`, { headers: authHeaders() })
  if (!res.ok) return []
  return res.json()
}

export async function createCatalog(name: string, description?: string): Promise<CatalogData> {
  const res = await fetch(`${API_URL}/api/catalogs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, description }),
  })
  return res.json()
}

export async function updateCatalog(id: number, data: { name?: string; description?: string; is_public?: boolean }): Promise<CatalogData> {
  const res = await fetch(`${API_URL}/api/catalogs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function deleteCatalog(id: number): Promise<void> {
  await fetch(`${API_URL}/api/catalogs/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
}

export async function addToCatalog(catalogId: number, eventId: number): Promise<void> {
  await fetch(`${API_URL}/api/catalogs/${catalogId}/events/${eventId}`, {
    method: "POST",
    headers: authHeaders(),
  })
}

export async function removeFromCatalog(catalogId: number, eventId: number): Promise<void> {
  await fetch(`${API_URL}/api/catalogs/${catalogId}/events/${eventId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
}

export async function getCatalogEvents(catalogId: number): Promise<{ catalog: { id: number; name: string }; events: Event[] }> {
  const res = await fetch(`${API_URL}/api/catalogs/${catalogId}/events`, { headers: authHeaders() })
  if (!res.ok) return { catalog: { id: catalogId, name: "" }, events: [] }
  return res.json()
}

export async function getEventCatalogs(eventId: number): Promise<{ catalog_ids: number[] }> {
  const res = await fetch(`${API_URL}/api/events/${eventId}/catalogs`, { headers: authHeaders() })
  if (!res.ok) return { catalog_ids: [] }
  return res.json()
}

// --- Auth API ---

export interface AuthUser {
  id: number
  name: string
  email: string
  phone?: string
  age?: number
  avatar?: string
  avatar_url?: string
  display_name?: string
  username?: string
  is_admin: boolean
  plan?: string
  plan_expires_at?: string | null
  created_at?: string
}

export async function apiRegister(data: {
  name: string; email: string; password: string; phone?: string; age?: number
}): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || "Kayıt başarısız.")
  return json
}

export async function apiLogin(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw new Error("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.")
  }
  let json: any
  try {
    json = await res.json()
  } catch {
    throw new Error("Sunucudan geçersiz yanıt alındı.")
  }
  if (!res.ok) {
    if (res.status === 429) throw new Error("Çok fazla deneme yaptınız. Lütfen biraz bekleyin.")
    throw new Error(json.error || json.message || "E-posta veya şifre hatalı.")
  }
  return json
}

export async function apiLogout(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    headers: authHeaders(),
  })
}

export async function apiMe(): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/me`, { headers: authHeaders() })
  if (!res.ok) throw new Error("Oturum geçersiz.")
  return res.json()
}

export async function apiUpdateProfile(data: { name?: string; phone?: string; age?: number }): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || "Güncelleme başarısız.")
  return json
}

export async function apiChangePassword(currentPassword: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ current_password: currentPassword, password }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Şifre değiştirilemedi.")
}

export async function apiForgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ email }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "İşlem başarısız.")
}

export function getGoogleAuthUrl(): string {
  return `${API_URL}/api/auth/google`
}

// --- Interactions ---

export async function apiMarkRead(eventId: number): Promise<void> {
  await fetch(`${API_URL}/api/events/${eventId}/read`, {
    method: "POST",
    headers: authHeaders(),
  })
}

export async function apiToggleSave(eventId: number): Promise<{ saved: boolean }> {
  const res = await fetch(`${API_URL}/api/events/${eventId}/save`, {
    method: "POST",
    headers: authHeaders(),
  })
  return res.json()
}

export async function apiEventStatus(eventId: number): Promise<{ read: boolean; saved: boolean }> {
  const res = await fetch(`${API_URL}/api/events/${eventId}/status`, {
    headers: authHeaders(),
  })
  if (!res.ok) return { read: false, saved: false }
  return res.json()
}

export async function apiSavedEvents(): Promise<EventsResponse> {
  const res = await fetch(`${API_URL}/api/user/saved`, { headers: authHeaders() })
  if (!res.ok) throw new Error("Kaydedilenler yüklenemedi")
  const data = await res.json()
  return { events: data.events, total: data.events.length, page: 1, per_page: data.events.length }
}

// --- Admin ---

export async function adminGetStats(): Promise<any> {
  const res = await fetch(`${API_URL}/api/admin/stats`, { headers: authHeaders() })
  if (res.status === 403) throw new Error("FORBIDDEN")
  if (!res.ok) throw new Error("İstatistikler yüklenemedi")
  return res.json()
}

export async function adminGetUsers(page = 1, search = "", inactive = false): Promise<any> {
  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set("search", search)
  if (inactive) params.set("inactive", "1")
  const res = await fetch(`${API_URL}/api/admin/users?${params}`, { headers: authHeaders() })
  if (res.status === 403) throw new Error("FORBIDDEN")
  if (!res.ok) throw new Error("Kullanıcılar yüklenemedi")
  return res.json()
}

export async function adminGetUser(id: number): Promise<any> {
  const res = await fetch(`${API_URL}/api/admin/users/${id}`, { headers: authHeaders() })
  if (res.status === 403) throw new Error("FORBIDDEN")
  if (!res.ok) throw new Error("Kullanıcı bulunamadı")
  return res.json()
}

export async function adminUpdateUser(id: number, data: { is_active?: boolean; is_admin?: boolean }): Promise<any> {
  const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Güncelleme başarısız.")
  return json
}

export async function adminChangeUserPassword(userId: number, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ password }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Şifre değiştirilemedi.")
}

export async function adminGiftPlan(userId: number, plan: string, months: number): Promise<any> {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}/gift-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ plan, months }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Hediye işlemi başarısız.")
  return json
}

// --- Admin AI Settings ---

export async function adminGetAiSettings(): Promise<any> {
  const res = await fetch(`${API_URL}/api/admin/ai-settings`, { headers: authHeaders() })
  if (res.status === 403) throw new Error("FORBIDDEN")
  if (!res.ok) throw new Error("AI ayarları yüklenemedi")
  return res.json()
}

export async function adminUpdateAiSettings(data: Record<string, string>): Promise<any> {
  const res = await fetch(`${API_URL}/api/admin/ai-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || "AI ayarları güncellenemedi")
  return json
}

// --- Reader Votes ---

export interface VoteResults {
  pro_gov: number
  opposition: number
  both_biased: number
  undecided: number
  total: number
  user_vote?: string | null
}

export async function getVoteResults(eventId: number, countryCode: string): Promise<VoteResults> {
  const res = await fetch(`${API_URL}/api/votes/${eventId}/${countryCode}`, { headers: authHeaders() })
  if (!res.ok) return { pro_gov: 0, opposition: 0, both_biased: 0, undecided: 0, total: 0, user_vote: null }
  return res.json()
}

export async function postVote(eventId: number, countryCode: string, vote: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/votes/${eventId}/${countryCode}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ vote }),
  })
  if (res.status === 401) throw new Error("UNAUTHORIZED")
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || "Oy gönderilemedi.")
  return json
}

export async function adminTestAiConnection(): Promise<any> {
  const res = await fetch(`${API_URL}/api/admin/ai-settings/test`, {
    method: "POST",
    headers: authHeaders(),
  })
  return res.json()
}

// ─── Admin Kaynak Yönetimi ────────────────────────────────────────────────────

export interface AdminSource {
  id: number
  name: string
  slug: string
  rss_url: string
  site_url?: string
  country_code: string
  bias: "pro_gov" | "opposition"
  language: string
  importance_score: number
  is_active: boolean
  owner?: string
  funding_type?: string
  founded_year?: number
  description?: string
  logo_url?: string
  article_count?: number
  last_fetched_at?: string
}

export async function adminGetSources(params?: {
  search?: string
  country?: string
  bias?: string
  active?: string
}): Promise<{ sources: AdminSource[] }> {
  const p = new URLSearchParams()
  if (params?.search) p.set("search", params.search)
  if (params?.country) p.set("country", params.country)
  if (params?.bias) p.set("bias", params.bias)
  if (params?.active !== undefined) p.set("active", params.active)
  const res = await fetch(`${API_URL}/api/admin/sources?${p}`, { headers: authHeaders() })
  if (!res.ok) throw new Error("Kaynaklar yüklenemedi")
  return res.json()
}

export async function adminGetSourceCountries(): Promise<{ countries: string[] }> {
  const res = await fetch(`${API_URL}/api/admin/sources/countries`, { headers: authHeaders() })
  if (!res.ok) return { countries: [] }
  return res.json()
}

export async function adminCreateSource(data: Partial<AdminSource>): Promise<{ source: AdminSource }> {
  const res = await fetch(`${API_URL}/api/admin/sources`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || "Kaynak oluşturulamadı")
  return json
}

export async function adminUpdateSource(id: number, data: Partial<AdminSource>): Promise<{ source: AdminSource }> {
  const res = await fetch(`${API_URL}/api/admin/sources/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || "Kaynak güncellenemedi")
  return json
}

export async function adminToggleSourceActive(id: number): Promise<{ source: AdminSource; is_active: boolean }> {
  const res = await fetch(`${API_URL}/api/admin/sources/${id}/toggle-active`, {
    method: "PATCH",
    headers: authHeaders(),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || "Durum değiştirilemedi")
  return json
}

export async function adminDeleteSource(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/sources/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  if (!res.ok) {
    const json = await res.json()
    throw new Error(json.message || "Kaynak silinemedi")
  }
}

