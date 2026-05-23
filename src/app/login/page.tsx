'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login, signUp, resetPassword } from '@/lib/auth'

type View = 'login' | 'signup' | 'forgot'

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
        <h1 className="mb-6 text-center text-xl font-bold text-gray-900">
          {view === 'login' && 'Entrar na sua conta'}
          {view === 'signup' && 'Criar conta'}
          {view === 'forgot' && 'Recuperar senha'}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {view !== 'forgot' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
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
