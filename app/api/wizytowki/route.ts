import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Brak sesji" }, { status: 401 })
  }

  const accessToken = session.accessToken

  // 1. Pobierz konto firmowe
  const accountsRes = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  const accountsData = await accountsRes.json()
  const account = accountsData.accounts?.[0]

  if (!account) {
    return NextResponse.json({ error: "Brak konta firmowego" }, { status: 404 })
  }

  const accountId = account.name // np. "accounts/1164260..."

  // 2. Pobierz lokalizacje (wizytówki) — wymagany readMask
  const locationsRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations?readMask=name,title`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  const locationsData = await locationsRes.json()

  return NextResponse.json(locationsData)
}
