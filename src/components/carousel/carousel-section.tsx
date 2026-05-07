'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { CarouselCard, CarouselFormatId } from '@/shared/types/carousel'
import type { AdjustmentMode, BackgroundConfig, PixelCrop } from '@/shared/types/image'
import { findFormatById } from '@/lib/meta-formats'
import { processAllCards } from '@/lib/carousel-processor'
import { CarouselUploader } from './carousel-uploader'
import { CarouselGlobalSettings } from './carousel-global-settings'
import { CarouselCardItem } from './carousel-card-item'
import { CarouselDownloadPanel } from './carousel-download-panel'
import { CarouselPreviewGallery } from './carousel-preview-gallery'

const MAX_CARDS = 10

function makeCard(file: File): CarouselCard {
  return {
    id: crypto.randomUUID(),
    file,
    originalUrl: URL.createObjectURL(file),
    processedUrl: null,
    useIndividualSettings: false,
    adjustmentMode: null,
    backgroundConfig: { type: 'solid', color: '#ffffff' },
    interactiveCrop: null,
  }
}

export function CarouselSection() {
  const [cards, setCards] = useState<CarouselCard[]>([])
  const [formatId, setFormatId] = useState<CarouselFormatId>('meta-feed-square')
  const [globalMode, setGlobalMode] = useState<AdjustmentMode | null>(null)
  const [globalBgConfig, setGlobalBgConfig] = useState<BackgroundConfig>({ type: 'solid', color: '#ffffff' })
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isAutoProcessing, setIsAutoProcessing] = useState(false)

  const format = findFormatById(formatId)!

  const handleFilesSelected = useCallback((files: File[]) => {
    setCards((prev) => {
      const remaining = MAX_CARDS - prev.length
      const newCards = files.slice(0, remaining).map(makeCard)
      return [...prev, ...newCards]
    })
  }, [])

  const handleRemove = useCallback((id: string) => {
    setCards((prev) => {
      const card = prev.find((c) => c.id === id)
      if (card) URL.revokeObjectURL(card.originalUrl)
      return prev.filter((c) => c.id !== id)
    })
  }, [])

  const handleUpdate = useCallback((id: string, updates: Partial<CarouselCard>) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, processedUrl: null } : c)),
    )
  }, [])

  // Drag to reorder
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }, [])

  const handleDrop = useCallback(
    (toIndex: number) => {
      if (dragIndex === null || dragIndex === toIndex) return
      setCards((prev) => {
        const next = [...prev]
        const [moved] = next.splice(dragIndex, 1)
        next.splice(toIndex, 0, moved!)
        return next
      })
      setDragIndex(null)
      setDragOverIndex(null)
    },
    [dragIndex],
  )

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
    setDragOverIndex(null)
  }, [])

  const handleCardsProcessed = useCallback((processed: CarouselCard[]) => {
    setCards(processed)
  }, [])

  // ── Auto-processing (400ms debounce) ─────────────────────────────────────

  function getEffectiveModeForCard(card: CarouselCard): AdjustmentMode | null {
    if (!card.useIndividualSettings) return globalMode === 'interactive-crop' ? 'auto-crop' : globalMode
    return card.adjustmentMode
  }

  function cropHash(crop: PixelCrop | null) {
    if (!crop) return 'none'
    return `${crop.x}x${crop.y}x${crop.width}x${crop.height}`
  }

  const canAutoProcess = cards.length > 0 && cards.every((c) => getEffectiveModeForCard(c) !== null)

  const cardsSettingsKey = cards
    .map((c) => `${c.id}|${c.useIndividualSettings}|${c.adjustmentMode}|${c.backgroundConfig.color}|${cropHash(c.interactiveCrop)}`)
    .join(',')

  const autoProcessRef = useRef<() => Promise<void>>(async () => {})
  autoProcessRef.current = async () => {
    if (!canAutoProcess) return
    setIsAutoProcessing(true)
    try {
      const processed = await processAllCards(cards, format, globalMode, globalBgConfig, () => {})
      setCards(processed)
    } finally {
      setIsAutoProcessing(false)
    }
  }

  useEffect(() => {
    if (!canAutoProcess) return
    const timer = setTimeout(() => { autoProcessRef.current() }, 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsSettingsKey, formatId, globalMode, globalBgConfig.color])

  // Initial upload state
  if (cards.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-16 transition-colors hover:border-gray-400 hover:bg-gray-100 cursor-pointer"
        onClick={() => document.getElementById('carousel-file-input')?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const files = Array.from(e.dataTransfer.files).filter((f) =>
            ['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
          )
          if (files.length > 0) handleFilesSelected(files)
        }}
      >
        <input
          id="carousel-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFilesSelected(Array.from(e.target.files))
            e.target.value = ''
          }}
        />
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">
            Arraste as imagens do carrossel ou clique para selecionar
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Até {MAX_CARDS} imagens · JPG, PNG ou WebP
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Global settings */}
      <CarouselGlobalSettings
        formatId={formatId}
        mode={globalMode}
        backgroundConfig={globalBgConfig}
        onFormatChange={(id) => {
          setFormatId(id)
          setCards((prev) => prev.map((c) => ({ ...c, processedUrl: null })))
        }}
        onModeChange={(mode) => {
          setGlobalMode(mode)
          setCards((prev) => prev.map((c) => ({ ...c, processedUrl: null })))
        }}
        onBackgroundChange={(config) => {
          setGlobalBgConfig(config)
          setCards((prev) => prev.map((c) => ({ ...c, processedUrl: null })))
        }}
      />

      {/* Cards */}
      <div className="space-y-2">
        {cards.map((card, index) => (
          <CarouselCardItem
            key={card.id}
            card={card}
            index={index}
            formatId={formatId}
            isDragOver={dragOverIndex === index && dragIndex !== index}
            onRemove={() => handleRemove(card.id)}
            onUpdate={(updates) => handleUpdate(card.id, updates)}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Add more images */}
      <CarouselUploader
        onFilesSelected={handleFilesSelected}
        currentCount={cards.length}
        maxCount={MAX_CARDS}
      />

      {/* Process + Download */}
      <CarouselDownloadPanel
        cards={cards}
        format={format}
        globalMode={globalMode}
        globalBgConfig={globalBgConfig}
        onCardsProcessed={handleCardsProcessed}
        isExternalProcessing={isAutoProcessing}
      />

      {/* Preview gallery (appears after processing) */}
      <CarouselPreviewGallery cards={cards} format={format} />
    </div>
  )
}
