'use client'

import { useEffect, useState } from 'react'
import { getUser, logout } from '@/lib/auth'

export default function AdminPage() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    getUser().then(u => setEmail(u?.email ?? null))
  }, [])

  async function handleLogout() {
    await logout()
    window.location.href = '/admin/login'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="flex items-center justify-between border-b border-gray-800 px-8 py-4">
        <span className="font-semibold">AdFrame Admin</span>
        <div className="flex items-center gap-4">
          {email && <span className="text-sm text-gray-400">{email}</span>}
          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="px-8 py-10">
        <h1 className="text-2xl font-bold">Painel de administração</h1>
        <p className="mt-2 text-gray-400">Bem-vindo à área administrativa do AdFrame.</p>
      </main>
    </div>
  )
}
