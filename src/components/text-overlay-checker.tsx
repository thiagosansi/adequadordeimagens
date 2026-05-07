'use client'

import { useState, useCallback, useRef } from 'react'
import { calculateTextPercentage, getTextOverlayStatus, GRID_SIZE } from '@/lib/text-overlay'
import { detectTextCells } from '@/lib/text-detector'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, ScanText, Loader2 } from 'lucide-react'

type Props = {
  imageUrl: string
  onPercentageChange?: (pct: number | undefined) => void
}

const TOTAL_CELLS = GRID_SIZE * GRID_SIZE

export function TextOverlayChecker({ imageUrl, onPercentageChange }: Props) {
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
      onPercentageChange?.(calculateTextPercentage(next) || undefined)
      return next
    })
  }, [onPercentageChange])

  const imgRef = useRef<HTMLImageElement>(null)
  const [isDetecting, setIsDetecting] = useState(false)

  const reset = useCallback(() => {
    setCheckedCells(new Set())
    onPercentageChange?.(undefined)
  }, [onPercentageChange])

  const handleAutoDetect = useCallback(async () => {
    if (!imgRef.current) return
    setIsDetecting(true)
    // Yield to render before heavy pixel work
    await new Promise((r) => setTimeout(r, 16))
    try {
      const detected = detectTextCells(imgRef.current)
      setCheckedCells(detected)
      onPercentageChange?.(calculateTextPercentage(detected) || undefined)
    } finally {
      setIsDetecting(false)
    }
  }, [onPercentageChange])

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
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500">
              Clique nas células que contêm texto, ou use a detecção automática.
            </p>
            <button
              onClick={handleAutoDetect}
              disabled={isDetecting}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 disabled:opacity-50"
            >
              {isDetecting
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <ScanText className="h-3 w-3" />}
              Detectar
            </button>
          </div>

          {/* Grid overlaid on the image — wrapper sizes to the displayed image, not the container */}
          <div className="mb-3 flex justify-center rounded-lg bg-gray-100">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Imagem para verificação de texto"
                className="block max-h-80 max-w-full"
                crossOrigin="anonymous"
              />
              {/* 5x5 grid overlay — inset-0 covers exactly the displayed image */}
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
