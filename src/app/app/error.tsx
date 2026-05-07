'use client'

import { useEffect } from 'react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log full error to console so Vercel runtime logs capture it
    console.error('[AppError boundary]', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-base font-semibold text-red-600">Algo deu errado</h2>
        <p className="mb-1 text-sm text-gray-600">{error.message || 'Erro interno.'}</p>
        {error.digest && (
          <p className="mb-4 font-mono text-xs text-gray-400">digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
