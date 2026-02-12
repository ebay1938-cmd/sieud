import { NextResponse } from "next/server"
import { searchBusinesses } from "@/lib/google"

/**
 * body:
 * {
 *   type: "search" | "grid-check",
 *   query?: string,
 *   keyword?: string,
 *   businessPlaceId?: string,
 *   center?: { lat: number; lng: number },
 *   numPoints?: number,
 *   radiusMeters?: number
 * }
 */

export async function POST(req: Request) {
  const body = await req.json()

  try {
    // 🔍 LISTA / AUTOCOMPLETE
    if (body.type === "search") {
      const data = await searchBusinesses(body.query)
      return NextResponse.json(data)
    }

    // 🗺️ GRID CHECK
    if (body.type === "grid-check") {
      const {
        keyword,
        businessPlaceId,
        center,
        numPoints = 50,
        radiusMeters = 3000,
      } = body

      if (!keyword || !businessPlaceId || !center) {
        return NextResponse.json(
          { error: "Missing grid-check params" },
          { status: 400 }
        )
      }

      const results: {
        lat: number
        lng: number
        position: number | null
      }[] = []

      const generateRandomPoint = (lat: number, lng: number, r: number) => {
        const radiusInDegrees = r / 111320
        const u = Math.random()
        const v = Math.random()
        const w = radiusInDegrees * Math.sqrt(u)
        const t = 2 * Math.PI * v
        return {
          lat: lat + w * Math.sin(t),
          lng: lng + w * Math.cos(t),
        }
      }

      for (let i = 0; i < numPoints; i++) {
        const point = generateRandomPoint(
          center.lat,
          center.lng,
          radiusMeters
        )

        const data = await searchBusinesses(keyword, {
          lat: point.lat,
          lng: point.lng,
          radius: radiusMeters,
        })

        const index = data.results?.findIndex(
          (r: any) => r.place_id === businessPlaceId
        )

        results.push({
          lat: point.lat,
          lng: point.lng,
          position: index >= 0 ? index + 1 : null,
        })

        await new Promise((r) => setTimeout(r, 100))
      }

      return NextResponse.json({ results })
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "API error" }, { status: 500 })
  }
}
