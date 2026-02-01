import { createClient, RedisClientType } from "redis"

let client: RedisClientType | null = null

async function getRedis(): Promise<RedisClientType> {
  if (!client) {
    if (!process.env.REDIS_URL) {
      throw new Error("REDIS_URL is missing")
    }

    client = createClient({
      url: process.env.REDIS_URL
    })

    client.on("error", (err: Error) => {
      console.error("Redis error:", err)
    })

    await client.connect()
  }

  return client
}

export async function GET() {
  try {
    const redis = await getRedis()

    const keys: string[] = await redis.keys("snapshot:*")

    const snapshots = await Promise.all(
      keys.map(async (key: string) => {
        const value: string | null = await redis.get(key)

        return {
          key,
          size_bytes: value ? Buffer.byteLength(value, "utf8") : 0
        }
      })
    )

    return Response.json({
      ok: true,
      redis_connected: true,
      snapshot_count: keys.length,
      snapshots
    })
  } catch (err: unknown) {
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    )
  }
}
