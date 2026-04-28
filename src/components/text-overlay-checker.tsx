'use client'

import { useState, useCallback } from 'react'
import { calculateTextPercentage, getTextOverlayStatus, GRID_SIZE } from '@/lib/text-overlay'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

type Props = {
  imageUrl: string
}

const TOTAL_CELLS = GRID_SIZE * GRID_SIZE

export function TextOverlayChecker({ imageUrl }: Props) {
  const [checkedCells, setCheckedCells] = useState<Set<number>>(new Set())
  const [isExpanded, setIsExpanded] = useState(false)

  const percentage = calculateTextPercentage(checkedCells)
  const status = getTextOverlayStatus(percentage)

  const toggleCell = useCallback((index: number) => {
    setCheckedCells((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const reset = useCallback(() => setCheckedCells(new Set()), [])

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Header — always visible */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Verificar texto na imagem
          </span>
          {checkedCells.size > 0 && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                status === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
              )}
            >
              {percentage}% de texto
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4">
          <p className="mb-3 text-xs text-gray-500">
            Clique nas células que contêm texto. O Meta recomenda manter o texto abaixo de 20% da imagem (máx. 5 células).
          </p>

          {/* Grid overlaid on the image */}
          <div className="relative mb-3 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Imagem para verificação de texto"
              className="w-full object-cover"
              style={{ maxHeight: 240 }}
            />
            {/* 5x5 grid overlay */}
            <div
              className="absolute inset-0 grid"
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}
            >
              {Array.from({ length: TOTAL_CELLS }, (_, i) => (
                <button
                  key={i}
                  onClick={() => toggleCell(i)}
                  className={cn(
                    'border border-white/30 transition-colors',
                    checkedCells.has(i)
                      ? 'bg-red-500/50'
                      : 'bg-transparent hover:bg-white/20',
                  )}
                  title={`Célula ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    status === 'pass' ? 'bg-green-500' : 'bg-red-500',
                  )}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <span
                className={cn(
                  'text-xs font-semibold',
                  status === 'pass' ? 'text-green-700' : 'text-red-700',
                )}
              >
                {percentage}% ({checkedCells.size}/{TOTAL_CELLS} células)
              </span>
            </div>
            {checkedCells.size > 0 && (
              <button
                onClick={reset}
                className="text-xs text-gray-400 underline hover:text-gray-600"
              >
                Limpar
              </button>
            )}
          </div>

          {status === 'fail' && (
            <p className="mt-2 text-xs font-medium text-red-600">
              Texto acima de 20% — o Meta pode limitar o alcance desta imagem. Reduza o texto ou use outra imagem.
            </p>
          )}
          {status === 'pass' && checkedCells.size > 0 && (
            <p className="mt-2 text-xs font-medium text-green-600">
              Dentro do limite — imagem aprovada para campanhas no Meta.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
