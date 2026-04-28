'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import { Download, Loader2, Play } from 'lucide-react'
import type { CarouselCard } from '@/shared/types/carousel'
import type { AdjustmentMode, BackgroundConfig, MetaFormat } from '@/shared/types/image'
import { processAllCards, buildCarouselFileName } from '@/lib/carousel-processor'
import { cn } from '@/lib/utils'

type Props = {
  cards: CarouselCard[]
  format: MetaFormat
  globalMode: AdjustmentMode
  globalBgConfig: BackgroundConfig
  onCardsProcessed: (cards: CarouselCard[]) => void
}

export function CarouselDownloadPanel({
  cards,
  format,
  globalMode,
  globalBgConfig,
  onCardsProcessed,
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)

  const processedCount = cards.filter((c) => c.processedUrl !== null).length
  const allProcessed = processedCount === cards.length && cards.length > 0

  async function handleProcessAll() {
    if (cards.length === 0) return
    setIsProcessing(true)
    try {
      const processed = await processAllCards(
        cards,
        format,
        globalMode,
        globalBgConfig,
        (index) => setProgress('Processando card ' + (index + 1) + ' de ' + cards.length + '...'),
      )
      onCardsProcessed(processed)
    } finally {
      setIsProcessing(false)
      setProgress(null)
    }
  }

  async function handleDownloadZip() {
    if (!allProcessed) return
    setIsProcessing(true)
    setProgress('Criando .zip...')
    try {
      const zip = new JSZip()
      cards.forEach((card, index) => {
        if (!card.processedUrl) return
        const base64 = card.processedUrl.split(',')[1]!
        zip.file(buildCarouselFileName(index, format), base64, { base64: true })
      })
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'carrossel_' + format.width + 'x' + format.height + '.zip'
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsProcessing(false)
      setProgress(null)
    }
  }

  if (cards.length === 0) return null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-800">
          {allProcessed
            ? cards.length + ' cards prontos'
            : processedCount > 0
            ? processedCount + ' de ' + cards.length + ' processados'
            : cards.length + ' card' + (cards.length > 1 ? 's' : '') + ' para processar'}
        </p>
        <p className="text-xs text-gray-500">
          {format.label} · {format.width}×{format.height} px · {format.ratio}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleProcessAll}
          disabled={isProcessing || cards.length === 0}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            isProcessing || cards.length === 0
              ? 'cursor-not-allowed bg-gray-200 text-gray-400'
              : 'bg-blue-600 text-white hover:bg-blue-700',
          )}
        >
          {isProcessing && !allProcessed ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress ?? 'Processando...'}
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Processar todos
            </>
          )}
        </button>

        <button
          onClick={handleDownloadZip}
          disabled={!allProcessed || isProcessing}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            !allProcessed || isProcessing
              ? 'cursor-not-allowed bg-gray-200 text-gray-400'
              : 'bg-green-600 text-white hover:bg-green-700',
          )}
        >
          {isProcessing && allProcessed ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Baixar .zip
        </button>
      </div>
    </div>
  )
}
