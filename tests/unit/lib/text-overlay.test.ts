import { describe, it, expect } from 'vitest'
import {
  calculateTextPercentage,
  getTextOverlayStatus,
  GRID_SIZE,
  TEXT_WARNING_THRESHOLD,
} from '@/lib/text-overlay'

describe('GRID_SIZE', () => {
  it('is 5', () => {
    expect(GRID_SIZE).toBe(5)
  })
})

describe('TEXT_WARNING_THRESHOLD', () => {
  it('is 20 percent', () => {
    expect(TEXT_WARNING_THRESHOLD).toBe(20)
  })
})

describe('calculateTextPercentage', () => {
  it('returns 0 when no cells are checked', () => {
    const checked = new Set<number>()
    expect(calculateTextPercentage(checked)).toBe(0)
  })

  it('returns 100 when all 25 cells are checked', () => {
    const checked = new Set(Array.from({ length: 25 }, (_, i) => i))
    expect(calculateTextPercentage(checked)).toBe(100)
  })

  it('returns 20 when 5 cells are checked', () => {
    const checked = new Set([0, 1, 2, 3, 4])
    expect(calculateTextPercentage(checked)).toBe(20)
  })

  it('returns 4 when 1 cell is checked', () => {
    const checked = new Set([0])
    expect(calculateTextPercentage(checked)).toBe(4)
  })

  it('returns integer values', () => {
    const checked = new Set([0, 1, 2])
    const result = calculateTextPercentage(checked)
    expect(Number.isInteger(result)).toBe(true)
  })
})

describe('getTextOverlayStatus', () => {
  it('returns pass when percentage is 0', () => {
    expect(getTextOverlayStatus(0)).toBe('pass')
  })

  it('returns pass when percentage is exactly 20', () => {
    expect(getTextOverlayStatus(20)).toBe('pass')
  })

  it('returns fail when percentage exceeds 20', () => {
    expect(getTextOverlayStatus(24)).toBe('fail')
  })

  it('returns fail when percentage is 100', () => {
    expect(getTextOverlayStatus(100)).toBe('fail')
  })
})
