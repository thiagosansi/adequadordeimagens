'use client'

import { useState, useCallback } from 'react'
import { Download, Loader2, Clapperboard } from 'lucide-react'
import type { MetaVideoFormat, VideoMetadata, VideoRequirement, VideoProcessorType } from '@/shared/types/video'
import type { Platform } from '@/shared/types/platform'
import { getVideoFormats } from '@/lib/format-registry'
import { PlatformSelector } from './platform-selector'
import {
  loadVideoMetadata,
  validateVideoRequirements,
  analyseSafeZoneFrames,
} from '@/lib/video-validator'
import {
  selectProcessorType,
  processWithCanvas,
  processWithFFmpeg,
} from '@/lib/video-processor'
import { VideoUploader } from './video-uploader'
import { VideoPreview } from './video-preview'
import { VideoFrameCropper } from './video-frame-cropper'
import { RequirementsChecklist } from './requirements-checklist'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import type { PixelCrop } from '@/shared/types/image'

const PROCESSOR_LABELS: Record<VideoProcessorType, string> = {
  canvas: 'Canvas (rápido)',
  ffmpeg: 'FFmpeg (qualidade)',
}

// Platforms that have video formats
const VIDEO_PLATFORMS: Platform[] = ['meta', 'tiktok', 'linkedin', 'youtube']

