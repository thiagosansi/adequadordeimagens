'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OnboardingPage() {
  const router = useRouter()
  const nextParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('next') ?? '/app'
    : '/app'
  const isFromInvite = nextParam.startsWith('/invite/')

  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, orgName: orgName.trim() || undefined }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Algo deu errado.')
      }

      const data = await res.json() as { ok: boolean; orgId: string | null }
      if (data.orgId) {
        document.cookie = `adframe-workspace=${encodeURIComponent(data.orgId)}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`
      }

      router.replace(nextParam)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900">AdFrame</span>
      </Link>

      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center text-xl font-bold text-gray-900">
          Boas-vindas ao AdFrame
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Precisamos de algumas informações para configurar sua conta.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Seu nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="João Silva"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {isFromInvite ? (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
              Você está aceitando um convite — não é necessário criar um workspace agora.
            </p>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nome da empresa{' '}
                <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Agência XYZ"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-gray-400">
                Crie um workspace para colaborar com sua equipe.
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
