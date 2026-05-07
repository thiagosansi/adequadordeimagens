import { GRID_SIZE } from './text-overlay'

// Minimum absolute edge density for a cell to be considered text.
// Raised from 0.07 to reduce false positives on textured/patterned backgrounds.
const ABSOLUTE_THRESHOLD = 0.12

// A cell is only flagged when its density is also this many times above the image median.
// Prevents patterned backgrounds (uniformly high edge density) from being flagged:
// if every cell has similar density, none stand out as "text-like".
const RELATIVE_MULTIPLIER = 1.6

// Cells with extreme density are flagged regardless of the relative check —
// catches images that are almost entirely text (poster, screenshot).
const EXTREME_THRESHOLD = 0.30

const CONTRAST_THRESHOLD = 30 // 0–255 luminance difference (raised from 20)

/**
 * Analyses a canvas-drawn image and returns the set of 5x5 grid cells
 * that likely contain text, based on edge density (contrast between adjacent pixels).
 *
 * This is a heuristic — it is not OCR. It uses two complementary criteria:
 *  1. Absolute: density > ABSOLUTE_THRESHOLD (filters low-edge cells)
 *  2. Relative: density > RELATIVE_MULTIPLIER × median (filters globally-complex images)
 *  3. Extreme: density > EXTREME_THRESHOLD always flags (catches all-text images)
 *
 * Checks 4 directions (H, V, D↘, D↙) for better coverage of anti-aliased strokes.
 */
export function detectTextCells(img: HTMLImageElement): Set<number> {
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 600 / img.naturalWidth)
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)

  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const cellW = Math.floor(width / GRID_SIZE)
  const cellH = Math.floor(height / GRID_SIZE)
  const totalCells = GRID_SIZE * GRID_SIZE

  // Pass 1: compute density for every cell
  const densities: number[] = new Array(totalCells).fill(0)

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const x0 = col * cellW
      const y0 = row * cellH
      const x1 = Math.min(x0 + cellW, width - 1)
      const y1 = Math.min(y0 + cellH, height - 1)

      let edgeCount = 0
      let comparisons = 0

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4
          const luma = luminance(data[i]!, data[i + 1]!, data[i + 2]!)

          // Right
          if (x + 1 < x1) {
            const j = (y * width + (x + 1)) * 4
            if (Math.abs(luma - luminance(data[j]!, data[j + 1]!, data[j + 2]!)) > CONTRAST_THRESHOLD) edgeCount++
            comparisons++
          }
          // Down
          if (y + 1 < y1) {
            const j = ((y + 1) * width + x) * 4
            if (Math.abs(luma - luminance(data[j]!, data[j + 1]!, data[j + 2]!)) > CONTRAST_THRESHOLD) edgeCount++
            comparisons++
          }
          // Diagonal ↘
          if (x + 1 < x1 && y + 1 < y1) {
            const j = ((y + 1) * width + (x + 1)) * 4
            if (Math.abs(luma - luminance(data[j]!, data[j + 1]!, data[j + 2]!)) > CONTRAST_THRESHOLD) edgeCount++
            comparisons++
          }
          // Diagonal ↙
          if (x - 1 >= x0 && y + 1 < y1) {
            const j = ((y + 1) * width + (x - 1)) * 4
            if (Math.abs(luma - luminance(data[j]!, data[j + 1]!, data[j + 2]!)) > CONTRAST_THRESHOLD) edgeCount++
            comparisons++
          }
        }
      }

      densities[row * GRID_SIZE + col] = comparisons > 0 ? edgeCount / comparisons : 0
    }
  }

  // Pass 2: compute median density across all cells
  const sorted = [...densities].sort((a, b) => a - b)
  const median = sorted[Math.floor(totalCells / 2)]!

  // Pass 3: flag cells that exceed both absolute and relative thresholds
  const detectedCells = new Set<number>()
  for (let i = 0; i < totalCells; i++) {
    const d = densities[i]!
    const exceedsAbsolute = d > ABSOLUTE_THRESHOLD
    const exceedsRelative = d > RELATIVE_MULTIPLIER * median
    const isExtreme = d > EXTREME_THRESHOLD
    if ((exceedsAbsolute && exceedsRelative) || isExtreme) {
      detectedCells.add(i)
    }
  }

  return detectedCells
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}
