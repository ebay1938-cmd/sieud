export const revalidate = 0

/* ===================== TYPES ===================== */

type Stats = Record<string, number>

type Rating = {
  name: string
  rating: number
  totalReviews: number
}

type Metric = {
  key: string
  label: string
  icon: string
}

type NoteData = {
  text: string
  snapshot: { keyword: string; change: number }[]
  panel2: {
    negativeTotal: number
    removedNegative: number
    mediatedNegative: number
    allReplies: number
    actionsDone: string
    observations: string
    recommendations: string
    additionalNotes: string
  }
  panel3: {
    next7Days: string[]
    actionsDone: string[]
    effects30Days: string[]
  }
}

/* ===================== REALISTIC DATA ===================== */

const rating: Rating = {
  name: "Restauracja Na Zamkowej",
  rating: 4.5,
  totalReviews: 186,
}

/**
 * REALNE WZROSTY (nie równe):
 * views:   +6% / +9%
 * searches:+5% / +8%
 * calls:   +8% / +12%
 * routes:  +7% / +10%
 * website: +6% / +9%
 * photos:  +5% / +8%
 */
const months: Record<string, Stats> = {
  "2024-11": {
    views: 1380,
    searches: 920,
    calls: 86,
    routes: 210,
    website: 74,
    photos: 640,
  },
  "2024-12": {
    views: 1465,     // +6%
    searches: 966,   // +5%
    calls: 93,       // +8%
    routes: 225,     // +7%
    website: 78,     // +6%
    photos: 672,     // +5%
  },
  "2025-01": {
    views: 1595,     // +9%
    searches: 1045,  // +8%
    calls: 104,      // +12%
    routes: 248,     // +10%
    website: 85,     // +9%
    photos: 726,     // +8%
  },
}

const lastKeys = ["2024-11", "2024-12", "2025-01"]

const grouped: Record<string, Metric[]> = {
  Widoczność: [
    { key: "views", label: "Wyświetlenia wizytówki", icon: "👀" },
    { key: "searches", label: "Wyświetlenia w wyszukiwarce", icon: "🔎" },
  ],
  Interakcje: [
    { key: "calls", label: "Połączenia telefoniczne", icon: "📞" },
    { key: "website", label: "Kliknięcia w stronę", icon: "🌐" },
    { key: "photos", label: "Wyświetlenia zdjęć", icon: "🖼️" },
  ],
  Mapy: [
    { key: "routes", label: "Wyznaczenie trasy", icon: "🗺️" },
  ],
}

const note: NoteData = {
  text:
    "Profil rośnie w sposób naturalny. Najlepsze wyniki notują działania w Mapach Google oraz połączenia telefoniczne.",
  snapshot: [
    { keyword: "restauracja centrum", change: 3 },
    { keyword: "obiady domowe", change: 5 },
    { keyword: "restauracja w pobliżu", change: 4 },
  ],
  panel2: {
    negativeTotal: 14,
    removedNegative: 5,
    mediatedNegative: 4,
    allReplies: 186,
    actionsDone: "Moderacja opinii i zgłoszenia naruszeń",
    observations: "Zmniejszona liczba nowych negatywnych ocen",
    recommendations: "Zwiększyć liczbę opinii od stałych klientów",
    additionalNotes: "Profil wygląda wiarygodnie dla nowych użytkowników",
  },
  panel3: {
    next7Days: [
      "Pozyskanie 6–10 nowych opinii",
      "Dodanie aktualnych zdjęć",
      "Regularne odpowiadanie na opinie",
    ],
    actionsDone: [
      "Optymalizacja kategorii",
      "Uzupełnienie opisu wizytówki",
      "Moderacja treści",
    ],
    effects30Days: [
      "+9% wyświetleń wizytówki",
      "+12% połączeń",
      "+10% tras dojazdu",
    ],
  },
}

/* ===================== HELPERS ===================== */

