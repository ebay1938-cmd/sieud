export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get("placeId")

    if (!placeId) {
      return NextResponse.json(
        { error: "Brak placeId" },
        { status: 400 }
      )
    }

    const url =
      "https://maps.googleapis.com/maps/api/place/details/json" +
      `?place_id=${placeId}` +
      "&fields=name,rating,user_ratings_total" +
      `&key=${process.env.GOOGLE_PLACES_API_KEY}`

    const response = await fetch(url, {
      cache: "no-store"
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Google API fetch failed" },
        { status: 502 }
      )
    }

    const data = await response.json()

    if (data.status !== "OK" || !data.result) {
      return NextResponse.json(
        { error: data },
        { status: 500 }
      )
    }

    return NextResponse.json({
      name: data.result.name ?? "Brak nazwy",
      rating: data.result.rating ?? 0,
      totalReviews: data.result.user_ratings_total ?? 0
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
