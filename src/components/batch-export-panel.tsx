'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import { Download, Loader2, PackageOpen, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { getImageFormats, ALL_IMAGE_FORMATS } from '@/lib/format-registry'
import { renderAllFormats, buildExportFileName } from '@/lib/batch-export'
import type { FormatRenderOverride } from '@/lib/batch-export'
import { processImageWithAI } from '@/lib/ai-process-client'
import type { AIMode } from '@/lib/ai-process-client'
import type { AdjustmentMode, BackgroundConfig, MetaFormat, PixelCrop } from '@/shared/types/image'
import type { Platform } from '@/shared/types/platform'
import { InteractiveCropper } from '@/components/interactive-cropper'
import { cn } from '@/lib/utils'

type Props = {
  imageUrl: string
  originalFileName: string
  mode: AdjustmentMode
  backgroundConfig: BackgroundConfig
  interactiveCrop: PixelCrop | null
  aiMode?: AIMode
  platform?: Platform
}

type FormatSettings = {
  useIndividual: boolean
  expanded: boolean
  mode: AdjustmentMode
  backgroundConfig: BackgroundConfig
  interactiveCrop: PixelCrop | null
}

const MODES: { id: AdjustmentMode; label: string }[] = [
  { id: 'auto-crop', label: 'Corte automático' },
  { id: 'face-crop', label: 'Foco no rosto' },
  { id: 'interactive-crop', label: 'Corte manual' },
  { id: 'expand', label: 'Expandir fundo' },
  { id: 'fit-solid', label: 'Cor de fundo' },
  { id: 'fit-blur', label: 'Fundo desfocado' },
]

const PRESET_COLORS = ['#ffffff', '#000000', '#1a1a2e', '#f5f5f5', '#1877f2', '#e8e8e8']

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

