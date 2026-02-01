import { Redis } from "@upstash/redis"
import { revalidatePath } from "next/cache"

export const runtime = "nodejs"

const redis = Redis.fromEnv()

/* ================= TYPES ================= */

type SnapshotItem = {
  keyword: string
  change: number
}

type Panel2Data = {
  negativeTotal: number
  removedNegative: number
  mediatedNegative: number
  allReplies: number
  seoActions: string[]
  completedActions: number
  actionsDone?: string
  observations?: string
  recommendations?: string
  additionalNotes?: string
}

type Panel3Data = {
  next7Days: string[]
  actionsDone: string[]
  effects30Days: string[]
}

type NoteData = {
  text: string
  snapshot: SnapshotItem[]
  panel2: Panel2Data
  panel3: Panel3Data
  updatedAt: string
}

/* ================= PAGE ================= */

export default async function NotesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const key = `note:${id}`

  let note: NoteData | null = null

  try {
    note = await redis.get<NoteData>(key)
  } catch {
    note = null
  }

  async function saveNote(formData: FormData) {
    "use server"

    const text = String(formData.get("text") ?? "")

    const snapshot: SnapshotItem[] = [0, 1, 2].map(i => ({
      keyword: String(formData.get(`keyword_${i}`) ?? ""),
      change: Number(formData.get(`change_${i}`) ?? 0),
    }))

    const panel2: Panel2Data = {
      negativeTotal: Number(formData.get("negativeTotal") ?? 0),
      removedNegative: Number(formData.get("removedNegative") ?? 0),
      mediatedNegative: Number(formData.get("mediatedNegative") ?? 0),
      allReplies: Number(formData.get("allReplies") ?? 0),
      seoActions: String(formData.get("seoActions") ?? "")
        .split("\n")
        .filter(Boolean),
      completedActions: Number(formData.get("completedActions") ?? 0),
      actionsDone: String(formData.get("panel2_actionsDone") ?? ""),
      observations: String(formData.get("panel2_observations") ?? ""),
      recommendations: String(formData.get("panel2_recommendations") ?? ""),
      additionalNotes: String(formData.get("panel2_additionalNotes") ?? ""),
    }

    const panel3: Panel3Data = {
      next7Days: String(formData.get("next7Days") ?? "")
        .split("\n")
        .filter(Boolean),
      actionsDone: String(formData.get("actionsDone") ?? "")
        .split("\n")
        .filter(Boolean),
      effects30Days: String(formData.get("effects30Days") ?? "")
        .split("\n")
        .filter(Boolean),
    }

    const data: NoteData = {
      text,
      snapshot,
      panel2,
      panel3,
      updatedAt: new Date().toISOString(),
    }

    await redis.set(key, data)

    revalidatePath(`/notes/${id}`)
    revalidatePath(`/client/${id}`)
  }

  return (
    <div className="min-h-screen bg-slate-100 p-10">
      <form
        action={saveNote}
        className="max-w-3xl mx-auto space-y-10 bg-white p-6 rounded-2xl shadow"
      >
        <h1 className="text-xl font-bold">📝 Notatnik – klient {id}</h1>

        {/* PANEL 1 */}
        <section className="space-y-4">
          <h2 className="font-semibold">📌 Panel 1 – Wnioski + snapshot</h2>

          <textarea
            name="text"
            className="w-full h-32 border rounded-xl p-3"
            placeholder="Notatki / wnioski…"
            defaultValue={note?.text ?? ""}
          />

          {[0, 1, 2].map(i => (
            <div key={i} className="flex gap-3">
              <input
                name={`keyword_${i}`}
                defaultValue={note?.snapshot?.[i]?.keyword ?? ""}
                placeholder={`Słowo kluczowe #${i + 1}`}
                className="flex-1 border rounded-xl px-3 py-2 text-sm"
              />
              <input
                name={`change_${i}`}
                type="number"
                defaultValue={note?.snapshot?.[i]?.change ?? 0}
                className="w-24 border rounded-xl px-3 py-2 text-sm"
              />
            </div>
          ))}
        </section>

        {/* PANEL 2 */}
        <section className="space-y-4 border-t pt-6">
          <h2 className="font-semibold">🛡️ Panel 2 – Moderacja</h2>

          {/* Liczby */}
          <div className="grid grid-cols-2 gap-4">
            <input
              name="negativeTotal"
              defaultValue={note?.panel2?.negativeTotal ?? 0}
              placeholder="Negatywne"
              className="border rounded-xl px-3 py-2"
            />
            <input
              name="removedNegative"
              defaultValue={note?.panel2?.removedNegative ?? 0}
              placeholder="Usunięte"
              className="border rounded-xl px-3 py-2"
            />
            <input
              name="mediatedNegative"
              defaultValue={note?.panel2?.mediatedNegative ?? 0}
              placeholder="Mediacje"
              className="border rounded-xl px-3 py-2"
            />
            <input
              name="allReplies"
              defaultValue={note?.panel2?.allReplies ?? 0}
              placeholder="Odpowiedzi"
              className="border rounded-xl px-3 py-2"
            />
          </div>

          {/* SEO działania */}
          <textarea
            name="seoActions"
            defaultValue={note?.panel2?.seoActions?.join("\n") ?? ""}
            placeholder="Działania SEO (1 linia = 1 działanie)"
            className="w-full h-28 border rounded-xl p-3 text-sm"
          />

          <input
            name="completedActions"
            defaultValue={note?.panel2?.completedActions ?? 0}
            placeholder="Liczba wykonanych działań"
            className="border rounded-xl px-3 py-2 w-60"
          />

          {/* Dodatkowe pola Panel 2 */}
          <textarea
            name="panel2_actionsDone"
            defaultValue={note?.panel2?.actionsDone ?? ""}
            placeholder="Wykonane działania"
            className="w-full h-16 border rounded-xl p-3 text-sm"
          />
          <textarea
            name="panel2_observations"
            defaultValue={note?.panel2?.observations ?? ""}
            placeholder="Obserwacje"
            className="w-full h-16 border rounded-xl p-3 text-sm"
          />
          <textarea
            name="panel2_recommendations"
            defaultValue={note?.panel2?.recommendations ?? ""}
            placeholder="Rekomendacje"
            className="w-full h-16 border rounded-xl p-3 text-sm"
          />
          <textarea
            name="panel2_additionalNotes"
            defaultValue={note?.panel2?.additionalNotes ?? ""}
            placeholder="Uwagi dodatkowe"
            className="w-full h-16 border rounded-xl p-3 text-sm"
          />
        </section>

        {/* PANEL 3 */}
        <section className="space-y-4 border-t pt-6">
          <h2 className="font-semibold">🚀 Panel 3 – Strategia</h2>

          <textarea
            name="next7Days"
            defaultValue={note?.panel3?.next7Days?.join("\n") ?? ""}
            placeholder="Najbliższe 7 dni"
            className="w-full h-24 border rounded-xl p-3 text-sm"
          />

          <textarea
            name="actionsDone"
            defaultValue={note?.panel3?.actionsDone?.join("\n") ?? ""}
            placeholder="Wykonane działania"
            className="w-full h-24 border rounded-xl p-3 text-sm"
          />

          <textarea
            name="effects30Days"
            defaultValue={note?.panel3?.effects30Days?.join("\n") ?? ""}
            placeholder="Efekty 30 dni"
            className="w-full h-24 border rounded-xl p-3 text-sm"
          />
        </section>

        <button
          type="submit"
          className="bg-black text-white px-6 py-3 rounded-xl"
        >
          Zapisz wszystko
        </button>

        {note?.updatedAt && (
          <div className="text-xs text-gray-400">
            Ostatnia edycja:{" "}
            {new Date(note.updatedAt).toLocaleString("pl-PL")}
          </div>
        )}
      </form>
    </div>
  )
}
