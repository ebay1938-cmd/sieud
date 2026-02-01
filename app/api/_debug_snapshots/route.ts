import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()

export async function GET() {
  const keys = await redis.keys("snapshot:*")

  const snapshots = await Promise.all(
    keys.map(async (key) => {
      const val = await redis.get(key)
      return {
        key,
        size_bytes: JSON.stringify(val).length
      }
    })
  )

  return NextResponse.json({
    count: keys.length,
    snapshots
  })
}
