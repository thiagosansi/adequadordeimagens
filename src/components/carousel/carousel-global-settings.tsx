'use client'

import type { AdjustmentMode, BackgroundConfig } from '@/shared/types/image'
import type { CarouselFormatId } from '@/shared/types/carousel'
import { cn } from '@/lib/utils'

type Props = {
  formatId: CarouselFormatId
  mode: AdjustmentMode | null
  backgroundConfig: BackgroundConfig
  onFormatChange: (id: CarouselFormatId) => void
  onModeChange: (mode: AdjustmentMode) => void
  onBackgroundChange: (config: BackgroundConfig) => void
}

const FORMATS: { id: CarouselFormatId; label: string; ratio: string; dimensions: string }[] = [
  { id: 'meta-feed-square', label: 'Quadrado', ratio: '1:1', dimensions: '1080×1080' },
  { id: 'meta-feed-portrait', label: 'Retrato', ratio: '4:5', dimensions: '1080×1350' },
]

const MODES: { id: AdjustmentMode; label: string }[] = [
  { id: 'auto-crop', label: 'Corte automático' },
  { id: 'face-crop', label: 'Foco no rosto' },
  { id: 'expand', label: 'Expandir fundo' },
  { id: 'fit-solid', label: 'Cor de fundo' },
  { id: 'fit-blur', label: 'Fundo desfocado' },
  { id: 'interactive-crop', label: 'Corte manual*' },
]

const PRESET_COLORS = ['#ffffff', '#000000', '#1a1a2e', '#f5f5f5', '#1877f2', '#e8e8e8']

export function CarouselGlobalSettings({
  formatId,
  mode,
  backgroundConfig,
  onFormatChange,
  onModeChange,
  onBackgroundChange,
}: Props) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
      {/* Format */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Formato</p>
        <div className="flex gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => onFormatChange(f.id)}
              className={cn(
                'flex-1 rounded-lg border-2 py-2 text-center transition-all',
                formatId === f.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300',
              )}
            >
              <p className={cn('text-xs font-semibold', formatId === f.id ? 'text-blue-700' : 'text-gray-700')}>
                {f.label}
              </p>
              <p className="text-xs text-gray-400">{f.ratio} · {f.dimensions}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Global adjustment mode */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Ajuste global
        </p>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                mode === m.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        {!mode && (
          <p className="mt-1.5 text-xs text-gray-400">Selecione um modo para aplicar a todos os cards.</p>
        )}
        {mode === 'interactive-crop' && (
          <p className="mt-1.5 text-xs text-amber-600">
            * Corte manual global usa auto-crop como base. Personalize cada card individualmente para definir o recorte.
          </p>
        )}
      </div>

      {/* Background color picker (for fit-solid) */}
      {mode === 'fit-solid' && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Cor de fundo</p>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onBackgroundChange({ type: 'solid', color })}
                title={color}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                  backgroundConfig.color === color ? 'border-blue-500 scale-110' : 'border-gray-300',
                )}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={backgroundConfig.color}
              onChange={(e) => onBackgroundChange({ type: 'solid', color: e.target.value })}
              className="h-7 w-7 cursor-pointer rounded border border-gray-300"
              title="Cor personalizada"
            />
          </div>
        </div>
      )}
    </div>
  )
}
