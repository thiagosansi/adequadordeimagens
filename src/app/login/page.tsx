'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { login, signUp, resetPassword, signInWithGoogle } from '@/lib/auth'

type View = 'login' | 'signup' | 'forgot'

interface InviteMeta {
  email: string
  orgName: string | null
  expired: boolean
  accepted: boolean
}

export default function LoginPage() {
  const [view, setView] = useState<View>('login')
  const nextUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('next') ?? '/app'
    : '/app'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteMeta, setInviteMeta] = useState<InviteMeta | null>(null)

  // When arriving via an invite link, fetch metadata and pre-fill the form
  useEffect(() => {
    const inviteToken = nextUrl.startsWith('/invite/')
      ? nextUrl.replace('/invite/', '').split('?')[0]
      : null

    if (!inviteToken) return

    fetch(`/api/invite/${inviteToken}`)
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json() as InviteMeta
        setInviteMeta(data)
        setEmail(data.email)
        setView('signup')
      })
      .catch(() => { /* silently ignore — user can fill manually */ })
  }, [nextUrl])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (view === 'login') {
        await login(email, password)
        window.location.href = nextUrl
      } else if (view === 'signup') {
        const session = await signUp(email, password)
        if (session) {
          const dest = nextUrl !== '/app'
            ? `/app/onboarding?next=${encodeURIComponent(nextUrl)}`
            : '/app/onboarding'
          window.location.href = dest
        } else {
          setMessage('Conta criada! Verifique seu e-mail para confirmar.')
        }
      } else {
        await resetPassword(email)
        setMessage('Enviamos um link de recuperação para seu e-mail.')
      }
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
        {/* Invite banner */}
        {inviteMeta && !inviteMeta.expired && !inviteMeta.accepted && (
          <div className="mb-6 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Você foi convidado para participar do time
            {inviteMeta.orgName ? (
              <> <strong>{inviteMeta.orgName}</strong>.</>
            ) : '.'}
            {' '}Crie sua conta para aceitar.
          </div>
        )}
        {inviteMeta?.expired && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Este convite expirou. Peça ao administrador um novo convite.
          </div>
        )}
        {inviteMeta?.accepted && (
          <div className="mb-6 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Este convite já foi aceito. Faça login para acessar.
          </div>
        )}

        <h1 className="mb-6 text-center text-xl font-bold text-gray-900">
          {view === 'login' && 'Entrar na sua conta'}
          {view === 'signup' && 'Criar conta'}
          {view === 'forgot' && 'Recuperar senha'}
        </h1>

        {view !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={() => signInWithGoogle(nextUrl !== '/app' ? nextUrl : undefined)}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">ou</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {view !== 'forgot' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {view === 'signup' ? 'Defina uma senha' : 'Senha'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          {message && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : view === 'login' ? 'Entrar' : view === 'signup' ? 'Criar conta' : 'Enviar link'}
          </button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-2 text-sm text-gray-500">
          {view === 'login' && (
            <>
              <button onClick={() => setView('forgot')} className="hover:text-blue-600">
                Esqueceu a senha?
              </button>
              <span>
                Não tem conta?{' '}
                <button onClick={() => setView('signup')} className="font-medium text-blue-600 hover:underline">
                  Criar agora
                </button>
              </span>
            </>
          )}
          {view === 'signup' && (
            <span>
              Já tem conta?{' '}
              <button onClick={() => setView('login')} className="font-medium text-blue-600 hover:underline">
                Entrar
              </button>
            </span>
          )}
          {view === 'forgot' && (
            <button onClick={() => setView('login')} className="hover:text-blue-600">
              ← Voltar para login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
