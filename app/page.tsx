"use client"

import { useState, useRef, useEffect } from "react"
import BusinessSearch from "@/components/BusinessSearch"
import BusinessList from "@/components/BusinessList"
import KeywordCheck from "@/components/KeywordCheck"
import ResultView from "@/components/ResultView"

export default function HomePage() {
  // ✅ Jeśli produkcja (np. Vercel) – pokaż komunikat
  if (process.env.NODE_ENV === "production") {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f6f8",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <h1>Cześć! 👋</h1>
          <p style={{ marginTop: "10px", fontSize: "18px" }}>
            Zapraszamy do Twojego panelu klienta.
          </p>
        </div>
      </main>
    )
  }

  // ✅ Localhost – normalna aplikacja
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null)

  const [positions, setPositions] = useState<number[] | null>(null)
  const [keywords, setKeywords] = useState<string[] | null>(null)

  const keywordRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedBusiness && keywordRef.current) {
      keywordRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }, [selectedBusiness])

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        paddingTop: "60px",
        background: "#f5f6f8",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
          📍 Local SEO – mapa wizytówki
        </h1>

        <ResultView
          business={selectedBusiness}
          positions={positions || undefined}
          keywords={keywords || undefined}
        />

        <section style={{ marginBottom: "16px", marginTop: "20px" }}>
          <BusinessSearch
            onResults={(list: any[]) => {
              setBusinesses(list)
              setPositions(null)
              setKeywords(null)
            }}
            onSelect={(b: any) => {
              setSelectedBusiness(b)
              setPositions(null)
              setKeywords(null)
            }}
          />
        </section>

        {businesses.length > 0 && (
          <section style={{ marginBottom: "20px" }}>
            <BusinessList
              items={businesses}
              selected={selectedBusiness}
              onSelect={(b: any) => {
                setSelectedBusiness(b)
                setPositions(null)
                setKeywords(null)
              }}
              onClear={() => {
                setSelectedBusiness(null)
                setPositions(null)
                setKeywords(null)
              }}
            />
          </section>
        )}

        {selectedBusiness && (
          <div ref={keywordRef}>
            <KeywordCheck
              business={selectedBusiness}
              onResult={(result: {
                positions: number[]
                keywords: string[]
              }) => {
                setPositions(result.positions)
                setKeywords(result.keywords)
              }}
            />
          </div>
        )}
      </div>
    </main>
  )
}
