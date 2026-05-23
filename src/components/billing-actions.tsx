'use client'

import { useState } from 'react'
import { CreditCard, Zap } from 'lucide-react'

interface BillingActionsProps {
  isPaid: boolean
  orgId?: string
}

export function BillingActions({ isPaid, orgId }: BillingActionsProps) {
  const [loading, setLoading] = useState<'checkout' | 'portal' | null>(null)
  const [error, setError] = useState('')

  async function handleUpgrade(planId: 'pro' | 'team') {
    setLoading('checkout')
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, ...(planId === 'team' && orgId ? { orgId } : {}) }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Erro ao iniciar checkout')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado')
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    setError('')
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgId ? { orgId } : {}),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Erro ao abrir portal')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado')
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {isPaid ? (
        <button
          onClick={handlePortal}
          disabled={!!loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <CreditCard className="h-4 w-4" />
          {loading === 'portal' ? 'Redirecionando...' : 'Gerenciar cobrança'}
        </button>
      ) : (
        <div className="space-y-2">
          <button
            onClick={() => handleUpgrade('pro')}
            disabled={!!loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            {loading === 'checkout' ? 'Redirecionando...' : 'Fazer upgrade para Pro — R$29,90/mês'}
          </button>
          {orgId && (
            <button
              onClick={() => handleUpgrade('team')}
              disabled={!!loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              {loading === 'checkout' ? 'Redirecionando...' : 'Upgrade para Team — R$49,90/assento/mês'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
