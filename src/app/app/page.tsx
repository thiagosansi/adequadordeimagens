'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type {
  MetaFormat,
  AdjustmentMode,
  BackgroundConfig,
  PixelCrop,
  Requirement,
} from '@/shared/types/image'
import { validateRequirements, validateRequirementsWithSafeZone } from '@/lib/requirements-validator'
import {
  renderAutoCrop,
  renderFaceAwareCrop,
  renderFitWithSolidBackground,
  renderFitWithBlurBackground,
  renderExpandWithMirror,
  renderCrop,
  loadImage,
} from '@/lib/canvas-renderer'
import { logout } from '@/lib/auth'
import { ImageUploader } from '@/components/image-uploader'
import { FormatSelector } from '@/components/format-selector'
import { AdjustmentPanel } from '@/components/adjustment-panel'
import { RequirementsChecklist } from '@/components/requirements-checklist'
import { PreviewPanel } from '@/components/preview-panel'
import { DownloadPanel } from '@/components/download-panel'
import { TextOverlayChecker } from '@/components/text-overlay-checker'
import { QualityScoreCard, FormatBenchmarkCard } from '@/components/quality-score-badge'
import { BatchExportPanel } from '@/components/batch-export-panel'
import { AppModeSwitcher } from '@/components/app-mode-switcher'
import type { AppMode } from '@/components/app-mode-switcher'
import { CarouselSection } from '@/components/carousel/carousel-section'
import { VideoSection } from '@/components/video-section'
import { BatchSection } from '@/components/batch-section'
import { processImageWithAI } from '@/lib/actions/cloudinary-ai'
import type { AIMode } from '@/lib/actions/cloudinary-ai'
import { analyseImage } from '@/lib/image-analyser'
import type { ImageAnalysis } from '@/lib/image-analyser'

export default function AppPage() {
  const router = useRouter()
  return <AppContent router={router} />
}

