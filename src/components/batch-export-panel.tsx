'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import { Download, Loader2, PackageOpen, Sparkles } from 'lucide-react'
import { META_FORMATS } from '@/lib/meta-formats'
import { renderAllFormats, buildExportFileName } from '@/lib/batch-export'
import { processImageWithAI } from '@/lib/actions/cloudinary-ai'
import type { AIMode } from '@/lib/actions/cloudinary-ai'
import type { AdjustmentMode, BackgroundConfig, PixelCrop } from '@/shared/types/image'
import { cn } from '@/lib/utils'

type Props = {
  imageUrl: string
  originalFileName: string
  mode: AdjustmentMode
  backgroundConfig: BackgroundConfig
  interactiveCrop: PixelCrop | null
  aiMode?: AIMode
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

export function BatchExportPanel({
  imageUrl,
  originalFileName,
  mode,
  backgroundConfig,
  interactiveCrop,
  aiMode,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  const [isAIExporting, setIsAIExporting] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
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
    if (selectedIds.size === META_FORMATS.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(META_FORMATS.map((f) => f.id)))
    }
  }

  async function handleAIBatchExport() {
    if (selectedIds.size === 0 || !aiMode) return
    setIsAIExporting(true)
    setAIError(null)
    try {
      const formats = META_FORMATS.filter((f) => selectedIds.has(f.id))
      const dataUrl = await blobUrlToDataUrl(imageUrl)
      const zip = new JSZip()

      for (let i = 0; i < formats.length; i++) {
        const format = formats[i]!
        setProgress('IA: ' + format.label + ' (' + (i + 1) + '/' + formats.length + ')...')
        const result = await processImageWithAI(dataUrl, format.width, format.height, aiMode)
        const base64 = result.split(',')[1]!
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
    setProgress('Preparando...')

    try {
      const formats = META_FORMATS.filter((f) => selectedIds.has(f.id))
      setProgress('Processando formatos...')

      const results = await renderAllFormats({
        imageUrl,
        formats,
        mode,
        backgroundConfig,
        interactiveCrop,
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
    } finally {
      setIsExporting(false)
      setProgress(null)
    }
  }

  const allSelected = selectedIds.size === META_FORMATS.length
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
            {META_FORMATS.map((format) => (
              <label
                key={format.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                  selectedIds.has(format.id)
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300',
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(format.id)}
                  onChange={() => toggleFormat(format.id)}
                  className="h-4 w-4 accent-blue-600"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700">{format.label}</p>
                  <p className="text-xs text-gray-400">
                    {format.width}×{format.height} px · {format.ratio} · {format.useCase}
                  </p>
                </div>
              </label>
            ))}
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

            {aiError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{aiError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
