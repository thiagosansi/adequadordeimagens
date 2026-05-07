export type ImageAnalysis = {
  contrastScore: number    // 0–1 (std dev of luminance, normalised)
  saturationScore: number  // 0–1 (average HSL saturation)
  brightnessScore: number  // 0–1 (0=too dark, 0.5=ideal, 1=too bright)
}

// Thresholds (tuned against typical social ad imagery)
const CONTRAST_GOOD   = 0.20  // std dev / 255 normalised
const CONTRAST_POOR   = 0.10
const SAT_GOOD        = 0.30
const SAT_POOR        = 0.12
const BRIGHT_LOW      = 0.25
const BRIGHT_HIGH     = 0.82

const SAMPLE_SIZE = 120 // px — downsample for perf

/**
 * Analyses contrast, saturation, and brightness of an image URL.
 * Runs entirely client-side via Canvas. Returns null on error.
 */
export async function analyseImage(url: string): Promise<ImageAnalysis | null> {
  try {
    const img = await loadImg(url)
    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE_SIZE
    canvas.height = Math.round((img.naturalHeight / img.naturalWidth) * SAMPLE_SIZE)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

    const lumas: number[] = []
    const sats: number[] = []
    const brights: number[] = []

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255
      const g = data[i + 1] / 255
      const b = data[i + 2] / 255

      const luma = 0.299 * r + 0.587 * g + 0.114 * b
      lumas.push(luma)
      brights.push(luma)

      const { s } = rgbToHsl(r, g, b)
      sats.push(s)
    }

    const meanLuma = mean(lumas)
    const stdLuma = stdDev(lumas, meanLuma)
    const meanSat = mean(sats)
    const meanBright = mean(brights)

    // contrastScore: 0 when stdLuma ≤ CONTRAST_POOR, 1 when ≥ CONTRAST_GOOD
    const contrastScore = clamp01((stdLuma - CONTRAST_POOR) / (CONTRAST_GOOD - CONTRAST_POOR))

    // saturationScore: 0 when meanSat ≤ SAT_POOR, 1 when ≥ SAT_GOOD
    const saturationScore = clamp01((meanSat - SAT_POOR) / (SAT_GOOD - SAT_POOR))

    // brightnessScore: 0 when too dark (<BRIGHT_LOW) or too bright (>BRIGHT_HIGH), 1 in middle
    let brightnessScore: number
    if (meanBright < BRIGHT_LOW) {
      brightnessScore = meanBright / BRIGHT_LOW
    } else if (meanBright > BRIGHT_HIGH) {
      brightnessScore = 1 - (meanBright - BRIGHT_HIGH) / (1 - BRIGHT_HIGH)
    } else {
      brightnessScore = 1
    }

    return {
      contrastScore: round2(contrastScore),
      saturationScore: round2(saturationScore),
      brightnessScore: round2(clamp01(brightnessScore)),
    }
  } catch {
    return null
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h, s, l }
}

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function stdDev(arr: number[], avg: number): number {
  const variance = arr.reduce((s, v) => s + (v - avg) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}
