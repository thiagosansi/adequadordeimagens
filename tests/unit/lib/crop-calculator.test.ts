import { describe, it, expect } from 'vitest'
import {
  calculateAutoCrop,
  calculateFitDimensions,
  calculateCoverDimensions,
  percentCropToPixels,
} from '@/lib/crop-calculator'

describe('calculateAutoCrop', () => {
  it('crops sides when source is wider than target', () => {
    // Source: 1920x1080 (16:9), Target: 1080x1080 (1:1)
    const crop = calculateAutoCrop(1920, 1080, 1080, 1080)
    expect(crop.height).toBe(1080)
    expect(crop.width).toBe(1080)
    expect(crop.x).toBe(420) // (1920 - 1080) / 2
    expect(crop.y).toBe(0)
  })

  it('crops top/bottom when source is taller than target', () => {
    // Source: 1080x1920 (9:16), Target: 1080x1080 (1:1)
    const crop = calculateAutoCrop(1080, 1920, 1080, 1080)
    expect(crop.width).toBe(1080)
    expect(crop.height).toBe(1080)
    expect(crop.x).toBe(0)
    expect(crop.y).toBe(420) // (1920 - 1080) / 2
  })

  it('returns full image when source matches target ratio', () => {
    // Source: 1080x1080 (1:1), Target: 1080x1080 (1:1)
    const crop = calculateAutoCrop(1080, 1080, 1080, 1080)
    expect(crop.x).toBe(0)
    expect(crop.y).toBe(0)
    expect(crop.width).toBe(1080)
    expect(crop.height).toBe(1080)
  })

  it('never produces negative offsets', () => {
    const crop = calculateAutoCrop(800, 600, 1200, 628)
    expect(crop.x).toBeGreaterThanOrEqual(0)
    expect(crop.y).toBeGreaterThanOrEqual(0)
  })

  it('crop width and height never exceed source dimensions', () => {
    const srcW = 1000
    const srcH = 800
    const crop = calculateAutoCrop(srcW, srcH, 1080, 1920)
    expect(crop.width).toBeLessThanOrEqual(srcW)
    expect(crop.height).toBeLessThanOrEqual(srcH)
  })
})

describe('calculateFitDimensions', () => {
  it('fits wide image inside square target by capping width', () => {
    // Source 1920x1080 fits inside 1080x1080
    const result = calculateFitDimensions(1920, 1080, 1080, 1080)
    expect(result.drawWidth).toBe(1080)
    expect(result.drawHeight).toBeLessThan(1080)
    expect(result.offsetX).toBe(0)
    expect(result.offsetY).toBeGreaterThan(0)
  })

  it('fits tall image inside landscape target by capping height', () => {
    // Source 1080x1920 fits inside 1200x628
    const result = calculateFitDimensions(1080, 1920, 1200, 628)
    expect(result.drawHeight).toBe(628)
    expect(result.drawWidth).toBeLessThan(1200)
    expect(result.offsetY).toBe(0)
    expect(result.offsetX).toBeGreaterThan(0)
  })

  it('drawn dimensions never exceed target', () => {
    const result = calculateFitDimensions(1600, 900, 1080, 1350)
    expect(result.drawWidth).toBeLessThanOrEqual(1080)
    expect(result.drawHeight).toBeLessThanOrEqual(1350)
  })

  it('drawn dimensions are centered', () => {
    const result = calculateFitDimensions(1920, 1080, 1080, 1080)
    const leftSpace = result.offsetX
    const rightSpace = 1080 - result.drawWidth - leftSpace
    // Allow 1px rounding difference
    expect(Math.abs(leftSpace - rightSpace)).toBeLessThanOrEqual(1)
  })
})

describe('calculateCoverDimensions', () => {
  it('covers square canvas with wide image by scaling to height', () => {
    // Source 1920x1080 covers 1080x1080: must fill height = 1080, width > 1080
    const result = calculateCoverDimensions(1920, 1080, 1080, 1080)
    expect(result.drawHeight).toBe(1080)
    expect(result.drawWidth).toBeGreaterThan(1080)
  })

  it('covers landscape canvas with tall image by scaling to width', () => {
    // Source 1080x1920 covers 1200x628: must fill width = 1200, height > 628
    const result = calculateCoverDimensions(1080, 1920, 1200, 628)
    expect(result.drawWidth).toBe(1200)
    expect(result.drawHeight).toBeGreaterThan(628)
  })
})

describe('percentCropToPixels', () => {
  it('converts 50% crop correctly', () => {
    const pixel = percentCropToPixels({ x: 25, y: 25, width: 50, height: 50 }, 1000, 800)
    expect(pixel.x).toBe(250)
    expect(pixel.y).toBe(200)
    expect(pixel.width).toBe(500)
    expect(pixel.height).toBe(400)
  })

  it('rounds to integer pixels', () => {
    const pixel = percentCropToPixels({ x: 10.5, y: 10.5, width: 79, height: 79 }, 100, 100)
    expect(Number.isInteger(pixel.x)).toBe(true)
    expect(Number.isInteger(pixel.y)).toBe(true)
    expect(Number.isInteger(pixel.width)).toBe(true)
    expect(Number.isInteger(pixel.height)).toBe(true)
  })
})
