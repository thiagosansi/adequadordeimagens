'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import JSZip from 'jszip'
import {
  Upload, X, Download, Loader2, Images, Eye, RefreshCw, Sparkles, Settings2,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { getImageFormats, ALL_IMAGE_FORMATS } from '@/lib/format-registry'
import { renderAllFormats, buildExportFileName } from '@/lib/batch-export'
import { processImageWithAI } from '@/lib/ai-process-client'
import type { AIMode } from '@/lib/ai-process-client'
import { PlatformSelector } from '@/components/platform-selector'
import { InteractiveCropper } from '@/components/interactive-cropper'
import { PLATFORMS } from '@/shared/types/platform'
import { cn } from '@/lib/utils'
import type { Platform } from '@/shared/types/platform'
import type { AdjustmentMode, BackgroundConfig, PixelCrop } from '@/shared/types/image'

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

type QueueItem = {
  id: string
  file: File
  url: string
  useIndividualSettings: boolean
  individualMode: AdjustmentMode
  individualBgColor: string
  interactiveCrop: PixelCrop | null
}

const IMAGE_PLATFORMS: Platform[] = ['meta', 'tiktok', 'google', 'linkedin']

const MODES: { id: AdjustmentMode; label: string }[] = [
  { id: 'auto-crop',        label: 'Corte automático' },
  { id: 'face-crop',        label: 'Foco no rosto' },
  { id: 'interactive-crop', label: 'Corte manual' },
  { id: 'fit-solid',        label: 'Fundo sólido' },
  { id: 'fit-blur',         label: 'Fundo desfocado' },
  { id: 'expand',           label: 'Espelhar bordas' },
]

function cropHash(crop: PixelCrop | null) {
  if (!crop) return 'none'
  return `${crop.x}x${crop.y}x${crop.width}x${crop.height}`
}

// Cache key: one rendered image per (item × format × settings)
function previewCacheKey(
  itemId: string,
  formatId: string,
  mode: AdjustmentMode | null,
  bgColor: string,
  useAI: boolean,
  crop: PixelCrop | null,
) {
  return `${itemId}__${formatId}__${mode}__${bgColor}__${useAI ? 'ai' : 'local'}__${cropHash(crop)}`
}

export function BatchSection() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [platform, setPlatform] = useState<Platform>('meta')
  const [selectedFormatIds, setSelectedFormatIds] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<AdjustmentMode | null>(null)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [useAI, setUseAI] = useState(false)
  const [allPlatforms, setAllPlatforms] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number; label: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Preview state
  const [previewImageIdx, setPreviewImageIdx] = useState(0)
  const [previewPlatform, setPreviewPlatform] = useState<Platform>('meta')
  const [previewFormatId, setPreviewFormatId] = useState<string | null>(null)
  // Flat cache: previewCacheKey → dataUrl
  const [previewCache, setPreviewCache] = useState<Map<string, string>>(new Map())
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  // Lightbox
  const [lightboxItemId, setLightboxItemId] = useState<string | null>(null)

  const formats = getImageFormats(platform)
  const allSelected = selectedFormatIds.size === formats.length

  // ── Effective settings helpers ────────────────────────────────────────────

  function getEffectiveMode(item: QueueItem): AdjustmentMode | null {
    return item.useIndividualSettings ? item.individualMode : mode
  }

  function getEffectiveBgColor(item: QueueItem): string {
    return item.useIndividualSettings ? item.individualBgColor : bgColor
  }

  // ── Preview format resolution ─────────────────────────────────────────────

  // Which formats to show as tabs in the preview panel
  const previewFormats = allPlatforms
    ? getImageFormats(previewPlatform)
    : formats.filter((f) => selectedFormatIds.has(f.id))

  // Active format: keep current selection if still valid, else fall back to first
  const activePreviewFormatId =
    previewFormatId && previewFormats.find((f) => f.id === previewFormatId)
      ? previewFormatId
      : (previewFormats[0]?.id ?? null)
  const activePreviewFormat = previewFormats.find((f) => f.id === activePreviewFormatId) ?? null

  // Lightbox: items that have a cached preview for the active format
  const lightboxItems = activePreviewFormat
    ? queue.filter((item) => {
        const key = previewCacheKey(
          item.id, activePreviewFormat.id, getEffectiveMode(item), getEffectiveBgColor(item), useAI, item.interactiveCrop,
        )
        return previewCache.has(key)
      })
    : []
  const lightboxIdx = lightboxItemId !== null ? lightboxItems.findIndex((i) => i.id === lightboxItemId) : -1

  const closeLightbox = useCallback(() => setLightboxItemId(null), [])

  const lightboxGoTo = useCallback(
    (delta: number) => {
      setLightboxItemId((prevId) => {
        if (prevId === null) return null
        const idx = lightboxItems.findIndex((i) => i.id === prevId)
        return lightboxItems[(idx + delta + lightboxItems.length) % lightboxItems.length]?.id ?? null
      })
    },
    [lightboxItems],
  )

  useEffect(() => {
    if (lightboxItemId === null) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') lightboxGoTo(1)
      if (e.key === 'ArrowLeft') lightboxGoTo(-1)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [lightboxItemId, closeLightbox, lightboxGoTo])

  // Whether all queue items are cached for a given format
  function isFormatFullyCached(formatId: string): boolean {
    return queue.length > 0 && queue.every((item) => {
      const key = previewCacheKey(
        item.id, formatId, getEffectiveMode(item), getEffectiveBgColor(item), useAI, item.interactiveCrop,
      )
      return previewCache.has(key)
    })
  }

  // ── Queue management ──────────────────────────────────────────────────────

  function addFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const newItems: QueueItem[] = imageFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      useIndividualSettings: false,
      individualMode: 'auto-crop',
      individualBgColor: '#ffffff',
      interactiveCrop: null,
    }))
    setQueue((prev) => [...prev, ...newItems])
  }

  function removeItem(id: string) {
    setQueue((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) URL.revokeObjectURL(item.url)
      return prev.filter((i) => i.id !== id)
    })
    setPreviewImageIdx((prev) => Math.max(0, prev - 1))
    // Invalidate cache for this item
    setPreviewCache((prev) => {
      const next = new Map(prev)
      for (const key of next.keys()) {
        if (key.startsWith(id + '__')) next.delete(key)
      }
      return next
    })
  }

  function clearQueue() {
    queue.forEach((i) => URL.revokeObjectURL(i.url))
    setQueue([])
    setPreviewImageIdx(0)
    setPreviewCache(new Map())
  }

  function updateItem(id: string, updates: Partial<Omit<QueueItem, 'id' | 'file' | 'url'>>) {
    setQueue((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item))
    setPreviewCache((prev) => {
      const next = new Map(prev)
      for (const key of next.keys()) {
        if (key.startsWith(id + '__')) next.delete(key)
      }
      return next
    })
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  function handlePlatformChange(p: Platform) {
    setPlatform(p)
    setSelectedFormatIds(new Set())
  }

  function toggleFormat(id: string) {
    setSelectedFormatIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllFormats() {
    if (allSelected) {
      setSelectedFormatIds(new Set())
    } else {
      setSelectedFormatIds(new Set(formats.map((f) => f.id)))
    }
  }

  // ── Preview generation ────────────────────────────────────────────────────

  const currentPreviewItem = queue[previewImageIdx] ?? null
  const effectivePreviewMode    = currentPreviewItem ? getEffectiveMode(currentPreviewItem) : mode
  const cropRefFormat = formats[0] ?? previewFormats[0] ?? null

  async function generatePreview(forceRefresh = false) {
    if (!activePreviewFormat || isPreviewLoading || queue.length === 0) return
    setIsPreviewLoading(true)
    try {
      for (const item of queue) {
        const itemMode    = getEffectiveMode(item)
        if (itemMode === null) continue
        const itemBgColor = getEffectiveBgColor(item)
        const itemCrop    = item.interactiveCrop
        const key = previewCacheKey(item.id, activePreviewFormat.id, itemMode, itemBgColor, useAI, itemCrop)
        if (previewCache.has(key) && !forceRefresh) continue

        if (useAI) {
          const dataUrl  = await fileToDataUrl(item.file)
          const aiMode: AIMode = itemMode === 'expand' ? 'generative-fill' : 'smart-crop'
          const result   = await processImageWithAI(dataUrl, activePreviewFormat.width, activePreviewFormat.height, aiMode)
          if (!result.ok) throw new Error(result.error)
          setPreviewCache((prev) => new Map(prev).set(key, result.dataUrl))
        } else {
          const backgroundConfig: BackgroundConfig = { type: 'solid', color: itemBgColor }
          const results = await renderAllFormats({
            imageUrl: item.url,
            formats: [activePreviewFormat],
            mode: itemMode,
            backgroundConfig,
            interactiveCrop: itemCrop,
          })
          if (results[0]) {
            setPreviewCache((prev) => new Map(prev).set(key, results[0]!.dataUrl))
          }
        }
      }
    } finally {
      setIsPreviewLoading(false)
    }
  }

  // Ref always points to the latest generatePreview (avoids stale closures in effects)
  const generatePreviewRef = useRef(generatePreview)
  generatePreviewRef.current = generatePreview

  // Key combining all settings that should trigger an auto-preview
  const queueSettingsKey = queue
    .map((i) =>
      `${i.id}|${i.useIndividualSettings}|${i.individualMode}|${i.individualBgColor}|${cropHash(i.interactiveCrop)}`,
    )
    .join(',')

  // Auto-generate preview with 400 ms debounce whenever relevant state changes
  useEffect(() => {
    if (queue.length === 0 || !activePreviewFormatId) return
    const timer = setTimeout(() => { generatePreviewRef.current() }, 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueSettingsKey, activePreviewFormatId, mode, bgColor, useAI, allPlatforms ? previewPlatform : 'n'])

  // ── Export ────────────────────────────────────────────────────────────────

  const selectedFormats = formats.filter((f) => selectedFormatIds.has(f.id))
  const activeFormats   = allPlatforms ? ALL_IMAGE_FORMATS : selectedFormats
  const totalFiles      = queue.length * activeFormats.length
  const allItemsHaveMode = queue.length > 0 && queue.every((item) => getEffectiveMode(item) !== null)
  const canExport       = queue.length > 0 && (allPlatforms || selectedFormats.length > 0) && allItemsHaveMode

  async function handleExport() {
    if (!canExport) return
    setIsExporting(true)

    const zip = new JSZip()
    let processed = 0
    const total = totalFiles

    try {
      for (const item of queue) {
        const folderName      = item.file.name.replace(/\.[^.]+$/, '')
        const itemMode        = getEffectiveMode(item)
        if (itemMode === null) continue
        const itemBgColor     = getEffectiveBgColor(item)
        const itemCrop        = item.interactiveCrop
        const backgroundConfig: BackgroundConfig = { type: 'solid', color: itemBgColor }
        const aiMode: AIMode  = itemMode === 'expand' ? 'generative-fill' : 'smart-crop'
        const itemDataUrl     = useAI ? await fileToDataUrl(item.file) : null

        const formatGroups: Array<{ path: string; formats: typeof ALL_IMAGE_FORMATS }> = allPlatforms
          ? Object.entries(
              ALL_IMAGE_FORMATS.reduce<Record<string, typeof ALL_IMAGE_FORMATS>>((acc, f) => {
                ;(acc[f.platform] ??= []).push(f)
                return acc
              }, {}),
            ).map(([plt, fmts]) => ({ path: `${folderName}/${plt}`, formats: fmts }))
          : [{ path: folderName, formats: selectedFormats }]

        for (const group of formatGroups) {
          if (useAI) {
            for (const format of group.formats) {
              setProgress({ current: processed, total, label: `${item.file.name} → IA: ${format.label}` })
              const aiResult = await processImageWithAI(itemDataUrl!, format.width, format.height, aiMode)
              if (!aiResult.ok) throw new Error(aiResult.error)
              zip.file(`${group.path}/${buildExportFileName(item.file.name, format)}`, aiResult.dataUrl.split(',')[1]!, { base64: true })
              processed++
              setProgress({ current: processed, total, label: `${item.file.name} → IA: ${format.label}` })
            }
          } else {
            const results = await renderAllFormats({
              imageUrl: item.url,
              formats: group.formats,
              mode: itemMode,
              backgroundConfig,
              interactiveCrop: itemCrop,
            })
            for (const { format, dataUrl } of results) {
              zip.file(`${group.path}/${buildExportFileName(item.file.name, format)}`, dataUrl.split(',')[1]!, { base64: true })
              processed++
              setProgress({ current: processed, total, label: `${item.file.name} → ${format.label}` })
            }
          }
        }
      }

      setProgress({ current: total, total, label: 'Gerando .zip...' })
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href  = url
      link.download = allPlatforms
        ? `batch_todas-plataformas_${Date.now()}.zip`
        : `batch_${platform}_${Date.now()}.zip`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
      setProgress(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors',
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
          <Images className="h-6 w-6 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">Arraste imagens aqui ou clique para selecionar</p>
          <p className="mt-0.5 text-xs text-gray-400">JPG, PNG, WebP — múltiplos arquivos</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Image queue */}
      {queue.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {queue.length} imagem{queue.length > 1 ? 'ns' : ''} na fila
            </span>
            <button onClick={clearQueue} className="text-xs text-gray-400 underline hover:text-gray-600">
              Limpar tudo
            </button>
          </div>
          <div className="flex flex-wrap gap-3 p-4">
            {queue.map((item, idx) => (
              <div key={item.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.file.name}
                  onClick={() => setPreviewImageIdx(idx)}
                  className={cn(
                    'h-20 w-20 cursor-pointer rounded-lg border-2 object-cover transition-all',
                    previewImageIdx === idx
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300',
                  )}
                />
                {item.useIndividualSettings && (
                  <div className="absolute left-1 top-1 rounded-full bg-blue-600 p-0.5">
                    <Settings2 className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-white hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="mt-1 w-20 truncate text-center text-[10px] text-gray-400">{item.file.name}</p>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-300 hover:border-gray-300 hover:text-gray-400"
            >
              <Upload className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Configurações de exportação
          </p>
          <button
            onClick={() => { setAllPlatforms((v) => !v); setSelectedFormatIds(new Set()) }}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
              allPlatforms
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700',
            )}
          >
            Todas as plataformas
          </button>
        </div>

        {allPlatforms ? (
          <div className="rounded-lg bg-blue-50 px-4 py-3">
            <p className="text-xs font-medium text-blue-700">
              {ALL_IMAGE_FORMATS.length} formatos em 4 plataformas (Meta, TikTok, Google Ads, LinkedIn)
            </p>
            <p className="mt-0.5 text-[10px] text-blue-500">
              O ZIP será organizado com uma pasta por plataforma dentro de cada imagem.
            </p>
          </div>
        ) : (
          <>
            <PlatformSelector selected={platform} onChange={handlePlatformChange} available={IMAGE_PLATFORMS} />
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">Formatos</p>
                <button onClick={toggleAllFormats} className="text-xs font-medium text-blue-600 hover:text-blue-800">
                  {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {formats.map((format) => (
                  <label
                    key={format.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors',
                      selectedFormatIds.has(format.id)
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFormatIds.has(format.id)}
                      onChange={() => toggleFormat(format.id)}
                      className="h-3.5 w-3.5 accent-blue-600"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700">{format.label}</p>
                      <p className="text-[10px] text-gray-400">{format.width}×{format.height} · {format.ratio}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">Ajuste padrão</p>
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                  mode === m.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          {!mode && (
            <p className="mt-1.5 text-xs text-gray-400">Selecione um modo para aplicar a todas as imagens.</p>
          )}
          <div className="mt-3">
            <button
              onClick={() => setUseAI((v) => !v)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                useAI
                  ? 'border-violet-500 bg-violet-600 text-white'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700',
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {useAI ? 'IA ativada' : 'Ajustar com IA'}
            </button>
            {useAI && (
              <p className="mt-1.5 text-[10px] text-gray-400">
                {mode === 'expand' ? 'Modo: preenchimento generativo (gen_fill)' : 'Modo: recorte inteligente (smart-crop)'} — processado via Cloudinary.
              </p>
            )}
          </div>
        </div>

        {mode === 'fit-solid' && (
          <div className="flex items-center gap-3">
            <p className="text-xs font-medium text-gray-500">Cor do fundo padrão</p>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-gray-200"
            />
            <span className="text-xs font-mono text-gray-400">{bgColor}</span>
          </div>
        )}
      </div>

      {/* Preview section */}
      {queue.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Visualização prévia
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isPreviewLoading && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Gerando...
                </span>
              )}
              {activePreviewFormat && !isPreviewLoading && (
                <button
                  onClick={() => generatePreview(true)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"
                >
                  <RefreshCw className="h-3 w-3" />
                  Atualizar
                </button>
              )}
            </div>
          </div>

          {/* Per-image individual settings */}
          {currentPreviewItem && (
            <div className="border-b border-gray-100 px-4 py-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium text-gray-700 max-w-[220px]">
                  {currentPreviewItem.file.name}
                </p>
                <button
                  onClick={() => updateItem(currentPreviewItem.id, {
                    useIndividualSettings: !currentPreviewItem.useIndividualSettings,
                  })}
                  className={cn(
                    'shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                    currentPreviewItem.useIndividualSettings
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300',
                  )}
                >
                  {currentPreviewItem.useIndividualSettings ? 'Individual ✓' : 'Personalizar'}
                </button>
              </div>

              {currentPreviewItem.useIndividualSettings && (
                <div className="space-y-3 pt-1">
                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                      Ajuste desta imagem
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {MODES.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => updateItem(currentPreviewItem.id, { individualMode: m.id })}
                          className={cn(
                            'rounded border px-2.5 py-1 text-xs font-medium transition-colors',
                            currentPreviewItem.individualMode === m.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300',
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {currentPreviewItem.individualMode === 'fit-solid' && (
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-medium text-gray-500">Cor do fundo</p>
                      <input
                        type="color"
                        value={currentPreviewItem.individualBgColor}
                        onChange={(e) => updateItem(currentPreviewItem.id, { individualBgColor: e.target.value })}
                        className="h-8 w-12 cursor-pointer rounded border border-gray-200"
                      />
                      <span className="text-xs font-mono text-gray-400">{currentPreviewItem.individualBgColor}</span>
                    </div>
                  )}
                </div>
              )}

              {effectivePreviewMode === 'interactive-crop' && cropRefFormat && (
                <div className="pt-1">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    Corte manual — arraste para ajustar
                  </p>
                  <InteractiveCropper
                    key={currentPreviewItem.id}
                    imageUrl={currentPreviewItem.url}
                    format={cropRefFormat}
                    onCropChange={(crop) => updateItem(currentPreviewItem.id, { interactiveCrop: crop })}
                  />
                </div>
              )}
            </div>
          )}

          {/* Platform tabs — only when allPlatforms */}
          {allPlatforms && (
            <div className="flex overflow-x-auto border-b border-gray-100">
              {IMAGE_PLATFORMS.map((plt) => {
                const meta = PLATFORMS.find((p) => p.id === plt)!
                return (
                  <button
                    key={plt}
                    onClick={() => { setPreviewPlatform(plt); setPreviewFormatId(null) }}
                    className={cn(
                      'whitespace-nowrap px-4 py-2.5 text-xs font-medium transition-colors',
                      previewPlatform === plt
                        ? 'border-b-2 border-blue-600 text-blue-700'
                        : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700',
                    )}
                  >
                    {meta.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Format tabs — only selected formats (or formats of selected platform) */}
          {previewFormats.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-gray-400">
                Selecione ao menos um formato nas configurações para visualizar o preview.
              </p>
            </div>
          ) : (
            <>
              {previewFormats.length > 1 && (
                <div className="flex overflow-x-auto border-b border-gray-100">
                  {previewFormats.map((format) => {
                    const cached = isFormatFullyCached(format.id)
                    return (
                      <button
                        key={format.id}
                        onClick={() => setPreviewFormatId(format.id)}
                        className={cn(
                          'flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-xs font-medium transition-colors',
                          activePreviewFormatId === format.id
                            ? 'border-b-2 border-blue-600 text-blue-700'
                            : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700',
                        )}
                      >
                        {format.label}
                        {cached && <span className="h-1.5 w-1.5 rounded-full bg-green-400" />}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Horizontal image carousel */}
              {activePreviewFormat && (
                <div className="p-4">
                  {previewFormats.length === 1 && (
                    <p className="mb-3 text-xs font-medium text-gray-500">
                      {activePreviewFormat.label} · {activePreviewFormat.width}×{activePreviewFormat.height} · {activePreviewFormat.ratio}
                    </p>
                  )}
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {queue.map((item, idx) => {
                      const key = previewCacheKey(
                        item.id, activePreviewFormat.id,
                        getEffectiveMode(item), getEffectiveBgColor(item),
                        useAI, item.interactiveCrop,
                      )
                      const dataUrl = previewCache.get(key)
                      const isSelected = previewImageIdx === idx
                      const aspectRatio = activePreviewFormat.width / activePreviewFormat.height

                      // Fixed width, height by aspect ratio (cap at 200px height)
                      const thumbW = Math.round(Math.min(160, 200 * aspectRatio))
                      const thumbH = Math.round(thumbW / aspectRatio)

                      return (
                        <div
                          key={item.id}
                          className="shrink-0 cursor-pointer space-y-1"
                          onClick={() => {
                            setPreviewImageIdx(idx)
                            if (dataUrl) setLightboxItemId(item.id)
                          }}
                        >
                          <div
                            className={cn(
                              'overflow-hidden rounded-lg border-2 transition-all',
                              isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300',
                              dataUrl && 'hover:ring-2 hover:ring-blue-400 hover:ring-offset-1',
                            )}
                            style={{ width: thumbW, height: thumbH }}
                          >
                            {dataUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={dataUrl}
                                alt={item.file.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                                {isPreviewLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-300" />
                                )}
                              </div>
                            )}
                          </div>
                          <p className="truncate text-[10px] text-gray-400" style={{ width: thumbW }}>
                            {item.file.name}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Export summary + button */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        {canExport ? (
          <p className="mb-4 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{queue.length}</span> imagem{queue.length > 1 ? 'ns' : ''} ×{' '}
            <span className="font-semibold text-gray-900">{activeFormats.length}</span> formato{activeFormats.length > 1 ? 's' : ''} ={' '}
            <span className="font-semibold text-blue-700">{totalFiles} arquivo{totalFiles > 1 ? 's' : ''}</span>
          </p>
        ) : (
          <p className="mb-4 text-sm text-gray-400">
            {queue.length === 0
              ? 'Adicione imagens à fila para exportar.'
              : !allItemsHaveMode
              ? 'Selecione um modo de ajuste para exportar.'
              : 'Selecione ao menos um formato para exportar.'}
          </p>
        )}

        {progress && (
          <div className="mb-3 space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
              />
            </div>
            <p className="truncate text-xs text-gray-500">
              {progress.current}/{progress.total} — {progress.label}
            </p>
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={!canExport || isExporting}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors',
            canExport && !isExporting
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'cursor-not-allowed bg-gray-200 text-gray-500',
          )}
        >
          {isExporting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Exportando...</>
          ) : (
            <><Download className="h-4 w-4" /> Exportar e baixar .zip</>
          )}
        </button>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== -1 && lightboxItemId !== null && activePreviewFormat && (() => {
        const lightboxItem = lightboxItems[lightboxIdx]!
        const key = previewCacheKey(
          lightboxItem.id, activePreviewFormat.id,
          getEffectiveMode(lightboxItem), getEffectiveBgColor(lightboxItem),
          useAI, lightboxItem.interactiveCrop,
        )
        const dataUrl = previewCache.get(key)!
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-sm text-white">
              {lightboxIdx + 1} / {lightboxItems.length}
            </span>

            {lightboxItems.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); lightboxGoTo(-1) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <div
              className="relative max-h-[85vh] max-w-[85vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dataUrl}
                alt={lightboxItem.file.name}
                className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
              />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                {activePreviewFormat.label} · {activePreviewFormat.width}×{activePreviewFormat.height} · {lightboxItem.file.name}
              </div>
            </div>

            {lightboxItems.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); lightboxGoTo(1) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {lightboxItems.length > 1 && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                {lightboxItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation()
                      setLightboxItemId(lightboxItems[i]!.id)
                    }}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      i === lightboxIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/40',
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
