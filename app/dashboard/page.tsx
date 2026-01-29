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

type KeywordPosition = {
  keyword: string
  position: number | ""
}

type ManualStats = {
  removedNegative: number
  currentNegative: number
  repliesAdded: number
  campaignReviews: {
    m0: number
    m1: number
    m2: number
  }
  keywordsMain: KeywordPosition[]
  keywordsSecondary: KeywordPosition[]
  plan: {
    date: string
    text: string
  }
  lastChanges: string
}

/* =======================
   DEFAULT (ANTY-CRASH)
======================= */

const EMPTY_MANUAL: ManualStats = {
  removedNegative: 0,
  currentNegative: 0,
  repliesAdded: 0,
  campaignReviews: { m0: 0, m1: 0, m2: 0 },
  keywordsMain: [
    { keyword: "", position: "" },
    { keyword: "", position: "" },
    { keyword: "", position: "" }
  ],
  keywordsSecondary: [
    { keyword: "", position: "" },
    { keyword: "", position: "" },
    { keyword: "", position: "" }
  ],
  plan: { date: "", text: "" },
  lastChanges: ""
}

/* =======================
   KOMPONENT
======================= */

export default function Dashboard() {
  const [locations, setLocations] = useState<Location[]>([])
  const [manual, setManual] = useState<Record<string, ManualStats>>({})
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  /* ===== LOAD ===== */
  useEffect(() => {
    fetch("/api/wizytowki")
      .then(res => res.json())
      .then(data => {
        setLocations(data.locations || [])
        setLoading(false)
      })

    const saved = localStorage.getItem("manualStats")
    if (saved) {
      try {
        setManual(JSON.parse(saved))
      } catch {}
    }
  }, [])

  /* ===== SAVE ===== */
  useEffect(() => {
    localStorage.setItem("manualStats", JSON.stringify(manual))
  }, [manual])

  const toggle = (id: string) =>
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))

  if (loading) return <p style={{ padding: 40 }}>Ładowanie…</p>

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>
        Manager wizytówek Google
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16
        }}
      >
        {locations.map(loc => {
          const locationId = loc.name.split("/").pop()!

          const data: ManualStats = {
            ...EMPTY_MANUAL,
            ...(manual[locationId] ?? {}),
            campaignReviews: {
              ...EMPTY_MANUAL.campaignReviews,
              ...(manual[locationId]?.campaignReviews ?? {})
            },
            keywordsMain:
              manual[locationId]?.keywordsMain ?? EMPTY_MANUAL.keywordsMain,
            keywordsSecondary:
              manual[locationId]?.keywordsSecondary ??
              EMPTY_MANUAL.keywordsSecondary,
            plan: {
              ...EMPTY_MANUAL.plan,
              ...(manual[locationId]?.plan ?? {})
            }
          }

          const update = (patch: Partial<ManualStats>) =>
            setManual(prev => ({
              ...prev,
              [locationId]: { ...data, ...patch }
            }))

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
              {/* ===== HEADER ===== */}
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

              {!collapsed[locationId] && (
                <>
                  {/* ===== LICZNIKI ===== */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginTop: 10
                    }}
                  >
                    <label>
                      ❌ Usunięte negatywne
                      <input
                        type="number"
                        value={data.removedNegative}
                        onChange={e =>
                          update({ removedNegative: +e.target.value })
                        }
                        style={{ width: "100%" }}
                      />
                    </label>

                    <label>
                      ⚠️ Obecne negatywne
                      <input
                        type="number"
                        value={data.currentNegative}
                        onChange={e =>
                          update({ currentNegative: +e.target.value })
                        }
                        style={{ width: "100%" }}
                      />
                    </label>

                    <label>
                      💬 Dodane odpowiedzi
                      <input
                        type="number"
                        value={data.repliesAdded}
                        onChange={e =>
                          update({ repliesAdded: +e.target.value })
                        }
                        style={{ width: "100%" }}
                      />
                    </label>
                  </div>

                  {/* ===== OPINIE ===== */}
                  <div style={{ marginTop: 10 }}>
                    <b>➕ Opinie z kampanii</b>
                    {(["m0", "m1", "m2"] as const).map((k, i) => (
                      <label key={k} style={{ display: "block", marginTop: 4 }}>
                        {i === 0
                          ? "Ten miesiąc"
                          : i === 1
                          ? "Poprzedni"
                          : "2 m-ce temu"}
                        <input
                          type="number"
                          value={data.campaignReviews[k]}
                          onChange={e =>
                            update({
                              campaignReviews: {
                                ...data.campaignReviews,
                                [k]: +e.target.value
                              }
                            })
                          }
                          style={{ width: "100%" }}
                        />
                      </label>
                    ))}
                  </div>

                  {/* ===== POZYCJONOWANE SŁOWA ===== */}
                  <div style={{ marginTop: 10 }}>
                    <b>🔑 Obecne pozycjonowane słowa i pozycja</b>

                    {data.keywordsMain.map((k, i) => (
                      <div
                        key={i}
                        style={{ display: "flex", gap: 6, marginTop: 4 }}
                      >
                        <input
                          placeholder="Słowo kluczowe"
                          value={k.keyword}
                          onChange={e => {
                            const next = [...data.keywordsMain]
                            next[i] = { ...k, keyword: e.target.value }
                            update({ keywordsMain: next })
                          }}
                          style={{ flex: 1 }}
                        />
                        <input
                          type="number"
                          placeholder="Poz."
                          value={k.position}
                          onChange={e => {
                            const next = [...data.keywordsMain]
                            next[i] = {
                              ...k,
                              position:
                                e.target.value === "" ? "" : +e.target.value
                            }
                            update({ keywordsMain: next })
                          }}
                          style={{ width: 60 }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* ===== POZYCJA WIZYTÓWKI ===== */}
                  <div style={{ marginTop: 10 }}>
                    <b>📍 Obecna pozycja wizytówki</b>

                    {data.keywordsSecondary.map((k, i) => (
                      <div
                        key={i}
                        style={{ display: "flex", gap: 6, marginTop: 4 }}
                      >
                        <input
                          placeholder="Fraza (wizytówka)"
                          value={k.keyword}
                          onChange={e => {
                            const next = [...data.keywordsSecondary]
                            next[i] = { ...k, keyword: e.target.value }
                            update({ keywordsSecondary: next })
                          }}
                          style={{ flex: 1 }}
                        />
                        <input
                          type="number"
                          placeholder="Poz."
                          value={k.position}
                          onChange={e => {
                            const next = [...data.keywordsSecondary]
                            next[i] = {
                              ...k,
                              position:
                                e.target.value === "" ? "" : +e.target.value
                            }
                            update({ keywordsSecondary: next })
                          }}
                          style={{ width: 60 }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* ===== PLAN ===== */}
                  <div style={{ marginTop: 10 }}>
                    <b>📅 Plan – następne 7 dni</b>
                    <input
                      type="date"
                      value={data.plan.date}
                      onChange={e =>
                        update({
                          plan: { ...data.plan, date: e.target.value }
                        })
                      }
                      style={{ width: "100%", marginBottom: 4 }}
                    />
                    <textarea
                      value={data.plan.text}
                      onChange={e =>
                        update({
                          plan: { ...data.plan, text: e.target.value }
                        })
                      }
                      rows={2}
                      style={{ width: "100%" }}
                    />
                  </div>

                  {/* ===== ZMIANY ===== */}
                  <div style={{ marginTop: 10 }}>
                    <b>🛠 Ostatnie zmiany</b>
                    <textarea
                      value={data.lastChanges}
                      onChange={e =>
                        update({ lastChanges: e.target.value })
                      }
                      rows={2}
                      style={{ width: "100%" }}
                    />
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
