/* app/restauracja-na-zamkowej/page.tsx */

import type { Stats, Rating, Metric, NoteData } from "./page"

export const revalidate = 0

/* ===================== PANEL TYPES ===================== */

type Keyword = { phrase: string; delta: number }

type Moderation = {
  negativeTotal: number
  removedNegative: number
  mediatedNegative: number
  allReplies: number
}

type Strategy = {
  next7Days: string[]
  actionsDone: string[]
  effects30Days: string[]
}

type Props = {
  rating: Rating
  months: Record<string, Stats>
  lastKeys: string[]
  grouped: Record<string, Metric[]>
  monthLabel: (key: string) => string
  note: NoteData | null
}

/* ===================== UTILS ===================== */

function getDelta(current: number, previous: number) {
  if (!previous) return { diff: current, pct: null }
  const diff = current - previous
  const pct = Math.round((diff / previous) * 100)
  return { diff, pct }
}

function TrendBadge({ diff, pct }: { diff: number; pct: number | null }) {
  const positive = diff >= 0
  return (
    <div
      className={`text-xs font-semibold px-2 py-1 rounded-full ${
        positive
          ? "bg-emerald-100 text-emerald-700"
          : "bg-rose-100 text-rose-700"
      }`}
    >
      {positive ? "▲" : "▼"} {Math.abs(diff)}
      {pct !== null && ` (${Math.abs(pct)}%)`}
    </div>
  )
}

/* ===== GOOGLE RATING ===== */

function nextRatingTarget(avg: number) {
  return Math.round((Math.floor(avg * 10) + 1) / 10 * 10) / 10
}

function reviewsNeededForNextPoint(avg: number, total: number) {
  const target = nextRatingTarget(avg)
  if (target >= 5) return null
  const needed = ((target - avg) * total) / (5 - target)
  return Math.max(1, Math.ceil(needed))
}

/* ================= METRIC CARD ================= */

