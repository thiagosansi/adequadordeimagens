'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
  }, [])

  function handleRefresh() {
    startTransition(() => {
      router.refresh()
      setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    })
  }

  return (
    <div className="flex items-center gap-3">
      {lastUpdated && (
        <p className="hidden text-xs sm:block" style={{ color: '#94A3B8' }}>
          Atualizado às {lastUpdated}
        </p>
      )}
      <button
        onClick={handleRefresh}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          border: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          color: '#475569',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
        onMouseEnter={(e) => {
          if (!isPending) {
            e.currentTarget.style.borderColor = '#CBD5E1'
            e.currentTarget.style.backgroundColor = '#F8FAFC'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#E2E8F0'
          e.currentTarget.style.backgroundColor = '#FFFFFF'
        }}
      >
        <RefreshCw
          className={`h-3.5 w-3.5 transition-transform ${isPending ? 'animate-spin' : ''}`}
          style={{ color: '#2563EB' }}
        />
        {isPending ? 'Atualizando...' : 'Atualizar'}
      </button>
    </div>
  )
}