function AppContent({ router }: { router: ReturnType<typeof useRouter> }) {
  const [appMode, setAppMode] = useState<AppMode>('single')
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<MetaFormat | null>(null)
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode | null>(null)
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>({ type: 'solid', color: '#ffffff' })
  const [interactiveCrop, setInteractiveCrop] = useState<PixelCrop | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [textCoveragePercent, setTextCoveragePercent] = useState<number | undefined>(undefined)
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [aiError, setAIError] = useState<string | null>(null)
  const [lastAIMode, setLastAIMode] = useState<AIMode | null>(null)

  const handleImageLoad = useCallback(
    (file: File, url: string) => {
      if (originalUrl) URL.revokeObjectURL(originalUrl)
      setOriginalFile(file)
      setOriginalUrl(url)
      setSelectedFormat(null)
      setProcessedUrl(null)
      setRequirements([])
      setInteractiveCrop(null)
      setImageAnalysis(null)
      setTextCoveragePercent(undefined)

      const img = new Image()
      img.onload = () => setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight })
      img.src = url

      analyseImage(url).then(setImageAnalysis)
    },
    [originalUrl],
  )

  const handleFormatSelect = useCallback(
    (format: MetaFormat) => {
      setSelectedFormat(format)
      setProcessedUrl(null)
      setInteractiveCrop(null)

      if (!originalFile || !originalUrl) return

      if (format.safeZone) {
        loadImage(originalUrl).then((img) => {
          validateRequirementsWithSafeZone(originalFile, img, format).then(setRequirements)
        })
      } else if (originalDimensions) {
        setRequirements(
          validateRequirements(originalFile, originalDimensions.width, originalDimensions.height, format),
        )
      }
    },
    [originalFile, originalUrl, originalDimensions],
  )

  const handleApply = useCallback(async () => {
    if (!originalUrl || !selectedFormat || !adjustmentMode) return
    setIsProcessing(true)
    setApplyError(null)
    try {
      let result: string

      if (adjustmentMode === 'auto-crop') {
        result = await renderAutoCrop(originalUrl, selectedFormat.width, selectedFormat.height)
      } else if (adjustmentMode === 'face-crop') {
        const { dataUrl, faceCount, error } = await renderFaceAwareCrop(originalUrl, selectedFormat.width, selectedFormat.height)
        result = dataUrl
        if (error) throw new Error(`Detecção de rosto: ${error}`)
        if (faceCount === 0) throw new Error('Nenhum rosto detectado na imagem. Tente o corte automático ou manual.')
      } else if (adjustmentMode === 'interactive-crop') {
        const img = await loadImage(originalUrl)
        const crop = interactiveCrop ?? {
          x: 0,
          y: 0,
          width: img.naturalWidth,
          height: img.naturalHeight,
        }
        result = renderCrop(img, crop, selectedFormat.width, selectedFormat.height)
      } else if (adjustmentMode === 'expand') {
        const img = await loadImage(originalUrl)
        result = renderExpandWithMirror(img, selectedFormat.width, selectedFormat.height)
      } else if (adjustmentMode === 'fit-solid') {
        const img = await loadImage(originalUrl)
        result = renderFitWithSolidBackground(img, selectedFormat.width, selectedFormat.height, backgroundConfig.color)
      } else {
        const img = await loadImage(originalUrl)
        result = renderFitWithBlurBackground(img, selectedFormat.width, selectedFormat.height)
      }

      setProcessedUrl(result!)
      setLastAIMode(null)
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Erro ao aplicar ajuste.')
    } finally {
      setIsProcessing(false)
    }
  }, [originalUrl, selectedFormat, adjustmentMode, interactiveCrop, backgroundConfig])

  const handleAIApply = useCallback(async () => {
    if (!originalFile || !selectedFormat) return
    setIsAIProcessing(true)
    setAIError(null)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(originalFile)
      })
      const aiMode = adjustmentMode === 'expand' ? 'generative-fill' : 'smart-crop'
      const result = await processImageWithAI(dataUrl, selectedFormat.width, selectedFormat.height, aiMode)
      setProcessedUrl(result)
      setLastAIMode(aiMode)
    } catch (err) {
      setAIError(err instanceof Error ? err.message : 'Erro ao processar com IA')
    } finally {
      setIsAIProcessing(false)
    }
  }, [originalFile, selectedFormat, adjustmentMode])

  // Auto-apply with 400ms debounce whenever relevant params change
  const handleApplyRef = useRef(handleApply)
  handleApplyRef.current = handleApply

  const cropKey = interactiveCrop
    ? `${interactiveCrop.x}x${interactiveCrop.y}x${interactiveCrop.width}x${interactiveCrop.height}`
    : 'none'

  useEffect(() => {
    if (!originalUrl || !selectedFormat || !adjustmentMode) return
    const timer = setTimeout(() => { handleApplyRef.current() }, 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalUrl, selectedFormat?.id, adjustmentMode, backgroundConfig.color, cropKey])

  const handleReset = useCallback(() => {
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    setOriginalFile(null)
    setOriginalUrl(null)
    setOriginalDimensions(null)
    setSelectedFormat(null)
    setProcessedUrl(null)
    setRequirements([])
    setInteractiveCrop(null)
    setAdjustmentMode(null)
  }, [originalUrl])

  function handleLogout() {
    logout()
    router.replace('/')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/app" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">AdFrame</span>
          </Link>
          <div className="flex items-center gap-4">
            <AppModeSwitcher mode={appMode} onChange={setAppMode} />
            {appMode === 'single' && originalFile && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Nova imagem
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {appMode === 'carousel' && <CarouselSection />}
        {appMode === 'video' && <VideoSection />}
        {appMode === 'batch' && <BatchSection />}

        {appMode === 'single' && !originalUrl ? (
          <ImageUploader onImageLoad={handleImageLoad} />
        ) : appMode === 'single' && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={originalUrl!}
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

        {appMode === 'single' && originalUrl && (
          <TextOverlayChecker
            imageUrl={originalUrl}
            onPercentageChange={setTextCoveragePercent}
          />
        )}

        {appMode === 'single' && originalUrl && (
          <FormatSelector selected={selectedFormat} onSelect={handleFormatSelect} />
        )}

        {appMode === 'single' && selectedFormat && originalUrl && (
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
                onAIApply={handleAIApply}
                isAIProcessing={isAIProcessing}
              />
              {applyError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{applyError}</p>
              )}
              {aiError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{aiError}</p>
              )}
              <QualityScoreCard
                requirements={requirements}
                textCoveragePercent={textCoveragePercent}
                imageAnalysis={imageAnalysis}
              />
              <RequirementsChecklist
                requirements={requirements}
                onSuggestInteractiveCrop={() => setAdjustmentMode('interactive-crop')}
              />
              <FormatBenchmarkCard format={selectedFormat} />
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
                    requirements={requirements}
                  />
                  <BatchExportPanel
                    imageUrl={originalUrl}
                    originalFileName={originalFile?.name ?? 'imagem'}
                    mode={adjustmentMode!}
                    backgroundConfig={backgroundConfig}
                    interactiveCrop={interactiveCrop}
                    aiMode={lastAIMode ?? undefined}
                    platform={selectedFormat?.platform}
                  />
                </>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-center">
                  <p className="text-sm text-gray-400">
                    {!adjustmentMode
                      ? 'Selecione um modo de ajuste para gerar o preview.'
                      : isProcessing
                      ? 'Gerando preview...'
                      : 'Aguardando parâmetros...'}
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
