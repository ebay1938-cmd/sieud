import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

/**
 * YYYY-MM key for current / previous months
 */
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
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      )
    }

    const { m0, m1, m2, rating } = await req.json()

    if (!m0 || !m1 || !m2 || !rating?.name) {
      return NextResponse.json(
        { error: "Missing m0, m1, m2 or rating.name" },
        { status: 400 }
      )
    }

    const k0 = monthKey(0)
    const k1 = monthKey(1)
    const k2 = monthKey(2)

    const dataToSave = {
      id,
      updatedAt: new Date().toISOString(),

      stats: m0,

      months: {
        [k0]: m0,
        [k1]: m1,
        [k2]: m2
      },

      rating: {
        name: rating.name,
        rating: rating.rating,
        totalReviews: rating.totalReviews
      }
    }

    // ✅ ZAPIS DO VERCEL KV (działa lokalnie i online)
    await kv.set(`snapshot:${id}`, dataToSave)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("SNAPSHOT ERROR", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    )
  }
}
