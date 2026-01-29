import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Brak tokena" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Brak ID wizytówki" }, { status: 400 })
    }

    const mode = searchParams.get("mode") ?? "rolling"
    const daysParam = searchParams.get("days")
    const offset = Number(searchParams.get("offset") ?? 0)

    const today = new Date()
    let startDate: Date
    let endDate: Date

    if (mode === "month") {
      // PEŁNE MIESIĄCE 1 → 1
      startDate = new Date(today.getFullYear(), today.getMonth() - offset, 1)
      endDate = new Date(today.getFullYear(), today.getMonth() - offset + 1, 0)
    } else {
      // ROLLING (jak było)
      const days = daysParam ? Number(daysParam) : 30
      if (isNaN(days) || days <= 0) {
        return NextResponse.json({ error: "Nieprawidłowy zakres dni" }, { status: 400 })
      }

      startDate = new Date()
      startDate.setDate(today.getDate() - days + 1)
      endDate = today
    }

    const locationName = `locations/${id}`

    const metrics = [
      "WEBSITE_CLICKS",
      "CALL_CLICKS",
      "BUSINESS_DIRECTION_REQUESTS",
      "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
      "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
      "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
      "BUSINESS_IMPRESSIONS_MOBILE_MAPS"
    ]

    const metricsQuery = metrics.map(m => `dailyMetrics=${m}`).join("&")

    const dateRange =
      `&dailyRange.start_date.year=${startDate.getFullYear()}` +
      `&dailyRange.start_date.month=${startDate.getMonth() + 1}` +
      `&dailyRange.start_date.day=${startDate.getDate()}` +
      `&dailyRange.end_date.year=${endDate.getFullYear()}` +
      `&dailyRange.end_date.month=${endDate.getMonth() + 1}` +
      `&dailyRange.end_date.day=${endDate.getDate()}`

    const url =
      "https://businessprofileperformance.googleapis.com/v1/" +
      `${locationName}:fetchMultiDailyMetricsTimeSeries?` +
      metricsQuery +
      dateRange

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("GOOGLE API ERROR:", data)
      return NextResponse.json({ error: data }, { status: 500 })
    }

    const result: Record<string, number> = {}
    const series = data.multiDailyMetricTimeSeries?.[0]?.dailyMetricTimeSeries

    if (!series) {
      return NextResponse.json(result)
    }

    for (const metric of series) {
      const name = metric.dailyMetric
      const values = metric.timeSeries?.datedValues ?? []

      let sum = 0
      for (const day of values) {
        if (day.value) sum += Number(day.value)
      }

      result[name] = sum
    }

    return NextResponse.json({
      startDate,
      endDate,
      result
    })

  } catch (error: any) {
    console.error("SERVER ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
