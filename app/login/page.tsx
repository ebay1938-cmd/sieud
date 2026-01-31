"use client"

import { useSession, signIn, signOut } from "next-auth/react"

export default function LoginPage() {
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

      <pre>{session.accessToken}</pre>

      <button onClick={() => signOut()}>
        Wyloguj
      </button>
    </div>
  )
}
