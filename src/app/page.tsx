'use client'

import { useState, useCallback } from 'react'
import type {
  MetaFormat,
  AdjustmentMode,
  BackgroundConfig,
  PixelCrop,
  Requirement,
} from '@/shared/types/image'
import { validateRequirements } from '@/lib/requirements-validator'
import {
  renderAutoCrop,
  renderFitWithSolidBackground,
  renderFitWithBlurBackground,
  renderCrop,
  loadImage,
} from '@/lib/canvas-renderer'
import { ImageUploader } from '@/components/image-uploader'
import { FormatSelector } from '@/components/format-selector'
import { AdjustmentPanel } from '@/components/adjustment-panel'
import { RequirementsChecklist } from '@/components/requirements-checklist'
import { PreviewPanel } from '@/components/preview-panel'
import { DownloadPanel } from '@/components/download-panel'

export default function HomePage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<MetaFormat | null>(null)
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>('auto-crop')
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>({ type: 'solid', color: '#ffffff' })
  const [interactiveCrop, setInteractiveCrop] = useState<PixelCrop | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleImageLoad = useCallback(
    (file: File, url: string) => {
      if (originalUrl) URL.revokeObjectURL(originalUrl)
      setOriginalFile(file)
      setOriginalUrl(url)
      setSelectedFormat(null)
      setProcessedUrl(null)
      setRequirements([])
      setInteractiveCrop(null)

      const img = new Image()
      img.onload = () => setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight })
      img.src = url
    },
    [originalUrl],
  )

  const handleFormatSelect = useCallback(
    (format: MetaFormat) => {
      setSelectedFormat(format)
      setProcessedUrl(null)
      setInteractiveCrop(null)

      if (originalFile && originalDimensions) {
        setRequirements(
          validateRequirements(originalFile, originalDimensions.width, originalDimensions.height, format),
        )
      }
    },
    [originalFile, originalDimensions],
  )

  const handleApply = useCallback(async () => {
    if (!originalUrl || !selectedFormat) return
    setIsProcessing(true)
    try {
      let result: string

      if (adjustmentMode === 'auto-crop') {
        result = await renderAutoCrop(originalUrl, selectedFormat.width, selectedFormat.height)
      } else if (adjustmentMode === 'interactive-crop') {
        const img = await loadImage(originalUrl)
        const crop = interactiveCrop ?? {
          x: 0,
          y: 0,
          width: img.naturalWidth,
          height: img.naturalHeight,
        }
        result = renderCrop(img, crop, selectedFormat.width, selectedFormat.height)
      } else if (adjustmentMode === 'fit-solid') {
        const img = await loadImage(originalUrl)
        result = renderFitWithSolidBackground(img, selectedFormat.width, selectedFormat.height, backgroundConfig.color)
      } else {
        // fit-blur
        const img = await loadImage(originalUrl)
        result = renderFitWithBlurBackground(img, selectedFormat.width, selectedFormat.height)
      }

      setProcessedUrl(result)
    } finally {
      setIsProcessing(false)
    }
  }, [originalUrl, selectedFormat, adjustmentMode, interactiveCrop, backgroundConfig])

  const handleReset = useCallback(() => {
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    setOriginalFile(null)
    setOriginalUrl(null)
    setOriginalDimensions(null)
    setSelectedFormat(null)
    setProcessedUrl(null)
    setRequirements([])
    setInteractiveCrop(null)
    setAdjustmentMode('auto-crop')
  }, [originalUrl])

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Adequador de Imagens</h1>
            <p className="text-xs text-gray-500">Meta Ads — Feed, Stories e Reels</p>
          </div>
          {originalFile && (
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              Nova imagem
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* Step 1: Upload */}
        {!originalUrl ? (
          <ImageUploader onImageLoad={handleImageLoad} />
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={originalUrl}
              alt="Thumbnail da imagem carregada"
              className="h-12 w-12 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-700">{originalFile?.name}</p>
              <p className="text-xs text-gray-500">
                {originalDimensions
                  ? `${originalDimensions.width}×${originalDimensions.height} px · `
                  : ''}
                {originalFile ? `${(originalFile.size / 1024 / 1024).toFixed(1)} MB` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Format selector */}
        {originalUrl && (
          <FormatSelector selected={selectedFormat} onSelect={handleFormatSelect} />
        )}

        {/* Steps 3+: Adjustment, requirements, preview, download */}
        {selectedFormat && originalUrl && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <AdjustmentPanel
                imageUrl={originalUrl}
                format={selectedFormat}
                mode={adjustmentMode}
                backgroundConfig={backgroundConfig}
                onModeChange={setAdjustmentMode}
                onBackgroundChange={setBackgroundConfig}
                onInteractiveCropChange={setInteractiveCrop}
                onApply={handleApply}
                isProcessing={isProcessing}
              />
              <RequirementsChecklist requirements={requirements} />
            </div>

            <div className="space-y-4">
              {processedUrl ? (
                <>
                  <PreviewPanel
                    originalUrl={originalUrl}
                    processedUrl={processedUrl}
                    format={selectedFormat}
                  />
                  <DownloadPanel
                    processedDataUrl={processedUrl}
                    format={selectedFormat}
                    originalFileName={originalFile?.name ?? 'imagem'}
                  />
                </>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-center">
                  <p className="text-sm text-gray-400">
                    Clique em <strong className="text-gray-600">Aplicar ajuste</strong> para ver o preview
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
