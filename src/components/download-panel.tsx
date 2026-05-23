'use client'

import { useState } from 'react'
import piexif from 'piexifjs'
import imageCompression from 'browser-image-compression'
import { Download, Loader2, AlertTriangle, ChevronDown, ChevronUp, Tag } from 'lucide-react'
import type { MetaFormat, Requirement } from '@/shared/types/image'
import { estimateDataUrlSizeKB } from '@/lib/canvas-renderer'
import { uploadExport } from '@/lib/storage'
import { saveProject } from '@/lib/projects'
import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { UpgradeModal } from '@/components/upgrade-modal'

type Metadata = {
  description: string
  author: string
  copyright: string
}

type Props = {
  processedDataUrl: string
  format: MetaFormat
  originalFileName: string
  requirements?: Requirement[]
}

function injectExif(dataUrl: string, metadata: Metadata): string {
  // Skip injection when all fields are empty
  if (!metadata.description && !metadata.author && !metadata.copyright) return dataUrl

  try {
    const exifObj: { '0th': Record<number, unknown>; Exif: Record<number, unknown>; GPS: Record<number, unknown> } = { '0th': {}, Exif: {}, GPS: {} }
    if (metadata.description) exifObj['0th']![piexif.ImageIFD.ImageDescription] = metadata.description
    if (metadata.author) exifObj['0th']![piexif.ImageIFD.Artist] = metadata.author
    if (metadata.copyright) exifObj['0th']![piexif.ImageIFD.Copyright] = metadata.copyright
    const exifStr = piexif.dump(exifObj)
    return piexif.insert(exifStr, dataUrl)
  } catch {
    // If EXIF injection fails (non-JPEG, corrupted data), return original
    return dataUrl
  }
}

export function DownloadPanel({ processedDataUrl, format, originalFileName, requirements = [] }: Props) {
  const [isCompressing, setIsCompressing] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const [metadata, setMetadata] = useState<Metadata>({ description: '', author: '', copyright: '' })
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const estimatedKB = estimateDataUrlSizeKB(processedDataUrl)
  const estimatedMB = (estimatedKB / 1024).toFixed(1)

  const failedRequirements = requirements.filter((r) => r.status === 'fail')
  const hasFail = failedRequirements.length > 0
  const hasMetadata = metadata.description || metadata.author || metadata.copyright

  function updateField(field: keyof Metadata, value: string) {
    setMetadata((prev) => ({ ...prev, [field]: value }))
  }

  async function handleDownload() {
    setIsCompressing(true)
    try {
      // Check export quota before triggering the download
      const quotaRes = await fetch('/api/track-export', { method: 'POST' })
      if (quotaRes.status === 429) {
        setShowUpgradeModal(true)
        return
      }

      const dataUrlWithExif = injectExif(processedDataUrl, metadata)
      const res = await fetch(dataUrlWithExif)
      const blob = await res.blob()
      const file = new File([blob], 'output.jpg', { type: 'image/jpeg' })

      let finalBlob: Blob = blob

      // Only compress when file exceeds 25 MB (leaving headroom under 30 MB limit)
      if (file.size > 25 * 1024 * 1024) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 29,
          useWebWorker: true,
        })
        finalBlob = compressed
      }

      const baseName = originalFileName.replace(/\.[^.]+$/, '')
      const fileName = `${baseName}_${format.id}_${format.width}x${format.height}.jpg`

      const url = URL.createObjectURL(finalBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)

      void trackEvent('download_image', {
        format_id: format.id,
        format_label: format.label,
        platform: format.platform,
        width: format.width,
        height: format.height,
      })

      // Save to history (fire-and-forget — não bloqueia o download)
      void (async () => {
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          const storagePath = await uploadExport(user.id, finalBlob, format.id)
          await saveProject({ name: fileName, format, storagePath })
        } catch {
          // Salvar no histórico é não-crítico
        }
      })()
    } finally {
      setIsCompressing(false)
    }
  }

  return (
    <>
      {showUpgradeModal && (
        <UpgradeModal reason="export" onClose={() => setShowUpgradeModal(false)} />
      )}
    <div
      className={cn(
        'rounded-xl border p-4',
        hasFail ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50',
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">
            {hasFail ? 'Imagem com requisitos não atendidos' : 'Pronto para download'}
          </p>
          <p className="text-xs text-gray-500">
            {format.width}×{format.height} px · {format.ratio} · {format.label} · ~{estimatedMB} MB
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={isCompressing}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto sm:py-2',
            hasFail ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700',
          )}
        >
          {isCompressing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Comprimindo...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {hasFail ? 'Baixar mesmo assim' : 'Baixar imagem'}
            </>
          )}
        </button>
      </div>

      {hasFail && (
        <ul className="mt-3 space-y-1 border-t border-amber-200 pt-3">
          {failedRequirements.map((req) => (
            <li key={req.id} className="flex items-start gap-2 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                <strong>{req.label}:</strong> {req.message}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Metadata section */}
      <div className={cn('mt-3 border-t pt-3', hasFail ? 'border-amber-200' : 'border-green-200')}>
        <button
          onClick={() => setShowMetadata((v) => !v)}
          className="flex w-full items-center justify-between text-xs text-gray-500 hover:text-gray-700"
        >
          <span className="flex items-center gap-1.5">
            <Tag className="h-3 w-3" />
            Metadados
            {hasMetadata && (
              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                preenchido
              </span>
            )}
          </span>
          {showMetadata ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showMetadata && (
          <div className="mt-3 space-y-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Descrição</label>
              <input
                type="text"
                value={metadata.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Ex: Campanha verão 2025 — produto X"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Autor / Agência</label>
              <input
                type="text"
                value={metadata.author}
                onChange={(e) => updateField('author', e.target.value)}
                placeholder="Ex: Agência XYZ"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Copyright</label>
              <input
                type="text"
                value={metadata.copyright}
                onChange={(e) => updateField('copyright', e.target.value)}
                placeholder={`© ${new Date().getFullYear()} Empresa`}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-400">
              Metadados incorporados no JPEG via EXIF. Não visíveis ao usuário final, úteis para organização interna.
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
