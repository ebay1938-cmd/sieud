const BASE = "https://maps.googleapis.com/maps/api/place"

type SearchOptions = {
  lat?: number
  lng?: number
  radius?: number
}

export async function searchBusinesses(
  query: string,
  options?: SearchOptions
) {
  let url = `${BASE}/textsearch/json?query=${encodeURIComponent(query)}`

  // 🔑 KLUCZ DO GRIDU – SYMULACJA LOKALIZACJI
  if (options?.lat && options?.lng) {
    url += `&location=${options.lat},${options.lng}`
    url += `&radius=${options.radius ?? 3000}`
  }

  url += `&key=${process.env.GOOGLE_PLACES_API_KEY}`

  const res = await fetch(url)
  return res.json()
}

export async function getPlaceDetails(placeId: string) {
  const url = `${BASE}/details/json?place_id=${placeId}&key=${process.env.GOOGLE_PLACES_API_KEY}`
  const res = await fetch(url)
  return res.json()
}
