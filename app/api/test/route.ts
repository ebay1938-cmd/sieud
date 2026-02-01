import { kv } from "@vercel/kv"

/**
 * GET /api/snapshots
 * Lista snapshotów + ich rozmiary
 */
export async function GET() {
  try {
    const keys = await kv.keys("snapshot:*")

    const snapshots = await Promise.all(
      keys.map(async (key) => {
        const value = await kv.get(key)

        const json = value ? JSON.stringify(value) : ""
        const size_bytes = new TextEncoder().encode(json).length

        return {
          key,
          size_bytes
        }
      })
    )

    return Response.json({
      ok: true,
      kv_connected: true,
      snapshot_count: snapshots.length,
      snapshots
    })
  } catch (err) {
    console.error("KV SNAPSHOT LIST ERROR", err)

    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    )
  }
}
