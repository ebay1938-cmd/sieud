import { Redis } from "@upstash/redis"
import { revalidatePath } from "next/cache"

export const runtime = "nodejs"

const redis = Redis.fromEnv()

type SnapshotItem = {
  keyword: string
  change: number
}

type NoteData = {
  text: string
  snapshot: SnapshotItem[]
  updatedAt: string
}

export default async function NotesPage({
  params
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

    const data: NoteData = {
      text,
      snapshot,
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
        className="max-w-xl mx-auto space-y-6 bg-white p-6 rounded-2xl shadow"
      >
        <h1 className="text-xl font-bold">
          📝 Notatka – klient {id}
        </h1>

        <textarea
          name="text"
          className="w-full h-32 border rounded-xl p-3"
          placeholder="Notatki wewnętrzne…"
          defaultValue={note?.text ?? ""}
        />

        <div className="space-y-4">
          <h2 className="font-semibold">📌 Snapshot (dashboard)</h2>

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
        </div>

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded-xl"
        >
          Zapisz
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
