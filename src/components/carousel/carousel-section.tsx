'use client'

import { useState, useCallback } from 'react'
import type { CarouselCard, CarouselFormatId } from '@/shared/types/carousel'
import type { AdjustmentMode, BackgroundConfig } from '@/shared/types/image'
import { findFormatById } from '@/lib/meta-formats'
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
    adjustmentMode: 'auto-crop',
    backgroundConfig: { type: 'solid', color: '#ffffff' },
    interactiveCrop: null,
  }
}

export function CarouselSection() {
  const [cards, setCards] = useState<CarouselCard[]>([])
  const [formatId, setFormatId] = useState<CarouselFormatId>('feed-square')
  const [globalMode, setGlobalMode] = useState<AdjustmentMode>('auto-crop')
  const [globalBgConfig, setGlobalBgConfig] = useState<BackgroundConfig>({ type: 'solid', color: '#ffffff' })
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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
      />

      {/* Preview gallery (appears after processing) */}
      <CarouselPreviewGallery cards={cards} format={format} />
    </div>
  )
}
