import { Redis } from "@upstash/redis"
import ClientDashboard from "./ClientDashboard"

export const revalidate = 0

const redis = Redis.fromEnv()

/* ======================= TYPY ======================= */
export type Stats = {
  CALL_CLICKS: number
  WEBSITE_CLICKS: number
  BUSINESS_DIRECTION_REQUESTS: number
  BUSINESS_IMPRESSIONS_DESKTOP_SEARCH: number
  BUSINESS_IMPRESSIONS_MOBILE_SEARCH: number
  BUSINESS_IMPRESSIONS_DESKTOP_MAPS: number
  BUSINESS_IMPRESSIONS_MOBILE_MAPS: number
}

export type Rating = {
  name: string
  rating: number
  totalReviews: number
}

type FileData = {
  id: string
  updatedAt: string
  stats?: Stats
  months?: Record<string, Stats>
  rating: Rating
}

export type Metric = {
  key: keyof Stats
  label: string
  category: string
  icon: string
}

/* ===== WSPÓLNY TYP NOTATKI (PANEL 1–3) ===== */
export type NoteData = {
  text: string
  snapshot?: {
    keyword: string
    change: number
  }[]
  panel2?: {
    negativeTotal: number
    removedNegative: number
    mediatedNegative: number
    allReplies: number
    seoActions: string[]
    completedActions: number
  }
  panel3?: {
    next7Days: string[]
    actionsDone: string[]
    effects30Days: string[]
  }
  updatedAt?: string
}

/* ======================= METRYKI ======================= */
const METRICS: readonly Metric[] = [
  { key: "CALL_CLICKS", label: "Połączenia", category: "Zaangażowanie", icon: "📞" },
  { key: "WEBSITE_CLICKS", label: "Kliknięcia strony", category: "Zaangażowanie", icon: "🌐" },
  { key: "BUSINESS_DIRECTION_REQUESTS", label: "Wyznaczenie trasy", category: "Zaangażowanie", icon: "📍" },
  { key: "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH", label: "Search Desktop", category: "Widoczność", icon: "🖥️" },
  { key: "BUSINESS_IMPRESSIONS_MOBILE_SEARCH", label: "Search Mobile", category: "Widoczność", icon: "📱" },
  { key: "BUSINESS_IMPRESSIONS_DESKTOP_MAPS", label: "Maps Desktop", category: "Mapy", icon: "🗺️" },
  { key: "BUSINESS_IMPRESSIONS_MOBILE_MAPS", label: "Maps Mobile", category: "Mapy", icon: "🗺️" },
]

/* ======================= HELPERY ======================= */
const monthLabel = (key: string) =>
  new Date(key + "-01").toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  })

/* ======================= PAGE ======================= */
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  /* ===== SNAPSHOT GOOGLE ===== */
  let data: FileData

  try {
    const fromKv = await redis.get<FileData>(`snapshot:${id}`)
    if (!fromKv) throw new Error("no snapshot")
    data = fromKv
  } catch {
    return <div className="p-10">❌ Brak snapshotu</div>
  }

  const { rating, updatedAt } = data

  const months: Record<string, Stats> =
    data.months ??
    (data.stats ? { [updatedAt.slice(0, 7)]: data.stats } : {})

  const keys = Object.keys(months).sort()
  if (keys.length === 0) {
    return <div className="p-10">❌ Brak danych miesięcznych</div>
  }

  const lastKeys = keys.slice(-3)

  const grouped = METRICS.reduce<Record<string, Metric[]>>((acc, m) => {
    acc[m.category] ??= []
    acc[m.category].push(m)
    return acc
  }, {})

  /* ===== NOTATKA / PANELE 1–3 (REDIS) ===== */
  let note: NoteData | null = null

  try {
    note = await redis.get<NoteData>(`note:${id}`)
  } catch {
    note = null
  }

  return (
    <ClientDashboard
      rating={rating}
      months={months}
      lastKeys={lastKeys}
      grouped={grouped}
      monthLabel={monthLabel}
      note={note}
    />
  )
}
