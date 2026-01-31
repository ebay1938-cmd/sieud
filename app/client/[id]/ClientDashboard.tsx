import type { Stats, Rating, Metric, NoteData } from "./page"

type Props = {
  rating: Rating
  months: Record<string, Stats>
  lastKeys: string[]
  grouped: Record<string, Metric[]>
  monthLabel: (key: string) => string
  note: NoteData | null
}

/* ================= UTILS ================= */

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
      className={`text-xs font-semibold px-2 py-1 rounded-full
      ${positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
    >
      {positive ? "▲" : "▼"} {Math.abs(diff)}
      {pct !== null && ` (${Math.abs(pct)}%)`}
    </div>
  )
}

/* ===== GOOGLE MATH ===== */

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

/* ================= DASHBOARD ================= */

export default function ClientDashboard({
  rating,
  months,
  lastKeys,
  grouped,
  monthLabel,
  note,
}: Props) {
  const target = nextRatingTarget(rating.rating)
  const neededForNext = reviewsNeededForNextPoint(
    rating.rating,
    rating.totalReviews
  )

  const routeMetric = Object.values(grouped)
    .flat()
    .find(m => m.label === "Wyznaczenie trasy")

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

        {/* ================= LEFT ================= */}
        <div className="space-y-10">
          <h1 className="text-2xl font-bold">📊 Dashboard wizytówki</h1>

          {/* ===== OCENA ===== */}
          <section className="bg-white rounded-2xl p-6 shadow-sm max-w-md">
            <div className="space-y-4">
              <div>
                <div className="text-lg font-semibold">{rating.name}</div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl">⭐</span>
                  <span className="text-2xl font-bold">{rating.rating}</span>
                  <span className="text-sm text-gray-500">– Średnia ocena</span>
                </div>

                <div className="text-sm text-gray-500 mt-1">
                  Aktualna liczba opinii na profilu Google{" "}
                  <span className="ml-1 text-xl font-extrabold text-gray-900">
                    {rating.totalReviews}
                  </span>
                </div>
              </div>

              {neededForNext !== null && (
                <div className="border rounded-xl p-4 space-y-2 bg-emerald-50 border-emerald-200">
                  <div className="text-sm font-semibold text-emerald-800">
                    📈 Droga do {target.toFixed(1)}
                  </div>

                  <div className="text-sm text-emerald-900">
                    Brakująca liczba opinii aby{" "}
                    <span className="font-semibold">{target.toFixed(1)}</span>:{" "}
                    <span className="font-bold">{neededForNext}</span> opinii
                  </div>

                  <div className="text-xs text-emerald-700">
                    Estymacja wzrostu liczona zgodnie z wytycznymi Google.
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ===== METRYKI ===== */}
          {Object.entries(grouped).map(([category, metrics]) => {
            if (category === "Mapy") {
              const mapsMetrics = [
                routeMetric,
                ...metrics.filter(m => m.label !== "Wyznaczenie trasy"),
              ].filter(Boolean) as Metric[]

              return (
                <section key={category} className="space-y-4">
                  <h2 className="text-xl font-semibold">{category}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {mapsMetrics.map(metric => (
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
            }

            return (
              <section key={category} className="space-y-4">
                <h2 className="text-xl font-semibold">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {metrics
                    .filter(m => m.label !== "Wyznaczenie trasy")
                    .map(metric => (
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

        {/* ================= RIGHT ================= */}
        <aside className="space-y-6">

          {/* ===== BIG NOTE CARD ===== */}
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">

            {/* Header – jak karta restauracji */}
            <div className="space-y-2">
              <div className="text-lg font-semibold">{rating.name}</div>

              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span className="text-2xl font-bold">{rating.rating}</span>
                <span className="text-sm text-gray-500">– Średnia ocena</span>
              </div>

              <div className="text-sm text-gray-500">
                Aktualna liczba opinii na profilu Google{" "}
                <span className="ml-1 font-bold text-gray-900">
                  {rating.totalReviews}
                </span>
              </div>

              {neededForNext !== null && (
                <div className="border rounded-xl p-4 space-y-1 bg-emerald-50 border-emerald-200 mt-3">
                  <div className="text-sm font-semibold text-emerald-800">
                    📈 Droga do {target.toFixed(1)}
                  </div>
                  <div className="text-sm text-emerald-900">
                    Brakująca liczba opinii aby{" "}
                    <span className="font-semibold">{target.toFixed(1)}</span>:{" "}
                    <span className="font-bold">{neededForNext}</span> opinii
                  </div>
                  <div className="text-xs text-emerald-700">
                    Estymacja wzrostu liczona zgodnie z wytycznymi Google.
                  </div>
                </div>
              )}
            </div>

            {/* ===== SNAPSHOT ===== */}
            <div className="space-y-3">
              <h3 className="font-semibold">
                📌 Pozycjonowanie – słowa kluczowe
              </h3>

              {note?.snapshot?.length ? (
                <div className="space-y-2">
                  {note.snapshot.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm border rounded-xl px-3 py-2"
                    >
                      <span className="font-medium">
                        {item.keyword || "—"}
                      </span>

                      <TrendBadge
                        diff={item.change}
                        pct={null}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Brak snapshotu pozycji
                </p>
              )}
            </div>

            {/* ===== NOTE TEXT ===== */}
            <div className="border-t pt-4 space-y-2">
              <h3 className="font-semibold">📝 Notatki</h3>

              {note?.text ? (
                <p className="text-sm whitespace-pre-wrap">
                  {note.text}
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  Brak notatki dla tego klienta
                </p>
              )}

              {note?.updatedAt && (
                <div className="text-xs text-gray-400">
                  Ostatnia edycja:{" "}
                  {new Date(note.updatedAt).toLocaleString("pl-PL")}
                </div>
              )}
            </div>

          </div>
        </aside>
      </div>
    </div>
  )
}
