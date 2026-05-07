/**
 * Heuristic saliency engine — runs entirely client-side via Canvas.
 *
 * Score per pixel = 0.40 * saturation + 0.30 * localContrast + 0.30 * centerPrior
 *
 * Steps:
 *   1. Downsample image to SAMPLE×SAMPLE grid
 *   2. Compute per-cell score
 *   3. Box-blur 3 passes to smooth
 *   4. Normalize 0–1
 *   5. Weighted centroid → focal point
 *   6. Optional: blend with face center (65% face / 35% saliency)
 */

const SAMPLE = 64

export type SaliencyResult = {
  /** Normalized scores 0–1, row-major, length = SAMPLE*SAMPLE */
  scores: Float32Array
  size: number
  /** Focal point in original image pixel coordinates */
  focal: { x: number; y: number }
  srcWidth: number
  srcHeight: number
}

export async function computeSaliency(
  src: string,
  faceCenter: { x: number; y: number } | null = null,
): Promise<SaliencyResult | null> {
  if (typeof window === 'undefined') return null

  try {
    const img = await loadImg(src)
    const { naturalWidth: W, naturalHeight: H } = img

    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE
    canvas.height = SAMPLE
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE)
    const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE)

    const scores = new Float32Array(SAMPLE * SAMPLE)
    const lumas = new Float32Array(SAMPLE * SAMPLE)

    // Precompute luma for local contrast
    for (let i = 0; i < SAMPLE * SAMPLE; i++) {
      const r = data[i * 4] / 255
      const g = data[i * 4 + 1] / 255
      const b = data[i * 4 + 2] / 255
      lumas[i] = 0.299 * r + 0.587 * g + 0.114 * b
    }

    for (let row = 0; row < SAMPLE; row++) {
      for (let col = 0; col < SAMPLE; col++) {
        const idx = row * SAMPLE + col
        const r = data[idx * 4] / 255
        const g = data[idx * 4 + 1] / 255
        const b = data[idx * 4 + 2] / 255

        // Saturation via HSL
        const sat = hslSaturation(r, g, b)

        // Local contrast: mean abs diff with 3×3 neighbors
        let sumDiff = 0
        let count = 0
        const selfLuma = lumas[idx]
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue
            const nr = row + dr
            const nc = col + dc
            if (nr < 0 || nr >= SAMPLE || nc < 0 || nc >= SAMPLE) continue
            sumDiff += Math.abs(selfLuma - lumas[nr * SAMPLE + nc])
            count++
          }
        }
        const localContrast = count > 0 ? (sumDiff / count) * 4 : 0 // *4 → scale to ~0-1 range

        // Center-prior Gaussian: peak at center, falls to ~0.07 at corners
        const cx = (col + 0.5) / SAMPLE - 0.5
        const cy = (row + 0.5) / SAMPLE - 0.5
        const centerPrior = Math.exp(-(cx * cx + cy * cy) / (2 * 0.18 * 0.18))

        scores[idx] = 0.40 * sat + 0.30 * Math.min(localContrast, 1) + 0.30 * centerPrior
      }
    }

    // Box blur 3 passes
    boxBlur(scores, SAMPLE, SAMPLE, 2)
    boxBlur(scores, SAMPLE, SAMPLE, 2)
    boxBlur(scores, SAMPLE, SAMPLE, 2)

    // Normalize
    let minS = Infinity, maxS = -Infinity
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] < minS) minS = scores[i]
      if (scores[i] > maxS) maxS = scores[i]
    }
    const range = maxS - minS || 1
    for (let i = 0; i < scores.length; i++) {
      scores[i] = (scores[i] - minS) / range
    }

    // Weighted centroid in normalized [0,1] space
    let sumW = 0, sumX = 0, sumY = 0
    for (let row = 0; row < SAMPLE; row++) {
      for (let col = 0; col < SAMPLE; col++) {
        const w = scores[row * SAMPLE + col]
        const nx = (col + 0.5) / SAMPLE
        const ny = (row + 0.5) / SAMPLE
        sumW += w
        sumX += w * nx
        sumY += w * ny
      }
    }
    const saliencyFx = sumW > 0 ? sumX / sumW : 0.5
    const saliencyFy = sumW > 0 ? sumY / sumW : 0.5

    // Blend with face center if available
    let focalNx: number
    let focalNy: number
    if (faceCenter) {
      const faceFx = faceCenter.x / W
      const faceFy = faceCenter.y / H
      focalNx = 0.65 * faceFx + 0.35 * saliencyFx
      focalNy = 0.65 * faceFy + 0.35 * saliencyFy
    } else {
      focalNx = saliencyFx
      focalNy = saliencyFy
    }

    return {
      scores,
      size: SAMPLE,
      focal: { x: Math.round(focalNx * W), y: Math.round(focalNy * H) },
      srcWidth: W,
      srcHeight: H,
    }
  } catch {
    return null
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function hslSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return 0
  const d = max - min
  return l > 0.5 ? d / (2 - max - min) : d / (max + min)
}

/** In-place box blur on a Float32Array representing a rows×cols grid */
function boxBlur(arr: Float32Array, cols: number, rows: number, radius: number): void {
  const tmp = new Float32Array(arr.length)

  // Horizontal pass
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let sum = 0, count = 0
      for (let dc = -radius; dc <= radius; dc++) {
        const nc = col + dc
        if (nc < 0 || nc >= cols) continue
        sum += arr[row * cols + nc]
        count++
      }
      tmp[row * cols + col] = sum / count
    }
  }

  // Vertical pass
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      let sum = 0, count = 0
      for (let dr = -radius; dr <= radius; dr++) {
        const nr = row + dr
        if (nr < 0 || nr >= rows) continue
        sum += tmp[nr * cols + col]
        count++
      }
      arr[row * cols + col] = sum / count
    }
  }
}
