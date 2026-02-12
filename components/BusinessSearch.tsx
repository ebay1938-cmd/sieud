"use client"
import { useEffect, useState } from "react"

export default function BusinessSearch({
  onResults,
  onSelect,
}: {
  onResults: (items: any[]) => void
  onSelect: (b: any) => void
}) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [timer, setTimer] = useState<any>(null)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (locked) return

    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }

    if (timer) clearTimeout(timer)

    const newTimer = setTimeout(async () => {
      setLoading(true)

      const res = await fetch("/api/local-seo", {
        method: "POST",
        body: JSON.stringify({ type: "search", query }),
      })
      const data = await res.json()

      setSuggestions(data.results || [])
      setLoading(false)
    }, 400)

    setTimer(newTimer)

    return () => clearTimeout(newTimer)
  }, [query, locked])

  const selectSuggestion = (business: any) => {
    setLocked(true)
    setQuery(business.name)
    setSuggestions([])

    onResults([business]) // żeby lista się pokazała
    onSelect(business)    // 🔥 OD RAZU WYBÓR (1 KLIK)
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          placeholder="np. restauracja Kraków"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setLocked(false)
          }}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
          }}
        />
        <button
          disabled
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 500,
            opacity: 0.6,
          }}
        >
          {loading ? "Szukam…" : "Wyniki"}
        </button>
      </div>

      {!locked && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "6px",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            maxHeight: "260px",
            overflowY: "auto",
            zIndex: 20,
            boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
          }}
        >
          {suggestions.map((b) => (
            <div
              key={b.place_id}
              onClick={() => selectSuggestion(b)}
              style={{
                padding: "12px 14px",
                cursor: "pointer",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div style={{ fontWeight: 500 }}>{b.name}</div>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                {b.formatted_address}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
