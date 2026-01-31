"use client"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"

/* ======================= TYPY ======================= */
type Stats = {
  CALL_CLICKS: number
  WEBSITE_CLICKS: number
  BUSINESS_DIRECTION_REQUESTS: number
  BUSINESS_IMPRESSIONS_DESKTOP_SEARCH: number
  BUSINESS_IMPRESSIONS_MOBILE_SEARCH: number
  BUSINESS_IMPRESSIONS_DESKTOP_MAPS: number
  BUSINESS_IMPRESSIONS_MOBILE_MAPS: number
}

type Rating = {
  name: string        // <- dodane pole name
  rating: number
  totalReviews: number
}

type StatKey = keyof Stats

type Metric = {
  key: StatKey
  label: string
  category: string
  icon: string
}

/* ======================= METRYKI ======================= */
const METRICS: readonly Metric[] = [
  { key: "CALL_CLICKS", label: "Połączenia", category: "Zaangażowanie", icon: "📞" },
  { key: "WEBSITE_CLICKS", label: "Kliknięcia strony", category: "Zaangażowanie", icon: "🌐" },
  { key: "BUSINESS_DIRECTION_REQUESTS", label: "Wyznaczenie trasy", category: "Zaangażowanie", icon: "📍" },
  { key: "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH", label: "Search Desktop", category: "Widoczność", icon: "🖥️" },
  { key: "BUSINESS_IMPRESSIONS_MOBILE_SEARCH", label: "Search Mobile", category: "Widoczność", icon: "📱" },
  { key: "BUSINESS_IMPRESSIONS_DESKTOP_MAPS", label: "Maps Desktop", category: "Mapy", icon: "🗺️" },
  { key: "BUSINESS_IMPRESSIONS_MOBILE_MAPS", label: "Maps Mobile", category: "Mapy", icon: "🗺️" }
]

/* ======================= HELPERY ======================= */
function monthLabel(offset: number) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - offset)
  return d.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })
}

/* ======================= PAGE ======================= */
export default function DashboardPage() {
  const { id } = useParams<{ id: string }>()

  const [m0, setM0] = useState<Stats | null>(null)
  const [m1, setM1] = useState<Stats | null>(null)
  const [m2, setM2] = useState<Stats | null>(null)
  const [ratingData, setRatingData] = useState<Rating | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const placeMap: Record<string, string> = {
    "10012915044509976414": "ChIJCfr1yDEfHUcRAKwDD4cyKhM",
    "12970499091355352474": "ChIJg22D8rotPUcROTEokbhvYWw"
  }

  useEffect(() => {
    if (!id) return

    // fetch statystyk
    fetch(`/api/statystyki?id=${id}&mode=month&offset=0`)
      .then(r => r.json())
      .then(d => setM0(d.result))

    fetch(`/api/statystyki?id=${id}&mode=month&offset=1`)
      .then(r => r.json())
      .then(d => setM1(d.result))

    fetch(`/api/statystyki?id=${id}&mode=month&offset=2`)
      .then(r => r.json())
      .then(d => setM2(d.result))

    // fetch oceny i nazwy wizytówki
    const placeId = placeMap[id]
    if (placeId) {
      fetch(`/api/ocena?placeId=${placeId}`)
        .then(r => r.json())
        .then(setRatingData)
    }
  }, [id])

  /* ===== SNAPSHOT ===== */
  const saveSnapshot = async () => {
    if (!id || !m0 || !m1 || !m2 || !ratingData) return

    setSaving(true)
    setSaved(false)

    await fetch(`/api/refresh?id=${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        m0,
        m1,
        m2,
        rating: ratingData
      })
    })

    setSaving(false)
    setSaved(true)
  }

  const grouped = useMemo(() => {
    const out: Record<string, Metric[]> = {}
    METRICS.forEach(m => {
      if (!out[m.category]) out[m.category] = []
      out[m.category].push(m)
    })
    return out
  }, [])

  if (!m0 || !m1 || !m2 || !ratingData) {
    return <div className="p-8">Ładowanie danych…</div>
  }

  const { name, rating, totalReviews } = ratingData

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="max-w-[1400px] mx-auto space-y-10">

        {/* Nagłówek z nazwą wizytówki */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{name}</h1>
          <button
            onClick={saveSnapshot}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-black text-white text-sm"
          >
            {saving ? "Zapisywanie…" : "🔄 Zapisz snapshot"}
          </button>
        </div>

        {saved && (
          <div className="text-green-600 text-sm">
            ✅ Snapshot zapisany
          </div>
        )}

        {/* Średnia ocena */}
        <section className="bg-white rounded-2xl p-6 shadow max-w-md">
          <div className="text-xs text-gray-500">Średnia ocena</div>
          <div className="text-4xl font-extrabold">⭐ {rating}</div>
          <div className="text-sm">
            {totalReviews} opinii • <span className="font-semibold">{name}</span>
          </div>
        </section>

        {/* Metryki */}
        {Object.entries(grouped).map(([cat, metrics]) => (
          <section key={cat} className="space-y-4">
            <h2 className="text-xl font-semibold">{cat}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {metrics.map(m => {
                const v0 = m0[m.key]
                const v1 = m1[m.key]
                const v2 = m2[m.key]

                return (
                  <div key={m.key} className="bg-white rounded-2xl p-5 shadow">
                    <div className="flex justify-between text-sm mb-2">
                      <span>{m.icon} {m.label}</span>
                      <b>{v0}</b>
                    </div>

                    <div className="grid grid-cols-3 text-xs text-gray-600">
                      <div>{monthLabel(2)}<br /><b>{v2}</b></div>
                      <div>{monthLabel(1)}<br /><b>{v1}</b></div>
                      <div>{monthLabel(0)}<br /><b>{v0}</b></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

      </div>
    </div>
  )
}
