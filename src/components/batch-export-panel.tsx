'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import { Download, Loader2, PackageOpen } from 'lucide-react'
import { META_FORMATS } from '@/lib/meta-formats'
import { renderAllFormats, buildExportFileName } from '@/lib/batch-export'
import type { AdjustmentMode, BackgroundConfig, PixelCrop } from '@/shared/types/image'
import { cn } from '@/lib/utils'

type Props = {
  imageUrl: string
  originalFileName: string
  mode: AdjustmentMode
  backgroundConfig: BackgroundConfig
  interactiveCrop: PixelCrop | null
}

export function BatchExportPanel({
  imageUrl,
  originalFileName,
  mode,
  backgroundConfig,
  interactiveCrop,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
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

          <button
            onClick={handleBatchExport}
            disabled={isExporting || count === 0}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors',
              isExporting || count === 0
                ? 'cursor-not-allowed bg-gray-200 text-gray-500'
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
                {buttonLabel}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
