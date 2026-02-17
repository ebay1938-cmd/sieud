import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

function monthKey(offset: number) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - offset)
  return d.toISOString().slice(0, 7)
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const { m0, m1, m2, rating } = await req.json()

    if (!m0 || !m1 || !m2) {
      return NextResponse.json({ error: "Missing stats" }, { status: 400 })
    }

    // ❗❗❗ KLUCZOWE
    if (
      !rating ||
      typeof rating.rating !== "number" ||
      rating.rating <= 0
    ) {
      return NextResponse.json(
        { error: "Rating not ready – snapshot aborted" },
        { status: 409 }
      )
    }

    const k0 = monthKey(0)
    const k1 = monthKey(1)
    const k2 = monthKey(2)

    const prev = await kv.get<any>(`snapshot:${id}`)

    const months = {
      ...prev?.months,
      [k0]: m0,
      [k1]: m1,
      [k2]: m2
    }

    await kv.set(`snapshot:${id}`, {
      id,
      updatedAt: new Date().toISOString(),
      stats: m0,
      months,
      rating: {
        name: rating.name,
        rating: rating.rating,
        totalReviews: rating.totalReviews
      }
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("SNAPSHOT ERROR", err)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
