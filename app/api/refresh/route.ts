import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

function monthKey(offset: number) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - offset)
  return d.toISOString().slice(0, 7) // YYYY-MM
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const { m0, m1, m2, rating } = await req.json()

    // ✅ Sprawdzamy, że rating ma name
    if (!m0 || !m1 || !m2 || !rating || !rating.name) {
      return NextResponse.json(
        { error: "Missing m0, m1, m2 or rating.name" },
        { status: 400 }
      )
    }

    const k0 = monthKey(0)
    const k1 = monthKey(1)
    const k2 = monthKey(2)

    const dir = path.join(process.cwd(), "data", "snapshots")
    await fs.mkdir(dir, { recursive: true })
    const filePath = path.join(dir, `${id}.json`)

    const dataToSave = {
      id,
      updatedAt: new Date().toISOString(),

      // 🔴 bieżący miesiąc
      stats: m0,

      // 🔴 3 miesiące
      months: {
        [k0]: m0,
        [k1]: m1,
        [k2]: m2
      },

      // 🔴 rating z nazwą wizytówki
      rating: {
        name: rating.name,
        rating: rating.rating,
        totalReviews: rating.totalReviews
      }
    }

    await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2), "utf-8")

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("SNAPSHOT ERROR", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
