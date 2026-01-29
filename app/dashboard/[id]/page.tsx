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
  rating: number
  totalReviews: number
}

type KeywordPosition = {
  keyword: string
  position: number | ""
}

type ManualStats = {
  removedNegative: number
  currentNegative: number
  repliesAdded: number
  campaignReviews: { m0: number; m1: number; m2: number }
  keywordsMain: KeywordPosition[]
  keywordsSecondary: KeywordPosition[]
  plan: { date: string; text: string }
  lastChanges: string
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
  d.setMonth(d.getMonth() - offset)
  return d.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })
}

function emptyManual(): ManualStats {
  return {
    removedNegative: 0,
    currentNegative: 0,
    repliesAdded: 0,
    campaignReviews: { m0: 0, m1: 0, m2: 0 },
    keywordsMain: [
      { keyword: "", position: "" },
      { keyword: "", position: "" },
      { keyword: "", position: "" }
    ],
    keywordsSecondary: [
      { keyword: "", position: "" },
      { keyword: "", position: "" },
      { keyword: "", position: "" }
    ],
    plan: { date: "", text: "" },
    lastChanges: ""
  }
}

function posColor(pos: number | "") {
  if (pos === "") return "text-gray-400"
  if (pos <= 3) return "text-green-600"
  if (pos <= 10) return "text-yellow-600"
  return "text-red-600"
}

function diffPct(curr: number, prev: number) {
  if (prev === 0) return 0
  return ((curr - prev) / prev) * 100
}

/* ======================= KOMPONENT ======================= */
export default function DashboardPage() {
  const { id } = useParams<{ id: string }>()
  const [m0, setM0] = useState<Stats | null>(null)
  const [m1, setM1] = useState<Stats | null>(null)
  const [m2, setM2] = useState<Stats | null>(null)
  const [ratingData, setRatingData] = useState<Rating | null>(null)
  const [manual, setManual] = useState<ManualStats>(emptyManual())

  const placeMap: Record<string, string> = {
    "10012915044509976414": "ChIJCfr1yDEfHUcRAKwDD4cyKhM",
    "12970499091355352474": "ChIJg22D8rotPUcROTEokbhvYWw"
  }

  useEffect(() => {
    if (!id) return

    fetch(`/api/statystyki?id=${id}&mode=month&offset=0`)
      .then(r => r.json())
      .then(d => setM0(d.result))

    fetch(`/api/statystyki?id=${id}&mode=month&offset=1`)
      .then(r => r.json())
      .then(d => setM1(d.result))

    fetch(`/api/statystyki?id=${id}&mode=month&offset=2`)
      .then(r => r.json())
      .then(d => setM2(d.result))

    const placeId = placeMap[id]
    if (placeId) {
      fetch(`/api/ocena?placeId=${placeId}`)
        .then(r => r.json())
        .then(setRatingData)
    }

    const saved = localStorage.getItem("manualStats")
    if (saved) {
      const parsed = JSON.parse(saved)
      setManual({ ...emptyManual(), ...(parsed[id] ?? {}) })
    }
  }, [id])

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

  const { rating, totalReviews } = ratingData
  const sumStars = rating * totalReviews
  const displayedNext = Number((rating + 0.1).toFixed(1))
  const targetReal = displayedNext - 0.05

  let missing5 = 0
  let tmpSum = sumStars
  let tmpCount = totalReviews

  while (tmpCount > 0 && tmpSum / tmpCount < targetReal) {
    tmpSum += 5
    tmpCount++
    missing5++
  }

  const ratingAfterOne =
    totalReviews > 0
      ? ((sumStars + 5) / (totalReviews + 1)).toFixed(2)
      : "5.00"

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="max-w-[1400px] mx-auto space-y-10">

        {/* ===== OCENA + KALKULATOR ===== */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow space-y-2">
            <div className="text-xs text-gray-500">Średnia ocena</div>
            <div className="text-4xl font-extrabold">⭐ {rating}</div>
            <div className="text-sm">{totalReviews} opinii</div>
            <div className="text-sm">Po 1 opinii 5★ → <b>{ratingAfterOne}</b></div>
            <div className="text-sm">Brakuje <b>{missing5}</b> opinii 5★ do <b>{displayedNext}</b></div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow space-y-1 text-sm">
            <div>❌ Usunięte negatywne: <b>{manual.removedNegative}</b></div>
            <div>⚠️ Obecne negatywne: <b>{manual.currentNegative}</b></div>
            <div>💬 Dodane odpowiedzi: <b>{manual.repliesAdded}</b></div>

            <div className="pt-3 font-semibold">Opinie z kampanii</div>
            <div className="grid grid-cols-3 text-xs">
              <div>{monthLabel(2)}<br /><b>{manual.campaignReviews.m2}</b></div>
              <div>{monthLabel(1)}<br /><b>{manual.campaignReviews.m1}</b></div>
              <div>{monthLabel(0)}<br /><b>{manual.campaignReviews.m0}</b></div>
            </div>
          </div>
        </section>

        {/* ===== PLAN + ZMIANY ===== */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="font-semibold mb-1">📅 Plan – 7 dni</div>
            <div className="text-xs text-gray-500 mb-2">Data: {manual.plan.date || "—"}</div>
            <div>{manual.plan.text || "Brak zaplanowanych działań"}</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="font-semibold mb-1">🛠 Ostatnie zmiany</div>
            <div>{manual.lastChanges || "Brak zmian"}</div>
          </div>
        </section>

        {/* ===== POZYCJONOWANIE ===== */}
        <section className="bg-white rounded-2xl p-6 shadow">
          <h2 className="font-semibold mb-4">🔑 Pozycjonowanie</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-xl p-4">
              <div className="font-semibold text-sm mb-3">
                Obecne pozycjonowane słowa i pozycja
              </div>
              {manual.keywordsMain.slice(0, 3).map((k, i) => (
                <div key={i} className="flex justify-between border-b last:border-b-0 py-1 text-sm">
                  <span>{k.keyword || "—"}</span>
                  <span className={posColor(k.position)}>{k.position || "—"}</span>
                </div>
              ))}
            </div>

            <div className="border rounded-xl p-4">
              <div className="font-semibold text-sm mb-3">
                Obecna pozycja wizytówki
              </div>
              {manual.keywordsSecondary.slice(0, 3).map((k, i) => (
                <div key={i} className="flex justify-between border-b last:border-b-0 py-1 text-sm">
                  <span>{k.keyword || "—"}</span>
                  <span className={posColor(k.position)}>{k.position || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-4">
            🟢 TOP 3 &nbsp; 🟡 TOP 10 &nbsp; 🔴 Poza TOP 10
          </div>
        </section>

        {/* ===== METRYKI ===== */}
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
                      <b>{v0.toLocaleString()}</b>
                    </div>

                    <div className="grid grid-cols-3 text-xs text-gray-600">
                      <div>{monthLabel(2)}<br /><b>{v2}</b></div>
                      <div>
                        {monthLabel(1)}<br /><b>{v1}</b><br />
                        <span className={diffPct(v1, v2) >= 0 ? "text-green-600" : "text-red-600"}>
                          {diffPct(v1, v2).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        {monthLabel(0)}<br /><b>{v0}</b><br />
                        <span className={diffPct(v0, v1) >= 0 ? "text-green-600" : "text-red-600"}>
                          {diffPct(v0, v1).toFixed(1)}%
                        </span>
                      </div>
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