function MetricCard({
  metric,
  lastKeys,
  months,
  monthLabel,
}: {
  metric: Metric
  lastKeys: string[]
  months: Record<string, Stats>
  monthLabel: (key: string) => string
}) {
  const currentKey = lastKeys[lastKeys.length - 1]
  const prevKey = lastKeys[lastKeys.length - 2]

  const current = months[currentKey][metric.key]
  const previous = prevKey ? months[prevKey][metric.key] : 0
  const delta = getDelta(current, previous)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow transition space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            {metric.icon} {metric.label}
          </div>
          <div className="text-3xl font-bold mt-1">{current}</div>
          <div className="text-xs text-gray-400 mt-1">
            Ostatni miesiąc ({monthLabel(currentKey)})
          </div>
        </div>
        <TrendBadge diff={delta.diff} pct={delta.pct} />
      </div>

      <div className="space-y-1 text-xs text-gray-500 border-t pt-3">
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

/* ===================== MAIN ===================== */

export default function RestauracjaNaZamkowejPage({
  rating,
  months,
  lastKeys,
  grouped,
  monthLabel,
  note,
}: Props) {
  const target = nextRatingTarget(rating.rating)
  const needed = reviewsNeededForNextPoint(
    rating.rating,
    rating.totalReviews
  )

  /* ===== PANEL 1 – SŁOWA KLUCZOWE / NOTATKI ===== */
  const keywords: Keyword[] =
    note?.snapshot?.map(s => ({
      phrase: s.keyword || "—",
      delta: s.change,
    })) ?? []

  /* ===== PANEL 2 – MODERACJA ===== */
  const moderation: Moderation = note?.panel2 ?? {
    negativeTotal: 0,
    removedNegative: 0,
    mediatedNegative: 0,
    allReplies: rating.totalReviews,
  }

  /* ===== PANEL 3 – STRATEGIA ===== */
  const strategy: Strategy = note?.panel3 ?? {
    next7Days: [],
    actionsDone: [],
    effects30Days: [],
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10 space-y-10">
      <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-3">
        {/* PANEL 1 */}
        <section className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h1 className="text-xl font-bold">{rating.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl">⭐</span>
              <span className="text-2xl font-bold">{rating.rating}</span>
              <span className="text-sm text-gray-500">– Średnia ocena</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Liczba opinii{" "}
              <span className="ml-2 text-xl font-extrabold text-gray-900">
                {rating.totalReviews}
              </span>
            </p>
          </div>

          {needed !== null && (
            <div className="border rounded-xl p-4 bg-emerald-50 border-emerald-200">
              <div className="text-sm font-semibold text-emerald-800">
                📈 Droga do {target.toFixed(1)}
              </div>
              <div className="text-sm text-emerald-900">
                Brakujące opinie: <span className="font-bold">{needed}</span>
              </div>
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold">📝 Wnioski</h3>
            <p className="text-sm">{note?.text || "Brak notatki"}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">📌 Słowa kluczowe</h3>
            {keywords.length ? (
              keywords.map((k, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{k.phrase}</span>
                  <TrendBadge diff={k.delta} pct={null} />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">Brak snapshotu pozycji</p>
            )}
          </div>
        </section>

        {/* PANEL 2 */}
        <section className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-bold">🛡️ Moderacja opinii</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl p-4 bg-slate-50">
              <p className="text-xs">Negatywne</p>
              <p className="text-3xl font-extrabold">
                {moderation.negativeTotal}
              </p>
            </div>
            <div className="rounded-2xl p-4 bg-slate-50">
              <p className="text-xs">Usunięte</p>
              <p className="text-3xl font-extrabold">
                {moderation.removedNegative}
              </p>
            </div>
            <div className="rounded-2xl p-4 bg-slate-50">
              <p className="text-xs">Mediacje</p>
              <p className="text-3xl font-extrabold">
                {moderation.mediatedNegative}
              </p>
            </div>
            <div className="rounded-2xl p-4 bg-slate-50">
              <p className="text-xs">Odpowiedzi</p>
              <p className="text-3xl font-extrabold">
                {moderation.allReplies}
              </p>
            </div>
          </div>
        </section>

        {/* PANEL 3 */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg space-y-4">
          <h2 className="text-xl font-extrabold">🚀 Strategia & działania</h2>
          <Block title="Najbliższe 7 dni" items={strategy.next7Days} />
          <Block title="Wykonane działania" items={strategy.actionsDone} />
          <Block title="Efekty – ostatnie 30 dni" items={strategy.effects30Days} />
        </section>
      </div>

      {/* DASHBOARD */}
      <div className="max-w-7xl mx-auto space-y-10">
        <h1 className="text-2xl font-bold">📊 Dashboard wizytówki</h1>

        {Object.entries(grouped).map(([category, metrics]) => {
          const routeMetric = Object.values(grouped)
            .flat()
            .find(m => m.label === "Wyznaczenie trasy")

          const displayMetrics =
            category === "Mapy"
              ? ([routeMetric, ...metrics.filter(m => m.label !== "Wyznaczenie trasy")].filter(Boolean) as Metric[])
              : metrics.filter(m => m.label !== "Wyznaczenie trasy")

          return (
            <section key={category} className="space-y-4">
              <h2 className="text-xl font-semibold">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayMetrics.map(metric => (
                  <MetricCard
                    key={metric.key}
                    metric={metric}
                    lastKeys={lastKeys}
                    months={months}
                    monthLabel={monthLabel}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

/* ===================== BLOCK COMPONENT ===================== */
function Block({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-gray-300 uppercase tracking-wide">{title}</h3>
      <ul className="space-y-1 text-sm">
        {items.map((item, i) => (
          <li key={i} className="bg-white/5 rounded-xl px-3 py-2 flex gap-2">
            <span className="text-emerald-400">✔</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
