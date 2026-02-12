"use client"

import { useState, useEffect } from "react"

export default function BusinessList({
  items,
  selected,
  onSelect,
  onClear,
}: {
  items: any[]
  selected: any | null
  onSelect: (b: any) => void
  onClear: () => void
}) {
  const [lockView, setLockView] = useState(false)

  // 🔒 zwęż listę DOPIERO po renderze
  useEffect(() => {
    if (selected) {
      const t = setTimeout(() => setLockView(true), 0)
      return () => clearTimeout(t)
    } else {
      setLockView(false)
    }
  }, [selected])

  const visibleItems = lockView && selected ? [selected] : items

  return (
    <div
      style={{
        maxHeight: lockView ? "none" : "260px",
        overflowY: lockView ? "visible" : "auto",
        paddingRight: "6px",
        display: "grid",
        gap: "12px",
      }}
    >
      {visibleItems.map((b) => {
        const isSelected = selected?.place_id === b.place_id

        return (
          <div
            key={b.place_id}
            onClick={() => onSelect(b)} // ✅ 1 KLIK
            style={{
              cursor: "pointer",
              padding: "14px 16px",
              borderRadius: "10px",
              border: isSelected
                ? "2px solid #2563eb"
                : "1px solid #e5e7eb",
              background: isSelected ? "#eff6ff" : "#fff",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ fontWeight: 600 }}>{b.name}</div>
            <div style={{ fontSize: "14px", color: "#555" }}>
              {b.formatted_address}
            </div>

            {isSelected && (
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "#2563eb", fontWeight: 600 }}>
                  ✓ Wybrana wizytówka
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onClear()
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#2563eb",
                    cursor: "pointer",
                    fontSize: "13px",
                    textDecoration: "underline",
                  }}
                >
                  Zmień wizytówkę
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
