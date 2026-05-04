'use client'

import { useState } from 'react'
import type { Platform } from '@/shared/types/platform'
import type { MetaFormat } from '@/shared/types/image'
import { getImageFormats } from '@/lib/format-registry'
import { PlatformSelector } from './platform-selector'
import { cn } from '@/lib/utils'

// Platforms that have image formats
const IMAGE_PLATFORMS: Platform[] = ['meta', 'tiktok', 'google', 'linkedin']

type Props = {
  selected: MetaFormat | null
  onSelect: (format: MetaFormat) => void
}

export function FormatSelector({ selected, onSelect }: Props) {
  const [platform, setPlatform] = useState<Platform>('meta')

  const formats = getImageFormats(platform)

  function handlePlatformChange(next: Platform) {
    setPlatform(next)
    // Clear selection when switching platforms to avoid cross-platform confusion
    if (selected?.platform !== next) onSelect(null as unknown as MetaFormat)
  }

  return (
    <div>
      <PlatformSelector
        selected={platform}
        onChange={handlePlatformChange}
        available={IMAGE_PLATFORMS}
      />
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Escolha o formato
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {formats.map((format) => (
          <FormatCard
            key={format.id}
            format={format}
            isSelected={selected?.id === format.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

function FormatCard({
  format,
  isSelected,
  onSelect,
}: {
  format: MetaFormat
  isSelected: boolean
  onSelect: (format: MetaFormat) => void
}) {
  const aspectRatio = format.width / format.height
  const MAX_W = 44
  const MAX_H = 56
  const previewW = aspectRatio >= 1 ? MAX_W : Math.round(MAX_H * aspectRatio)
  const previewH = aspectRatio >= 1 ? Math.round(MAX_W / aspectRatio) : MAX_H

  return (
    <button
      onClick={() => onSelect(format)}
      aria-pressed={isSelected}
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border-2 p-2 text-center transition-all active:scale-95 sm:p-3',
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
      )}
    >
      <div className="flex h-16 w-14 items-center justify-center">
        <div
          className={cn(
            'rounded border-2',
            isSelected ? 'border-blue-400 bg-blue-100' : 'border-gray-300 bg-gray-100',
          )}
          style={{ width: previewW, height: previewH }}
        />
      </div>
      <div>
        <p className={cn('text-xs font-semibold', isSelected ? 'text-blue-700' : 'text-gray-700')}>
          {format.label}
        </p>
        <p className="text-xs text-gray-400">{format.ratio}</p>
        <p className="mt-0.5 text-xs text-gray-500">{format.useCase}</p>
      </div>
    </button>
  )
}
