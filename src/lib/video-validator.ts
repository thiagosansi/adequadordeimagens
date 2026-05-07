import type { MetaVideoFormat, VideoMetadata, VideoRequirement } from '@/shared/types/video'
import { isVideoFileAccepted } from './meta-video-formats'
import { analyseSafeZoneContent } from './canvas-renderer'

// Variance threshold — same as image safe zone analysis
const SAFE_ZONE_THRESHOLD = 0.04

// ─── Static validation (Phase 1) ─────────────────────────────────────────────

export function validateVideoRequirements(
  meta: VideoMetadata,
  format: MetaVideoFormat,
): VideoRequirement[] {
  return [
    validateMimeType(meta.mimeType),
    validateFileSize(meta.fileSizeMB, format.maxFileSizeGB),
    validateResolution(meta.width, meta.height, format),
    validateAspectRatio(meta.width, meta.height, format),
    validateDuration(meta.durationSec, format),
  ]
}

function validateMimeType(mimeType: string): VideoRequirement {
  // Use a temporary File-like object to reuse isVideoFileAccepted logic
  const pass = isVideoFileAccepted({ type: mimeType, name: '' } as File)
  const ext = mimeType.split('/')[1]?.toUpperCase() ?? 'desconhecido'
  return {
    id: 'mime-type',
    label: 'Formato do arquivo',
    status: pass ? 'pass' : 'fail',
    message: pass
      ? `${ext} — aceito pelo Meta`
      : `${ext} — use MP4, MOV, HEVC ou WebM`,
  }
}

function validateFileSize(sizeMB: number, maxGB: number): VideoRequirement {
  const maxMB = maxGB * 1024
  const pass = sizeMB <= maxMB
  return {
    id: 'file-size',
    label: 'Tamanho do arquivo',
    status: pass ? 'pass' : 'fail',
    message: pass
      ? `${sizeMB.toFixed(0)} MB (máx. ${maxGB} GB)`
      : `${sizeMB.toFixed(0)} MB — excede o limite de ${maxGB} GB`,
  }
}

function validateResolution(
  width: number,
  height: number,
  format: MetaVideoFormat,
): VideoRequirement {
  const pass = width >= format.minWidth && height >= format.minHeight
  return {
    id: 'resolution',
    label: 'Resolução mínima',
    status: pass ? 'pass' : 'fail',
    message: pass
      ? `${width}×${height} px — resolução adequada`
      : `${width}×${height} px — mínimo ${format.minWidth}×${format.minHeight} px para ${format.label}`,
  }
}

function validateAspectRatio(
  width: number,
  height: number,
  format: MetaVideoFormat,
): VideoRequirement {
  const srcRatio = width / height
  const targetRatio = format.width / format.height
  const diff = Math.abs(srcRatio - targetRatio) / targetRatio

  if (diff < 0.02) {
    return {
      id: 'aspect-ratio',
      label: 'Proporção',
      status: 'pass',
      message: `${format.ratio} — proporção correta para ${format.label}`,
    }
  }
  return {
    id: 'aspect-ratio',
    label: 'Proporção',
    status: 'warning',
    message: `Proporção atual ${(srcRatio).toFixed(2)}:1 difere de ${format.ratio} — será feito um recorte`,
  }
}

function validateDuration(durationSec: number, format: MetaVideoFormat): VideoRequirement {
  const tooShort = durationSec < format.minDurationSec
  const tooLong = durationSec > format.maxDurationSec

  if (!tooShort && !tooLong) {
    return {
      id: 'duration',
      label: 'Duração',
      status: 'pass',
      message: `${formatDuration(durationSec)} — dentro do limite para ${format.label}`,
    }
  }

  const maxLabel = format.maxDurationSec >= 3600
    ? `${format.maxDurationSec / 60} min`
    : `${format.maxDurationSec}s`

  return {
    id: 'duration',
    label: 'Duração',
    status: 'fail',
    message: tooShort
      ? `${formatDuration(durationSec)} — mínimo ${format.minDurationSec}s para ${format.label}`
      : `${formatDuration(durationSec)} — máximo ${maxLabel} para ${format.label}`,
  }
}

// ─── Frame analysis (Phase 2) ─────────────────────────────────────────────────

/**
 * Extracts 3 frames from the video (start / mid / end) and runs
 * safe zone pixel analysis on each. Returns an aggregated requirement.
 */
export async function analyseSafeZoneFrames(
  video: HTMLVideoElement,
  format: MetaVideoFormat,
): Promise<VideoRequirement | null> {
  if (!format.safeZone) return null

  const positions = [0.05, 0.5, 0.95].map((p) => p * video.duration)
  const scores: { topScore: number; bottomScore: number; leftScore: number; rightScore: number }[] = []

  for (const t of positions) {
    const frame = await extractFrame(video, t)
    scores.push(analyseSafeZoneContent(frame, format.safeZone))
  }

  const sz = format.safeZone
  const violations: string[] = []
  const framesWithViolation = scores.filter((s) => {
    const topViol = sz.top && s.topScore > SAFE_ZONE_THRESHOLD
    const botViol = sz.bottom && s.bottomScore > SAFE_ZONE_THRESHOLD
    return topViol || botViol
  }).length

  if (sz.top) {
    const topFrames = scores.filter((s) => s.topScore > SAFE_ZONE_THRESHOLD).length
    if (topFrames > 0) violations.push(`topo (${sz.top}%) em ${topFrames}/3 frames`)
  }
  if (sz.bottom) {
    const botFrames = scores.filter((s) => s.bottomScore > SAFE_ZONE_THRESHOLD).length
    if (botFrames > 0) violations.push(`base (${sz.bottom}%) em ${botFrames}/3 frames`)
  }

  if (violations.length === 0) {
    return {
      id: 'safe-zone',
      label: 'Área segura (frames)',
      status: 'pass',
      message: 'Conteúdo dentro da área segura nos 3 frames analisados',
    }
  }

  return {
    id: 'safe-zone',
    label: 'Área segura (frames)',
    status: 'warning',
    message: `Conteúdo detectado na zona restrita: ${violations.join(' e ')}. Essa área é coberta pela interface do Meta`,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractFrame(video: HTMLVideoElement, timeSec: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0)
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = canvas.toDataURL('image/jpeg', 0.8)
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = timeSec
  })
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return s > 0 ? `${m}min ${s}s` : `${m}min`
}

export function loadVideoMetadata(file: File): Promise<VideoMetadata & { element: HTMLVideoElement }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        durationSec: video.duration,
        fileSizeMB: file.size / (1024 * 1024),
        mimeType: file.type,
        element: video,
      })
    }
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      const ext = file.name.split('.').pop()?.toUpperCase() ?? ''
      reject(new Error(
        `Não foi possível carregar o vídeo${ext ? ` (${ext})` : ''}. ` +
        'Este formato pode não ser suportado pelo seu navegador. ' +
        'Tente converter para MP4 (H.264) usando o QuickTime Player ou o aplicativo de câmera do iPhone em modo "Mais Compatível".'
      ))
    }
    video.src = objectUrl
  })
}
