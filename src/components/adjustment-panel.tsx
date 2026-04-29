'use client'

import type { AdjustmentMode, MetaFormat, BackgroundConfig, PixelCrop } from '@/shared/types/image'
import { InteractiveCropper } from './interactive-cropper'
import { cn } from '@/lib/utils'
import { Loader2, Sparkles } from 'lucide-react'

type Props = {
  imageUrl: string
  format: MetaFormat
  mode: AdjustmentMode
  backgroundConfig: BackgroundConfig
  onModeChange: (mode: AdjustmentMode) => void
  onBackgroundChange: (config: BackgroundConfig) => void
  onInteractiveCropChange: (crop: PixelCrop) => void
  onApply: () => void
  isProcessing: boolean
  onAIApply?: () => Promise<void>
  isAIProcessing?: boolean
}

const AI_LABELS: Partial<Record<AdjustmentMode, string>> = {
  'auto-crop': 'Recorte inteligente',
  'expand': 'Expandir com IA',
}

const MODES: { id: AdjustmentMode; label: string; description: string }[] = [
  { id: 'auto-crop', label: 'Corte automático', description: 'Centraliza e corta sem distorcer' },
  { id: 'interactive-crop', label: 'Corte manual', description: 'Você define a área de recorte' },
  { id: 'expand', label: 'Expandir fundo', description: 'Expande o fundo sem cortar o sujeito' },
  { id: 'fit-solid', label: 'Cor de fundo', description: 'Imagem inteira + fundo colorido' },
  { id: 'fit-blur', label: 'Fundo desfocado', description: 'Imagem inteira + fundo borrado' },
]

const PRESET_COLORS = ['#ffffff', '#000000', '#1a1a2e', '#f5f5f5', '#1877f2', '#e8e8e8']

export function AdjustmentPanel({
  imageUrl,
  format,
  mode,
  backgroundConfig,
  onModeChange,
  onBackgroundChange,
  onInteractiveCropChange,
  onApply,
  isProcessing,
  onAIApply,
  isAIProcessing = false,
}: Props) {
  const aiLabel = AI_LABELS[mode]
  const anyProcessing = isProcessing || isAIProcessing
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Modo de ajuste
      </h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={cn(
              'rounded-lg border-2 p-3 text-left transition-all',
              mode === m.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300',
            )}
          >
            <p className={cn('text-xs font-semibold', mode === m.id ? 'text-blue-700' : 'text-gray-700')}>
              {m.label}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">{m.description}</p>
          </button>
        ))}
      </div>

      {mode === 'fit-solid' && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-3 text-xs font-semibold text-gray-700">Cor de fundo</p>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onBackgroundChange({ type: 'solid', color })}
                title={color}
                className={cn(
                  'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                  backgroundConfig.color === color
                    ? 'border-blue-500 scale-110'
                    : 'border-gray-300',
                )}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={backgroundConfig.color}
              onChange={(e) => onBackgroundChange({ type: 'solid', color: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded border border-gray-300"
              title="Cor personalizada"
            />
          </div>
        </div>
      )}

      {mode === 'interactive-crop' && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-3 text-xs font-semibold text-gray-700">
            Arraste para definir a área de recorte
          </p>
          <InteractiveCropper
            imageUrl={imageUrl}
            format={format}
            onCropChange={onInteractiveCropChange}
          />
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={onApply}
          disabled={anyProcessing}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors',
            anyProcessing
              ? 'cursor-not-allowed bg-gray-200 text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            'Aplicar ajuste'
          )}
        </button>

        {aiLabel && onAIApply && (
          <button
            onClick={onAIApply}
            disabled={anyProcessing}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors',
              anyProcessing
                ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                : 'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800',
            )}
          >
            {isAIProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando com IA...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {aiLabel}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
