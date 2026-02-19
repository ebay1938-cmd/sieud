import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Brak sesji" }, { status: 401 })
  }

  const accessToken = session.accessToken

  try {
    /* =========================
       1. Pobierz konto firmowe
    ========================== */
    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )

    if (!accountsRes.ok) {
      return NextResponse.json(
        { error: "Błąd pobierania konta" },
        { status: 500 }
      )
    }

    const accountsData = await accountsRes.json()
    const account = accountsData.accounts?.[0]

    if (!account) {
      return NextResponse.json(
        { error: "Brak konta firmowego" },
        { status: 404 }
      )
    }

    const accountId = account.name // np. "accounts/123456789"

    /* =========================
       2. Pobierz wszystkie lokalizacje (z paginacją)
    ========================== */

    let allLocations: any[] = []
    let pageToken: string | undefined

    do {
      const url = new URL(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`
      )

      url.searchParams.set("readMask", "name,title")
      url.searchParams.set("pageSize", "100")

      if (pageToken) {
        url.searchParams.set("pageToken", pageToken)
      }

      const locationsRes = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!locationsRes.ok) {
        return NextResponse.json(
          { error: "Błąd pobierania wizytówek" },
          { status: 500 }
        )
      }

      const locationsData = await locationsRes.json()

      allLocations.push(...(locationsData.locations || []))
      pageToken = locationsData.nextPageToken

    } while (pageToken)

    return NextResponse.json({
      locations: allLocations
    })

  } catch (error) {
    console.error("Błąd API:", error)

    return NextResponse.json(
      { error: "Błąd serwera" },
      { status: 500 }
    )
  }
}
