"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    google: any
  }
}

export default function ResultView({
  business,
  positions,
  keywords,
}: {
  business?: any
  positions?: number[]
  keywords?: string[]
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const gridMarkersRef = useRef<any[]>([])

  /* =========================
     MARKER – JEDEN WYGLĄD
  ========================= */
  const createMarkerIcon = (pos: number) => {
    const size = 34 // JEDEN ROZMIAR DLA WSZYSTKICH
    let bg = "#e5e7eb"
    let stroke = "#9ca3af"

    if (pos <= 3) {
      bg = "#22c55e"
      stroke = "#15803d"
    } else if (pos <= 10) {
      bg = "#fde047"
      stroke = "#ca8a04"
    } else if (pos <= 20) {
      bg = "#fb923c"
      stroke = "#c2410c"
    } else {
      bg = "#e5e7eb"
      stroke = "#f50202"
    }

    const label = pos > 20 ? "20+" : String(pos)
    const fontSize = 14

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-opacity="0.25"/>
          </filter>
        </defs>

        <circle
          cx="${size / 2}"
          cy="${size / 2}"
          r="${size / 2 - 1.5}"
          fill="${bg}"
          stroke="${stroke}"
          stroke-width="2"
          filter="url(#shadow)"
        />

        <text
          x="50%"
          y="55%"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="#111827"
          font-size="${fontSize}"
          font-weight="700"
          font-family="Inter, Arial, sans-serif"
        >
          ${label}
        </text>
      </svg>
    `

    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size / 2, size / 2),
    }
  }

  /* =========================
     LOSOWE PUNKTY (−50%)
  ========================= */
  const generateRandomPoints = (
    lat: number,
    lng: number,
    count = 10, // BYŁO 20 → JEST 10
    radiusMeters = 2500
  ) => {
    const points: { lat: number; lng: number }[] = []
    const radiusDeg = radiusMeters / 111320

    for (let i = 0; i < count; i++) {
      const u = Math.random()
      const v = Math.random()
      const w = radiusDeg * Math.sqrt(u)
      const t = 2 * Math.PI * v
      points.push({
        lat: lat + w * Math.sin(t),
        lng: lng + w * Math.cos(t),
      })
    }

    return points
  }

  /* =========================
     INIT MAPY
  ========================= */
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const initMap = () => {
      mapInstance.current = new window.google.maps.Map(mapRef.current!, {
        center: { lat: 52.2297, lng: 21.0122 },
        zoom: 11,
        disableDefaultUI: true,
        zoomControl: true,
      })
    }

    if (window.google?.maps) initMap()
    else {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      script.async = true
      script.onload = initMap
      document.body.appendChild(script)
    }
  }, [])

  /* =========================
     MARKERY
  ========================= */
  useEffect(() => {
    if (!mapInstance.current || !business || !positions || positions.length !== 3)
      return

    const lat =
      typeof business.geometry.location.lat === "function"
        ? business.geometry.location.lat()
        : business.geometry.location.lat

    const lng =
      typeof business.geometry.location.lng === "function"
        ? business.geometry.location.lng()
        : business.geometry.location.lng

    markerRef.current?.setMap(null)
    gridMarkersRef.current.forEach((m) => m.setMap(null))
    gridMarkersRef.current = []

    markerRef.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstance.current,
      title: business.name,
      zIndex: 100,
    })

    positions.forEach((pos, i) => {
      const points = generateRandomPoints(
        lat + i * 0.002,
        lng + i * 0.002
      )

      points.forEach((p) => {
        const m = new window.google.maps.Marker({
          position: p,
          map: mapInstance.current,
          icon: createMarkerIcon(pos),
          clickable: false,
          zIndex: 10,
        })
        gridMarkersRef.current.push(m)
      })
    })

    mapInstance.current.panTo({ lat, lng })
  }, [business, positions])

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "420px",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  )
}
