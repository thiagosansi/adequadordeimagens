'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import { Download, Loader2, Play, Sparkles } from 'lucide-react'
import type { CarouselCard } from '@/shared/types/carousel'
import type { AdjustmentMode, BackgroundConfig, MetaFormat } from '@/shared/types/image'
import { processAllCards, processCard, buildCarouselFileName } from '@/lib/carousel-processor'
import { processImageWithAI } from '@/lib/actions/cloudinary-ai'
import { cn } from '@/lib/utils'

type Props = {
  cards: CarouselCard[]
  format: MetaFormat
  globalMode: AdjustmentMode
  globalBgConfig: BackgroundConfig
  onCardsProcessed: (cards: CarouselCard[]) => void
}

async function blobUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function getEffectiveMode(card: CarouselCard, globalMode: AdjustmentMode): AdjustmentMode {
  if (!card.useIndividualSettings) return globalMode === 'interactive-crop' ? 'auto-crop' : globalMode
  return card.adjustmentMode
}

export function CarouselDownloadPanel({
  cards,
  format,
  globalMode,
  globalBgConfig,
  onCardsProcessed,
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [aiError, setAIError] = useState<string | null>(null)

  const processedCount = cards.filter((c) => c.processedUrl !== null).length
  const allProcessed = processedCount === cards.length && cards.length > 0

  // Show AI button if any card uses a mode that benefits from AI
  const hasAIEligibleCards = cards.some((card) => {
    const mode = getEffectiveMode(card, globalMode)
    return mode === 'auto-crop' || mode === 'expand'
  })

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

  async function handleProcessWithAI() {
    if (cards.length === 0) return
    setIsAIProcessing(true)
    setAIError(null)
    const result: CarouselCard[] = []
    try {
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i]!
        setProgress('IA: card ' + (i + 1) + ' de ' + cards.length + '...')
        const mode = getEffectiveMode(card, globalMode)

        let processedUrl: string
        if (mode === 'auto-crop' || mode === 'expand') {
          const dataUrl = await blobUrlToDataUrl(card.originalUrl)
          const aiMode = mode === 'expand' ? 'generative-fill' : 'smart-crop'
          processedUrl = await processImageWithAI(dataUrl, format.width, format.height, aiMode)
        } else {
          processedUrl = await processCard(card, format, globalMode, globalBgConfig)
        }
        result.push({ ...card, processedUrl })
      }
      onCardsProcessed(result)
    } catch (err) {
      setAIError(err instanceof Error ? err.message : 'Erro ao processar com IA')
    } finally {
      setIsAIProcessing(false)
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

  const anyProcessing = isProcessing || isAIProcessing

  return (
    <div className="space-y-2">
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

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleProcessAll}
            disabled={anyProcessing || cards.length === 0}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              anyProcessing || cards.length === 0
                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700',
            )}
          >
            {isProcessing ? (
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

          {hasAIEligibleCards && (
            <button
              onClick={handleProcessWithAI}
              disabled={anyProcessing}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                anyProcessing
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                  : 'bg-violet-600 text-white hover:bg-violet-700',
              )}
            >
              {isAIProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress ?? 'Processando com IA...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Processar com IA
                </>
              )}
            </button>
          )}

          <button
            onClick={handleDownloadZip}
            disabled={!allProcessed || anyProcessing}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              !allProcessed || anyProcessing
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

      {aiError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{aiError}</p>
      )}
    </div>
  )
}
