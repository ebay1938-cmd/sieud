"use client"
import { useState } from "react"

export default function KeywordCheck({
  business,
  onResult,
}: {
  business: any
  onResult: (result: { positions: number[]; keywords: string[] }) => void
}) {
  const [keywords, setKeywords] = useState(["", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const updateKeyword = (index: number, value: string) => {
    const next = [...keywords]
    next[index] = value
    setKeywords(next)
  }

  const check = async () => {
    if (keywords.some(k => !k.trim())) {
      setError("Uzupełnij wszystkie 3 słowa kluczowe.")
      return
    }

    setError("")
    setLoading(true)

    const positions: number[] = []

    for (const keyword of keywords) {
      const res = await fetch("/api/local-seo", {
        method: "POST",
        body: JSON.stringify({
          type: "search",
          query: `${keyword} ${business.formatted_address}`,
        }),
      })

      const data = await res.json()

      const index = data.results?.findIndex(
        (r: any) => r.place_id === business.place_id
      )

      positions.push(
        index === -1 || index === undefined ? 21 : index + 1
      )
    }

    // ✅ ZWRACAMY WSZYSTKO – NIC NIE LICZYMY TUTAJ
    onResult({
      positions,
      keywords,
    })

    setLoading(false)
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>
        Sprawdź pozycję dla 3 słów kluczowych
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {keywords.map((value, i) => (
          <input
            key={i}
            placeholder={`Słowo kluczowe ${i + 1}`}
            value={value}
            onChange={(e) => updateKeyword(i, e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          />
        ))}
      </div>

      {error && (
        <div style={{ marginTop: 8, color: "#dc2626", fontSize: 14 }}>
          {error}
        </div>
      )}

      <button
        onClick={check}
        disabled={loading}
        style={{
          marginTop: 12,
          width: "100%",
          padding: "12px",
          borderRadius: 10,
          border: "none",
          background: "#111827",
          color: "#fff",
          fontWeight: 600,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Analiza pozycji…" : "Analizuj 3 słowa"}
      </button>
    </div>
  )
}
