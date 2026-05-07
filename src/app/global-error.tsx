'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error.message, 'digest:', error.digest)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#f8fafc' }}>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ maxWidth: 480, padding: '1.5rem', background: 'white', border: '1px solid #fecaca', borderRadius: 12 }}>
            <h2 style={{ color: '#dc2626', marginTop: 0, fontSize: 16 }}>Erro interno</h2>
            <p style={{ color: '#374151', fontSize: 14 }}><strong>Mensagem:</strong> {error.message || '(sem mensagem)'}</p>
            {error.digest && (
              <p style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'monospace' }}>digest: {error.digest}</p>
            )}
            <button
              onClick={reset}
              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
