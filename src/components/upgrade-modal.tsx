'use client'

import { useState } from 'react'
import { X, Zap } from 'lucide-react'

interface UpgradeModalProps {
  reason: 'ai_request' | 'export' | 'feature_gate'
  onClose: () => void
}

const COPY = {
  ai_request: {
    title: 'Limite de IA atingido',
    description: 'Você usou todas as solicitações de IA do seu plano neste mês.',
  },
  export: {
    title: 'Limite de exportações atingido',
    description: 'Você usou todas as exportações do seu plano neste mês.',
  },
  feature_gate: {
    title: 'Recurso exclusivo do plano Pro',
    description: 'Os modos Lote, Vídeo e Carrossel estão disponíveis a partir do plano Pro.',
  },
} as const

export function UpgradeModal({ reason, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const copy = COPY[reason]

  async function handleUpgrade() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'pro' }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Erro ao iniciar checkout')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
          <Zap className="h-5 w-5 text-blue-600" />
        </div>

        <h2 className="mb-1 text-base font-bold text-gray-900">{copy.title}</h2>
        <p className="mb-5 text-sm text-gray-500">{copy.description}</p>

        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
            Plano Pro — R$29,90/mês
          </p>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>✓ 200 exportações/mês</li>
            <li>✓ 30 solicitações de IA/mês</li>
            <li>✓ Todas as plataformas</li>
            <li>✓ 7 dias grátis para testar</li>
          </ul>
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Redirecionando...' : 'Fazer upgrade para Pro'}
        </button>

        <button
          onClick={onClose}
          className="mt-2 w-full py-2 text-sm text-gray-400 hover:text-gray-600"
        >
          Agora não
        </button>
      </div>
    </div>
  )
}
