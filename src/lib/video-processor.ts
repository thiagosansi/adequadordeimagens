import type { VideoProcessorType } from '@/shared/types/video'
import type { PixelCrop } from '@/shared/types/image'
import { calculateAutoCrop } from './crop-calculator'

// ─── Selector ─────────────────────────────────────────────────────────────────

const CANVAS_MAX_DURATION_SEC = 90
const CANVAS_MAX_SIZE_MB = 100

export function selectProcessorType(durationSec: number, fileSizeMB: number): VideoProcessorType {
  if (durationSec > CANVAS_MAX_DURATION_SEC || fileSizeMB > CANVAS_MAX_SIZE_MB) {
    return 'ffmpeg'
  }
  return 'canvas'
}

// ─── Canvas + MediaRecorder processor ─────────────────────────────────────────

export async function processWithCanvas(
  file: File,
  targetWidth: number,
  targetHeight: number,
  onProgress?: (ratio: number) => void,
  manualCrop?: PixelCrop,
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file)

  const video = document.createElement('video')
  video.src = objectUrl
  video.muted = false
  video.preload = 'auto'
  video.crossOrigin = 'anonymous'

  await new Promise<void>((resolve, reject) => {
    video.oncanplaythrough = () => resolve()
    video.onerror = reject
    video.load()
  })

  const { width: srcW, height: srcH } = { width: video.videoWidth, height: video.videoHeight }
  const crop = manualCrop ?? calculateAutoCrop(srcW, srcH, targetWidth, targetHeight)

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')!

  // Capture audio from the video element
  let audioTracks: MediaStreamTrack[] = []
  try {
    const audioCtx = new AudioContext()
    const source = audioCtx.createMediaElementSource(video)
    const destination = audioCtx.createMediaStreamDestination()
    source.connect(destination)
    source.connect(audioCtx.destination)
    audioTracks = destination.stream.getAudioTracks()
  } catch {
    // Audio capture not available — continue without audio
  }

  const videoStream = canvas.captureStream(30)
  const combinedStream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...audioTracks,
  ])

  const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=h264')
    ? 'video/mp4;codecs=h264'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm'

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

  recorder.start(100) // collect in 100ms chunks

  let animFrameId: number

  function drawFrame() {
    if (!video.paused && !video.ended) {
      ctx.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, targetWidth, targetHeight)
      onProgress?.(video.currentTime / video.duration)
      animFrameId = requestAnimationFrame(drawFrame)
    }
  }

  await new Promise<void>((resolve) => {
    video.onended = () => {
      cancelAnimationFrame(animFrameId)
      resolve()
    }
    video.play()
    requestAnimationFrame(drawFrame)
  })

  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
    recorder.stop()
  })

  URL.revokeObjectURL(objectUrl)

  return new Blob(chunks, { type: mimeType.split(';')[0] })
}

// ─── FFmpeg.wasm processor ────────────────────────────────────────────────────

let ffmpegInstance: import('@ffmpeg/ffmpeg').FFmpeg | null = null

async function getFFmpeg(): Promise<import('@ffmpeg/ffmpeg').FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance

  const { FFmpeg } = await import('@ffmpeg/ffmpeg')
  const { toBlobURL } = await import('@ffmpeg/util')

  const ffmpeg = new FFmpeg()

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  ffmpegInstance = ffmpeg
  return ffmpeg
}

export async function processWithFFmpeg(
  file: File,
  targetWidth: number,
  targetHeight: number,
  onProgress?: (ratio: number) => void,
  manualCrop?: PixelCrop,
): Promise<Blob> {
  const { fetchFile } = await import('@ffmpeg/util')

  const ffmpeg = await getFFmpeg()

  ffmpeg.on('progress', ({ progress }) => onProgress?.(progress))

  const inputName = 'input.' + (file.name.split('.').pop() ?? 'mp4')
  await ffmpeg.writeFile(inputName, await fetchFile(file))

  // Load metadata to calculate crop (skipped when manualCrop is provided)
  const meta = await getVideoDimensions(file)
  const crop = manualCrop ?? calculateAutoCrop(meta.width, meta.height, targetWidth, targetHeight)

  const cropFilter = `crop=${crop.width}:${crop.height}:${crop.x}:${crop.y},scale=${targetWidth}:${targetHeight}`

  await ffmpeg.exec([
    '-i', inputName,
    '-vf', cropFilter,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    'output.mp4',
  ])

  const data = await ffmpeg.readFile('output.mp4')
  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile('output.mp4')

  // FFmpeg returns Uint8Array<ArrayBufferLike>; coerce buffer to plain ArrayBuffer for Blob
  const bytes = data instanceof Uint8Array
    ? new Uint8Array(data.buffer instanceof ArrayBuffer ? data.buffer : new Uint8Array(data).buffer)
    : new TextEncoder().encode(data as string)

  return new Blob([bytes], { type: 'video/mp4' })
}

function getVideoDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve({ width: video.videoWidth, height: video.videoHeight })
    }
    video.onerror = reject
    video.src = url
  })
}