const monthLabel = (key: string) =>
  ({
    "2024-11": "Listopad 2024",
    "2024-12": "Grudzień 2024",
    "2025-01": "Styczeń 2025",
  }[key] || key)

function getDelta(current: number, previous: number) {
  const diff = current - previous
  const pct = Math.round((diff / previous) * 100)
  return { diff, pct }
}

function TrendBadge({ diff, pct }: { diff: number; pct: number }) {
  return (
    <div className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
      ▲ {diff} (+{pct}%)
    </div>
  )
}

/* ===================== METRIC CARD ===================== */

function MetricCard({ metric }: { metric: Metric }) {
  const currentKey = lastKeys.at(-1)!
  const prevKey = lastKeys.at(-2)!

  const current = months[currentKey][metric.key]
  const previous = months[prevKey][metric.key]
  const delta = getDelta(current, previous)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-500 flex gap-1">
            {metric.icon} {metric.label}
          </div>
          <div className="text-3xl font-bold text-emerald-700">
            {current}
          </div>
          <div className="text-xs text-gray-400">
            {monthLabel(currentKey)}
          </div>
        </div>
        <TrendBadge diff={delta.diff} pct={delta.pct} />
      </div>

      <div className="text-xs text-gray-500 border-t pt-3 space-y-1">
        {lastKeys.map(k => (
          <div key={k} className="flex justify-between">
            <span>{monthLabel(k)}</span>
            <span className="font-medium">{months[k][metric.key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ===================== PAGE ===================== */

export default function DemoGBPPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-10 space-y-10">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
        {/* PANEL 1 */}
        <section className="bg-white rounded-3xl p-6 space-y-4">
          <h1 className="text-xl font-bold">{rating.name}</h1>
          <div className="flex gap-2 items-center">
            <span className="text-2xl">⭐</span>
            <span className="text-2xl font-bold text-emerald-700">
              {rating.rating}
            </span>
            <span className="text-sm text-gray-500">
              ({rating.totalReviews} opinii)
            </span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-emerald-800">
              Naturalny, stabilny wzrost
            </p>
            <p className="text-sm text-emerald-700">
              5–12% miesiąc do miesiąca
            </p>
          </div>

          <p className="text-sm">{note.text}</p>

          <div className="space-y-2">
            <h3 className="font-semibold">📌 Słowa kluczowe</h3>
            {note.snapshot.map((k, i) => (
              <div key={i} className="flex justify-between">
                <span>{k.keyword}</span>
                <TrendBadge diff={k.change} pct={k.change} />
              </div>
            ))}
          </div>
        </section>

        {/* PANEL 2 */}
        <section className="bg-white rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-bold">🛡️ Moderacja opinii</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Negatywne", note.panel2.negativeTotal],
              ["Usunięte", note.panel2.removedNegative],
              ["Mediacje", note.panel2.mediatedNegative],
              ["Odpowiedzi", note.panel2.allReplies],
            ].map(([label, value]) => (
              <div key={label} className="bg-emerald-50 rounded-xl p-4">
                <p className="text-xs">{label}</p>
                <p className="text-3xl font-extrabold text-emerald-700">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* PANEL 3 */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 space-y-3">
          <h2 className="text-xl font-extrabold">🚀 Strategia</h2>
          {note.panel3.next7Days.map((item, i) => (
            <div
              key={i}
              className="bg-white/5 rounded-xl px-3 py-2 flex gap-2"
            >
              <span className="text-emerald-400">✔</span>
              <span>{item}</span>
            </div>
          ))}
        </section>
      </div>

      {/* DASHBOARD */}
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">📊 Dashboard wizytówki</h2>
        {Object.entries(grouped).map(([category, metrics]) => (
          <section key={category} className="space-y-3">
            <h3 className="text-xl font-semibold">{category}</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {metrics.map(metric => (
                <MetricCard key={metric.key} metric={metric} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
