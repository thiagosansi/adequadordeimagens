'use client'

import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import { Download, Loader2 } from 'lucide-react'
import type { MetaFormat } from '@/shared/types/image'
import { estimateDataUrlSizeKB } from '@/lib/canvas-renderer'

type Props = {
  processedDataUrl: string
  format: MetaFormat
  originalFileName: string
}

export function DownloadPanel({ processedDataUrl, format, originalFileName }: Props) {
  const [isCompressing, setIsCompressing] = useState(false)

  const estimatedKB = estimateDataUrlSizeKB(processedDataUrl)
  const estimatedMB = (estimatedKB / 1024).toFixed(1)

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
    } finally {
      setIsCompressing(false)
    }
  }

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">Pronto para download</p>
          <p className="text-xs text-gray-500">
            {format.width}×{format.height} px · {format.ratio} · {format.label} · ~{estimatedMB} MB
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={isCompressing}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isCompressing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Comprimindo...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Baixar imagem
            </>
          )}
        </button>
      </div>
    </div>
  )
}
