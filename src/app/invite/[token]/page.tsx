'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

type State = 'loading' | 'accepting' | 'success' | 'error'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [state, setState] = useState<State>('loading')
  const [message, setMessage] = useState('')
  const [orgId, setOrgId] = useState('')

  useEffect(() => {
    // Auto-accept on mount (user is authenticated if they reach this page)
    setState('accepting')

    fetch(`/api/invite/${token}/accept`, { method: 'POST' })
      .then(async (res) => {
        const data = await res.json() as { ok?: boolean; orgId?: string; error?: string }
        if (!res.ok) {
          setMessage(data.error ?? 'Erro ao aceitar convite.')
          setState('error')
        } else {
          setOrgId(data.orgId ?? '')
          setState('success')
          // Redirect to org members page after 2s
          setTimeout(() => {
            router.replace(data.orgId ? `/app/org/${data.orgId}/members` : '/app')
          }, 2000)
        }
      })
      .catch(() => {
        setMessage('Erro de conexão. Tente novamente.')
        setState('error')
      })
  }, [token, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900">AdFrame</span>
      </Link>

      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        {(state === 'loading' || state === 'accepting') && (
          <>
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-500" />
            <p className="font-semibold text-gray-900">Processando convite…</p>
            <p className="mt-1 text-sm text-gray-500">Aguarde um momento.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-8 w-8 text-green-500" />
            <p className="font-semibold text-gray-900">Convite aceito!</p>
            <p className="mt-1 text-sm text-gray-500">
              Você foi adicionado à organização. Redirecionando…
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle className="mx-auto mb-4 h-8 w-8 text-red-500" />
            <p className="font-semibold text-gray-900">Convite inválido</p>
            <p className="mt-2 text-sm text-gray-500">{message}</p>
            <Link
              href="/app"
              className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Ir para o editor
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