export function VideoSection() {
  const [platform, setPlatform] = useState<Platform>('meta')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<MetaVideoFormat | null>(null)
  const [requirements, setRequirements] = useState<VideoRequirement[]>([])
  const [cropMode, setCropMode] = useState<'auto' | 'manual'>('auto')
  const [manualCrop, setManualCrop] = useState<PixelCrop | null>(null)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [processorType, setProcessorType] = useState<VideoProcessorType | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const [processError, setProcessError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const handleVideoLoad = useCallback(async (file: File) => {
    // Clean up previous state
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    if (processedUrl) URL.revokeObjectURL(processedUrl)

    setVideoFile(file)
    setSelectedFormat(null)
    setRequirements([])
    setProcessedUrl(null)
    setProcessedBlob(null)
    setProcessError(null)
    setLoadError(null)
    setProcessorType(null)
    setMetadata(null)

    const url = URL.createObjectURL(file)
    setOriginalUrl(url)

    try {
      const result = await loadVideoMetadata(file)
      setMetadata(result)
      setVideoElement(result.element)
    } catch (err) {
      URL.revokeObjectURL(url)
      setOriginalUrl(null)
      setVideoFile(null)
      setLoadError(err instanceof Error ? err.message : 'Erro ao carregar o vídeo.')
    }
  }, [originalUrl, processedUrl])

  const handleFormatSelect = useCallback(async (format: MetaVideoFormat) => {
    if (!metadata || !videoElement) return

    setSelectedFormat(format)
    setProcessedUrl(null)
    setProcessedBlob(null)
    setProcessError(null)
    setIsAnalysing(true)

    try {
      // Phase 1: static validation
      const staticReqs = validateVideoRequirements(metadata, format)

      // Phase 2: frame analysis (safe zone)
      const safeZoneReq = await analyseSafeZoneFrames(videoElement, format)
      const allReqs = safeZoneReq ? [...staticReqs, safeZoneReq] : staticReqs

      setRequirements(allReqs)

      // Auto-select processor
      const processor = selectProcessorType(metadata.durationSec, metadata.fileSizeMB)
      setProcessorType(processor)
    } finally {
      setIsAnalysing(false)
    }
  }, [metadata, videoElement])

  const handleProcess = useCallback(async () => {
    if (!videoFile || !selectedFormat || !processorType) return

    setIsProcessing(true)
    setProcessProgress(0)
    setProcessError(null)

    try {
      const crop = cropMode === 'manual' ? manualCrop ?? undefined : undefined
      const blob = processorType === 'canvas'
        ? await processWithCanvas(
            videoFile,
            selectedFormat.width,
            selectedFormat.height,
            setProcessProgress,
            crop,
          )
        : await processWithFFmpeg(
            videoFile,
            selectedFormat.width,
            selectedFormat.height,
            setProcessProgress,
            crop,
          )

      const url = URL.createObjectURL(blob)
      setProcessedBlob(blob)
      setProcessedUrl(url)
    } catch (err) {
      setProcessError(err instanceof Error ? err.message : 'Erro ao processar vídeo')
    } finally {
      setIsProcessing(false)
      setProcessProgress(0)
    }
  }, [videoFile, selectedFormat, processorType])

  function handleDownload() {
    if (!processedBlob || !videoFile || !selectedFormat) return
    const ext = processedBlob.type.includes('mp4') ? 'mp4' : 'webm'
    const baseName = videoFile.name.replace(/\.[^.]+$/, '')
    const fileName = `${baseName}_${selectedFormat.id}_${selectedFormat.width}x${selectedFormat.height}.${ext}`
    const url = URL.createObjectURL(processedBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)

    void trackEvent('download_video', {
      format_id: selectedFormat.id,
      format_label: selectedFormat.label,
      platform: selectedFormat.platform,
      width: selectedFormat.width,
      height: selectedFormat.height,
    })
  }

  function handleReset() {
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    if (processedUrl) URL.revokeObjectURL(processedUrl)
    setVideoFile(null)
    setOriginalUrl(null)
    setMetadata(null)
    setVideoElement(null)
    setSelectedFormat(null)
    setRequirements([])
    setProcessedUrl(null)
    setProcessedBlob(null)
    setProcessError(null)
    setProcessorType(null)
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  if (!videoFile || !metadata) {
    return (
      <div className="space-y-3">
        <VideoUploader onVideoLoad={handleVideoLoad} />
        {loadError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* File info + reset */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <Clapperboard className="h-5 w-5 text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-700">{videoFile.name}</p>
            <p className="text-xs text-gray-500">
              {metadata.width}×{metadata.height} px ·{' '}
              {formatDuration(metadata.durationSec)} ·{' '}
              {metadata.fileSizeMB.toFixed(0)} MB
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="shrink-0 text-sm text-gray-400 underline hover:text-gray-600"
        >
          Trocar vídeo
        </button>
      </div>

      {/* Platform + Format selector */}
      <div>
        <PlatformSelector
          selected={platform}
          onChange={(next) => {
            setPlatform(next)
            setSelectedFormat(null)
            setRequirements([])
            setProcessedUrl(null)
            setProcessedBlob(null)
          }}
          available={VIDEO_PLATFORMS}
        />
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Selecione o formato
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {getVideoFormats(platform).map((f) => {
            const isSelected = selectedFormat?.id === f.id
            const aspectRatio = f.width / f.height
            const MAX_W = 44, MAX_H = 56
            const previewW = aspectRatio >= 1 ? MAX_W : Math.round(MAX_H * aspectRatio)
            const previewH = aspectRatio >= 1 ? Math.round(MAX_W / aspectRatio) : MAX_H
            return (
              <button
                key={f.id}
                onClick={() => handleFormatSelect(f)}
                disabled={isAnalysing}
                aria-pressed={isSelected}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                <div className="flex h-16 w-14 items-center justify-center">
                  <div
                    className={cn(
                      'rounded border-2',
                      isSelected ? 'border-blue-400 bg-blue-100' : 'border-gray-300 bg-gray-100',
                    )}
                    style={{ width: previewW, height: previewH }}
                  />
                </div>
                <div>
                  <p className={cn('text-xs font-semibold', isSelected ? 'text-blue-700' : 'text-gray-700')}>
                    {f.label}
                  </p>
                  <p className="text-xs text-gray-400">{f.ratio}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{f.useCase}</p>
                </div>
              </button>
            )
          })}
        </div>
        {isAnalysing && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Analisando frames...
          </p>
        )}
      </div>

      {/* Requirements + process panel */}
      {selectedFormat && requirements.length > 0 && !isAnalysing && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {/* Requirements checklist reuses existing component */}
            <RequirementsChecklist requirements={requirements} />

            {/* Crop mode selector */}
            {processorType && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600">Modo de recorte</p>
                <div className="flex gap-2">
                  {(['auto', 'manual'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setCropMode(m)}
                      className={cn(
                        'rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-colors',
                        cropMode === m
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300',
                      )}
                    >
                      {m === 'auto' ? 'Automático' : 'Manual'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual crop frame selector */}
            {processorType && cropMode === 'manual' && videoElement && selectedFormat && (
              <VideoFrameCropper
                videoElement={videoElement}
                format={selectedFormat}
                onCropChange={setManualCrop}
              />
            )}

            {/* Processor badge + button */}
            {processorType && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Processador selecionado:</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {PROCESSOR_LABELS[processorType]}
                  </span>
                </div>

                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors',
                    isProcessing
                      ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                      : 'bg-blue-600 text-white hover:bg-blue-700',
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {processProgress > 0
                        ? `Processando ${Math.round(processProgress * 100)}%...`
                        : 'Iniciando...'}
                    </>
                  ) : (
                    'Aplicar recorte'
                  )}
                </button>

                {isProcessing && processProgress > 0 && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${Math.round(processProgress * 100)}%` }}
                    />
                  </div>
                )}

                {processError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {processError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Preview + download */}
          <div className="space-y-4">
            {processedUrl ? (
              <>
                <VideoPreview
                  videoUrl={processedUrl}
                  format={selectedFormat}
                  label="Preview"
                  originalUrl={originalUrl ?? undefined}
                />
                <button
                  onClick={handleDownload}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  Baixar vídeo
                </button>
              </>
            ) : (
              <>
                {originalUrl && (
                  <VideoPreview
                    videoUrl={originalUrl}
                    format={selectedFormat}
                    label="Preview"
                    cropPreview
                    originalUrl={originalUrl}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return s > 0 ? `${m}min ${s}s` : `${m}min`
}
