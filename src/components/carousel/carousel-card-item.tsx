'use client'

import { useState } from 'react'
import { X, GripVertical, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import type { CarouselCard } from '@/shared/types/carousel'
import type { AdjustmentMode, BackgroundConfig, PixelCrop } from '@/shared/types/image'
import { InteractiveCropper } from '@/components/interactive-cropper'
import { findFormatById } from '@/lib/meta-formats'
import { cn } from '@/lib/utils'

type Props = {
  card: CarouselCard
  index: number
  formatId: string
  isDragOver: boolean
  onRemove: () => void
  onUpdate: (updates: Partial<CarouselCard>) => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
}

const MODES: { id: AdjustmentMode; label: string }[] = [
  { id: 'auto-crop', label: 'Auto-crop' },
  { id: 'expand', label: 'Expandir' },
  { id: 'fit-solid', label: 'Cor sólida' },
  { id: 'fit-blur', label: 'Blur' },
  { id: 'interactive-crop', label: 'Manual' },
]

const PRESET_COLORS = ['#ffffff', '#000000', '#1a1a2e', '#f5f5f5', '#1877f2', '#e8e8e8']

export function CarouselCardItem({
  card,
  index,
  formatId,
  isDragOver,
  onRemove,
  onUpdate,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: Props) {
  const [showSettings, setShowSettings] = useState(false)
  const format = findFormatById(formatId)!

  function handleCropChange(crop: PixelCrop) {
    onUpdate({ interactiveCrop: crop })
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'rounded-xl border-2 bg-white transition-all',
        isDragOver ? 'border-blue-400 shadow-lg scale-[1.02]' : 'border-gray-200',
      )}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 p-2">
        {/* Drag handle */}
        <div className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Card number */}
        <span className="text-xs font-semibold text-gray-400">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Thumbnail */}
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.processedUrl ?? card.originalUrl}
            alt={'Card ' + (index + 1)}
            className="h-full w-full object-cover"
          />
          {card.processedUrl && (
            <div className="absolute right-0.5 top-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 drop-shadow" />
            </div>
          )}
        </div>

        {/* Filename */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-gray-700">{card.file.name}</p>
          <p className="text-xs text-gray-400">
            {(card.file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>

        {/* Individual settings toggle */}
        <button
          onClick={() => {
            onUpdate({ useIndividualSettings: !card.useIndividualSettings })
            if (!card.useIndividualSettings) setShowSettings(true)
          }}
          className={cn(
            'rounded-lg border px-2 py-1 text-xs font-medium transition-colors',
            card.useIndividualSettings
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300',
          )}
        >
          {card.useIndividualSettings ? 'Individual ✓' : 'Personalizar'}
        </button>

        {/* Expand settings */}
        {card.useIndividualSettings && (
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="text-gray-400 hover:text-gray-600"
          >
            {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}

        {/* Remove */}
        <button
          onClick={onRemove}
          className="text-gray-300 hover:text-red-500 transition-colors"
          title="Remover card"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Individual settings panel */}
      {card.useIndividualSettings && showSettings && (
        <div className="border-t border-gray-100 p-3 space-y-3">
          {/* Mode selector */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-600">Modo de ajuste</p>
            <div className="flex flex-wrap gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onUpdate({ adjustmentMode: m.id })}
                  className={cn(
                    'rounded border px-2 py-1 text-xs font-medium transition-colors',
                    card.adjustmentMode === m.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker for fit-solid */}
          {card.adjustmentMode === 'fit-solid' && (
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdate({ backgroundConfig: { type: 'solid', color } })}
                  title={color}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                    card.backgroundConfig.color === color ? 'border-blue-500' : 'border-gray-300',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={card.backgroundConfig.color}
                onChange={(e) => onUpdate({ backgroundConfig: { type: 'solid', color: e.target.value } })}
                className="h-6 w-6 cursor-pointer rounded border border-gray-300"
              />
            </div>
          )}

          {/* Interactive cropper */}
          {card.adjustmentMode === 'interactive-crop' && (
            <InteractiveCropper
              imageUrl={card.originalUrl}
              format={format}
              onCropChange={handleCropChange}
            />
          )}
        </div>
      )}
    </div>
  )
}
