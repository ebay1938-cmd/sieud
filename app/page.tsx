"use client"

import { useSession, signIn, signOut } from "next-auth/react"

export default function Home() {
  const { data: session, status } = useSession()

  if (status === "loading") return <p>Ładowanie...</p>

  if (!session) {
    return (
      <button onClick={() => signIn("google")}>
        Zaloguj Google
      </button>
    )
  }

  return (
    <div>
      <p>✅ Zalogowany jako: {session.user?.email}</p>

      <p>🔑 Access Token:</p>
      <pre style={{ maxWidth: 600, overflow: "auto" }}>
        {session.accessToken}
      </pre>

      <br />
      <button onClick={() => signOut()}>
        Wyloguj
      </button>
    </div>
  )
}
