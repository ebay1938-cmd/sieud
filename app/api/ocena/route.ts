import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get("placeId")

  if (!placeId) {
    return NextResponse.json({ error: "Brak placeId" }, { status: 400 })
  }

  // fetch do Google Places API z polem 'name'
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${placeId}` +
    `&fields=name,rating,user_ratings_total` +  // <--- dodajemy 'name'
    `&key=${process.env.GOOGLE_PLACES_API_KEY}`

  const response = await fetch(url)
  const data = await response.json()

  if (data.status !== "OK") {
    return NextResponse.json({ error: data }, { status: 500 })
  }

  return NextResponse.json({
    name: data.result.name || "Brak nazwy",   // <--- dodajemy 'name'
    rating: data.result.rating || 0,
    totalReviews: data.result.user_ratings_total || 0
  })
}
