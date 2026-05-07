'use client'

import type { Platform } from '@/shared/types/platform'
import { PLATFORMS } from '@/shared/types/platform'
import { cn } from '@/lib/utils'

type Props = {
  selected: Platform
  onChange: (platform: Platform) => void
  available?: Platform[]
}

export function PlatformSelector({ selected, onChange, available }: Props) {
  const platforms = available
    ? PLATFORMS.filter((p) => available.includes(p.id))
    : PLATFORMS

  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Plataforma
      </p>
      <div className="flex flex-wrap gap-2">
        {platforms.map((p) => {
          const isSelected = selected === p.id
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.id)}
              className={cn(
                'rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition-all',
                isSelected
                  ? `${p.borderColor} ${p.color} ${p.textColor}`
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700',
              )}
            >
              {p.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
