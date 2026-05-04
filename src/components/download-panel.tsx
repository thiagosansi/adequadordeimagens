'use client'

import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import { Download, Loader2, AlertTriangle } from 'lucide-react'
import type { MetaFormat, Requirement } from '@/shared/types/image'
import { estimateDataUrlSizeKB } from '@/lib/canvas-renderer'
import { uploadExport } from '@/lib/storage'
import { saveProject } from '@/lib/projects'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Props = {
  processedDataUrl: string
  format: MetaFormat
  originalFileName: string
  requirements?: Requirement[]
}

export function DownloadPanel({ processedDataUrl, format, originalFileName, requirements = [] }: Props) {
  const [isCompressing, setIsCompressing] = useState(false)

  const estimatedKB = estimateDataUrlSizeKB(processedDataUrl)
  const estimatedMB = (estimatedKB / 1024).toFixed(1)

  const failedRequirements = requirements.filter((r) => r.status === 'fail')
  const hasFail = failedRequirements.length > 0

  async function handleDownload() {
    setIsCompressing(true)
    try {
      const res = await fetch(processedDataUrl)
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
    <div
      className={cn(
        'rounded-xl border p-4',
        hasFail ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50',
      )}
    >
      <div className="flex items-center justify-between gap-4">
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
            'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300',
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
    </div>
  )
}
