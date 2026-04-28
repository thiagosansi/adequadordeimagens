'use client'

import { useState } from 'react'
import type { MetaFormat } from '@/shared/types/image'
import { cn } from '@/lib/utils'

type Props = {
  originalUrl: string
  processedUrl: string
  format: MetaFormat
}

export function PreviewPanel({ originalUrl, processedUrl, format }: Props) {
  const [view, setView] = useState<'processed' | 'original'>('processed')

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Preview</h2>
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
          <button
            onClick={() => setView('processed')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              view === 'processed' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900',
            )}
          >
            Ajustada
          </button>
          <button
            onClick={() => setView('original')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              view === 'original' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900',
            )}
          >
            Original
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        {view === 'processed' ? (
          <div className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={processedUrl}
              alt="Imagem ajustada"
              className="max-h-96 max-w-full object-contain"
            />
            <div className="w-full border-t border-gray-200 bg-white px-4 py-2 text-center">
              <p className="text-xs text-gray-500">
                {format.label} · {format.width}×{format.height} px · {format.ratio}
              </p>
            </div>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={originalUrl}
            alt="Imagem original"
            className="max-h-96 max-w-full object-contain"
          />
        )}
      </div>
    </div>
  )
}
