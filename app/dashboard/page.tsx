"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

/* =======================
   TYPY
======================= */

type Location = {
  name: string
  title: string
}

/* =======================
   KOMPONENT
======================= */

export default function Dashboard() {
  const [locations, setLocations] = useState<Location[]>([])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ===== LOAD LOCATIONS ===== */
  const loadLocations = async () => {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/wizytowki", { cache: "no-store" })
      if (!res.ok) throw new Error("Fetch failed")

      const data = await res.json()
      setLocations(data.locations || [])
    } catch {
      setError("Nie udało się pobrać wizytówek")
    } finally {
      setLoading(false)
    }
  }

  /* ===== REFRESH SNAPSHOTS (ALL) ===== */
  const refreshAll = async () => {
    setRefreshing(true)
    setError(null)

    try {
      for (const loc of locations) {
        const id = loc.name.split("/").pop()
        if (!id) continue

        const res = await fetch(`/api/refresh?id=${id}`, {
          method: "POST"
        })

        if (!res.ok) {
          throw new Error(`Refresh failed for ${id}`)
        }
      }
    } catch {
      setError("Błąd podczas odświeżania danych")
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadLocations()
  }, [])

  const toggle = (id: string) =>
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))

  if (loading) {
    return <p style={{ padding: 40 }}>Ładowanie…</p>
  }

  return (
    <div style={{ padding: 24 }}>
      {/* ===== HEADER ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20
        }}
      >
        <h1 style={{ fontSize: 22 }}>Manager wizytówek Google</h1>

        <button
          onClick={refreshAll}
          disabled={refreshing || locations.length === 0}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: refreshing ? "#eee" : "white",
            cursor: refreshing ? "not-allowed" : "pointer",
            fontSize: 13
          }}
        >
          🔄 {refreshing ? "Odświeżanie…" : "Odśwież dane"}
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
      )}

      {/* ===== LISTA WIZYTÓWEK ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16
        }}
      >
        {locations.map(loc => {
          const locationId = loc.name.split("/").pop()!

          return (
            <div
              key={loc.name}
              style={{
                background: "white",
                borderRadius: 10,
                padding: 14,
                border: "1px solid #eee",
                fontSize: 13
              }}
            >
              <div
                onClick={() => toggle(locationId)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <Link
                  href={`/dashboard/${locationId}`}
                  onClick={e => e.stopPropagation()}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ fontWeight: 600 }}>{loc.title}</div>
                  <div style={{ color: "#999", fontSize: 11 }}>
                    ID: {locationId}
                  </div>
                </Link>

                <span style={{ fontSize: 18 }}>
                  {collapsed[locationId] ? "➕" : "➖"}
                </span>
              </div>

              {/* SNAP READY – puste celowo */}
              {!collapsed[locationId] && null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