export function BatchExportPanel({
  imageUrl,
  originalFileName,
  mode,
  backgroundConfig,
  interactiveCrop,
  aiMode,
  platform = 'meta',
}: Props) {
  const formats = getImageFormats(platform)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [formatSettings, setFormatSettings] = useState<Record<string, FormatSettings>>({})
  const [isExporting, setIsExporting] = useState(false)
  const [isAIExporting, setIsAIExporting] = useState(false)
  const [isAllPlatformsExporting, setIsAllPlatformsExporting] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [aiError, setAIError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  function toggleFormat(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === formats.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(formats.map((f) => f.id)))
    }
  }

  function updateFormatSetting(formatId: string, updates: Partial<FormatSettings>) {
    setFormatSettings((prev) => {
      const current = prev[formatId]
      return {
        ...prev,
        [formatId]: {
          useIndividual: current?.useIndividual ?? false,
          expanded: current?.expanded ?? false,
          mode: current?.mode ?? mode,
          backgroundConfig: current?.backgroundConfig ?? backgroundConfig,
          interactiveCrop: current?.interactiveCrop ?? interactiveCrop,
          ...updates,
        },
      }
    })
  }

  function toggleIndividual(formatId: string) {
    const current = formatSettings[formatId]
    const enabling = !current?.useIndividual
    updateFormatSetting(formatId, {
      useIndividual: enabling,
      expanded: enabling,
      mode: current?.mode ?? mode,
      backgroundConfig: current?.backgroundConfig ?? backgroundConfig,
      interactiveCrop: current?.interactiveCrop ?? interactiveCrop,
    })
  }

  function buildOverrides(selectedFormats: MetaFormat[]): Record<string, FormatRenderOverride> {
    const overrides: Record<string, FormatRenderOverride> = {}
    for (const format of selectedFormats) {
      const fs = formatSettings[format.id]
      if (fs?.useIndividual) {
        overrides[format.id] = {
          mode: fs.mode,
          backgroundConfig: fs.backgroundConfig,
          interactiveCrop: fs.interactiveCrop,
        }
      }
    }
    return overrides
  }

  async function handleAIBatchExport() {
    if (selectedIds.size === 0 || !aiMode) return
    setIsAIExporting(true)
    setAIError(null)
    try {
      const selectedFormats = formats.filter((f) => selectedIds.has(f.id))
      const dataUrl = await blobUrlToDataUrl(imageUrl)
      const zip = new JSZip()

      for (let i = 0; i < selectedFormats.length; i++) {
        const format = selectedFormats[i]!
        setProgress('IA: ' + format.label + ' (' + (i + 1) + '/' + selectedFormats.length + ')...')
        const result = await processImageWithAI(dataUrl, format.width, format.height, aiMode)
        if (!result.ok) throw new Error(result.error)
        const base64 = result.dataUrl.split(',')[1]!
        zip.file(buildExportFileName(originalFileName, format), base64, { base64: true })
      }

      setProgress('Criando arquivo .zip...')
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
      const baseName = originalFileName.replace(/\.[^.]+$/, '')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = baseName + '_meta-ads-ai.zip'
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setAIError(err instanceof Error ? err.message : 'Erro ao exportar com IA')
    } finally {
      setIsAIExporting(false)
      setProgress(null)
    }
  }

  async function handleBatchExport() {
    if (selectedIds.size === 0) return
    setIsExporting(true)
    setExportError(null)
    setProgress('Preparando...')

    try {
      const selectedFormats = formats.filter((f) => selectedIds.has(f.id))
      setProgress('Processando formatos...')

      const results = await renderAllFormats({
        imageUrl,
        formats: selectedFormats,
        mode,
        backgroundConfig,
        interactiveCrop,
        overrides: buildOverrides(selectedFormats),
      })

      setProgress('Criando arquivo .zip...')
      const zip = new JSZip()

      for (const { format, dataUrl } of results) {
        const base64 = dataUrl.split(',')[1]!
        const fileName = buildExportFileName(originalFileName, format)
        zip.file(fileName, base64, { base64: true })
      }

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
      const baseName = originalFileName.replace(/\.[^.]+$/, '')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = baseName + '_meta-ads.zip'
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Erro ao exportar formatos')
    } finally {
      setIsExporting(false)
      setProgress(null)
    }
  }

  async function handleAllPlatformsExport() {
    setIsAllPlatformsExporting(true)
    setProgress('Preparando...')
    try {
      const zip = new JSZip()
      const byPlatform = ALL_IMAGE_FORMATS.reduce<Record<string, typeof ALL_IMAGE_FORMATS>>((acc, f) => {
        ;(acc[f.platform] ??= []).push(f)
        return acc
      }, {})

      const platformEntries = Object.entries(byPlatform)
      let processed = 0
      const total = ALL_IMAGE_FORMATS.length

      for (const [plt, platformFormats] of platformEntries) {
        const results = await renderAllFormats({
          imageUrl,
          formats: platformFormats,
          mode,
          backgroundConfig,
          interactiveCrop,
        })
        for (const { format, dataUrl } of results) {
          const base64 = dataUrl.split(',')[1]!
          zip.file(`${plt}/${buildExportFileName(originalFileName, format)}`, base64, { base64: true })
          processed++
          setProgress(`${plt} — ${format.label} (${processed}/${total})`)
        }
      }

      setProgress('Criando arquivo .zip...')
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
      const baseName = originalFileName.replace(/\.[^.]+$/, '')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${baseName}_todas-plataformas.zip`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsAllPlatformsExporting(false)
      setProgress(null)
    }
  }

  const allSelected = selectedIds.size === formats.length
  const count = selectedIds.size
  const buttonLabel = count > 0
    ? 'Baixar ' + count + (count > 1 ? ' formatos' : ' formato') + ' (.zip)'
    : 'Baixar formatos (.zip)'

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <PackageOpen className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Exportar múltiplos formatos
          </span>
          {count > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {count} selecionado{count > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">Selecione os formatos para baixar em .zip</p>
            <button
              onClick={toggleAll}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
          </div>

          <div className="mb-4 space-y-2">
            {formats.map((format) => {
              const fs = formatSettings[format.id]
              const isSelected = selectedIds.has(format.id)

              return (
                <div
                  key={format.id}
                  className={cn(
                    'rounded-lg border transition-colors',
                    isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200',
                  )}
                >
                  {/* Row */}
                  <div className="flex items-center gap-2.5 p-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFormat(format.id)}
                      className="h-4 w-4 flex-shrink-0 cursor-pointer accent-blue-600"
                    />

                    {/* Thumbnail — correct aspect ratio per format + mode preview via CSS */}
                    {(() => {
                      const activeMode = isSelected && fs?.useIndividual ? fs.mode : undefined
                      const isFit = activeMode === 'fit-solid' || activeMode === 'fit-blur' || activeMode === 'expand'
                      // Each format gets its own proportional thumbnail width
                      const thumbH = 48
                      const thumbW = Math.max(24, Math.min(80, Math.round(thumbH * format.width / format.height)))
                      return (
                        <div
                          className="relative flex-shrink-0 cursor-pointer overflow-hidden rounded"
                          style={{
                            width: thumbW,
                            height: thumbH,
                            backgroundColor: activeMode === 'fit-solid'
                              ? fs!.backgroundConfig.color
                              : '#f3f4f6',
                          }}
                          onClick={() => toggleFormat(format.id)}
                        >
                          {/* fit-blur: blurred cover behind sharp foreground */}
                          {activeMode === 'fit-blur' && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageUrl}
                              aria-hidden
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                              style={{ filter: 'blur(4px) brightness(0.65)' }}
                            />
                          )}
                          {/* expand: mirrored/flipped image as background fill */}
                          {activeMode === 'expand' && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageUrl}
                              aria-hidden
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                              style={{ transform: 'scaleY(-1)', filter: 'brightness(0.7)' }}
                            />
                          )}
                          {/* Main image: contained for fit modes, cropped for crop modes */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl}
                            alt={format.label}
                            className={cn('relative h-full w-full', isFit ? 'object-contain' : 'object-cover')}
                          />
                        </div>
                      )
                    })()}

                    {/* Info */}
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => toggleFormat(format.id)}
                    >
                      <p className="text-xs font-semibold text-gray-700">{format.label}</p>
                      <p className="text-xs text-gray-400">
                        {format.width}×{format.height} · {format.ratio}
                      </p>
                      {isSelected && fs?.useIndividual && (
                        <p className="text-xs font-medium text-blue-600">
                          {MODES.find((m) => m.id === fs.mode)?.label ?? fs.mode}
                        </p>
                      )}
                    </div>

                    {/* Per-format controls (only when selected) */}
                    {isSelected && (
                      <div className="flex flex-shrink-0 items-center gap-1">
                        <button
                          onClick={() => toggleIndividual(format.id)}
                          className={cn(
                            'rounded-lg border px-2 py-1 text-xs font-medium transition-colors',
                            fs?.useIndividual
                              ? 'border-blue-300 bg-blue-100 text-blue-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300',
                          )}
                        >
                          {fs?.useIndividual ? 'Individual ✓' : 'Personalizar'}
                        </button>
                        {fs?.useIndividual && (
                          <button
                            onClick={() => updateFormatSetting(format.id, { expanded: !fs.expanded })}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {fs.expanded
                              ? <ChevronUp className="h-4 w-4" />
                              : <ChevronDown className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Individual settings panel */}
                  {isSelected && fs?.useIndividual && fs.expanded && (
                    <div className="space-y-3 border-t border-blue-100 p-3">
                      {/* Mode selector */}
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-gray-600">Modo de ajuste</p>
                        <div className="flex flex-wrap gap-1.5">
                          {MODES.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => updateFormatSetting(format.id, { mode: m.id })}
                              className={cn(
                                'rounded border px-2 py-1 text-xs font-medium transition-colors',
                                fs.mode === m.id
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
                      {fs.mode === 'fit-solid' && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() =>
                                updateFormatSetting(format.id, {
                                  backgroundConfig: { type: 'solid', color },
                                })
                              }
                              title={color}
                              className={cn(
                                'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                                fs.backgroundConfig.color === color
                                  ? 'border-blue-500'
                                  : 'border-gray-300',
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          <input
                            type="color"
                            value={fs.backgroundConfig.color}
                            onChange={(e) =>
                              updateFormatSetting(format.id, {
                                backgroundConfig: { type: 'solid', color: e.target.value },
                              })
                            }
                            className="h-6 w-6 cursor-pointer rounded border border-gray-300"
                          />
                        </div>
                      )}

                      {/* Interactive cropper */}
                      {fs.mode === 'interactive-crop' && (
                        <InteractiveCropper
                          imageUrl={imageUrl}
                          format={format}
                          onCropChange={(crop) =>
                            updateFormatSetting(format.id, { interactiveCrop: crop })
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="space-y-2">
            {aiMode && (
              <button
                onClick={handleAIBatchExport}
                disabled={isAIExporting || isExporting || count === 0}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors',
                  isAIExporting || isExporting || count === 0
                    ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                    : 'bg-violet-600 text-white hover:bg-violet-700',
                )}
              >
                {isAIExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {progress ?? 'Exportando com IA...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {count > 0 ? 'Exportar ' + count + ' formato' + (count > 1 ? 's' : '') + ' com IA' : 'Exportar com IA'}
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleBatchExport}
              disabled={isExporting || isAIExporting || count === 0}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors',
                isExporting || isAIExporting || count === 0
                  ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                  : aiMode
                  ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700',
              )}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress ?? 'Exportando...'}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {aiMode ? 'Exportar sem IA' : buttonLabel}
                </>
              )}
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-gray-100" />
              <span className="mx-2 shrink text-[10px] text-gray-400">ou</span>
              <div className="flex-grow border-t border-gray-100" />
            </div>

            <button
              onClick={handleAllPlatformsExport}
              disabled={isAllPlatformsExporting || isExporting || isAIExporting}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-colors',
                isAllPlatformsExporting || isExporting || isAIExporting
                  ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50',
              )}
            >
              {isAllPlatformsExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress ?? 'Exportando...'}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exportar para todas as plataformas (.zip)
                </>
              )}
            </button>

            {exportError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{exportError}</p>
            )}
            {aiError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{aiError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
