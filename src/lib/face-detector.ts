// Model weights are served from /public/models (Next.js static files).
// Files: tiny_face_detector_model-weights_manifest.json + tiny_face_detector_model-shard1
const MODEL_URL = '/models'

let modelsLoaded = false
let modelsLoading: Promise<void> | null = null

async function ensureModels(): Promise<void> {
  if (modelsLoaded) return
  if (modelsLoading) return modelsLoading

  modelsLoading = (async () => {
    const faceapi = await import('face-api.js')
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
    modelsLoaded = true
  })()

  return modelsLoading
}

export type FaceBox = {
  x: number
  y: number
  width: number
  height: number
  centerX: number
  centerY: number
}

export type FaceDetectionResult = {
  faces: FaceBox[]
  error?: string
}

/**
 * Detects faces in an image element.
 * Returns face bounding boxes in natural image pixel coordinates.
 *
 * Draws to an off-screen canvas before detection — HTMLImageElements not in the
 * DOM have width=0/height=0 which causes face-api.js to receive an empty tensor.
 */
export async function detectFaces(img: HTMLImageElement): Promise<FaceDetectionResult> {
  try {
    await ensureModels()
    const faceapi = await import('face-api.js')

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d')!.drawImage(img, 0, 0)

    const detections = await faceapi.detectAllFaces(
      canvas,
      new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3, inputSize: 416 }),
    )

    const faces = detections.map((d) => {
      const { x, y, width, height } = d.box
      return { x, y, width, height, centerX: x + width / 2, centerY: y + height / 2 }
    })

    return { faces }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao carregar modelo de detecção'
    return { faces: [], error: message }
  }
}

/**
 * Calculates a single focal point from one or more detected faces.
 * Returns null when faces array is empty.
 */
export function getFocalPoint(faces: FaceBox[]): { x: number; y: number } | null {
  if (faces.length === 0) return null
  const cx = faces.reduce((sum, f) => sum + f.centerX, 0) / faces.length
  const cy = faces.reduce((sum, f) => sum + f.centerY, 0) / faces.length
  return { x: cx, y: cy }
}
