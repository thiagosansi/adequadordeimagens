import { describe, it, expect } from 'vitest'
import { META_FORMATS, findFormatById, getAspectRatio } from '@/lib/meta-formats'

describe('META_FORMATS', () => {
  it('has 5 formats', () => {
    expect(META_FORMATS).toHaveLength(5)
  })

  it('all formats have required fields', () => {
    for (const fmt of META_FORMATS) {
      expect(fmt.id).toBeTruthy()
      expect(fmt.label).toBeTruthy()
      expect(fmt.width).toBeGreaterThan(0)
      expect(fmt.height).toBeGreaterThan(0)
      expect(fmt.ratio).toBeTruthy()
      expect(fmt.useCase).toBeTruthy()
      expect(['feed', 'stories', 'reels']).toContain(fmt.category)
    }
  })

  it('contains feed-square 1080x1080', () => {
    const fmt = META_FORMATS.find((f) => f.id === 'feed-square')
    expect(fmt?.width).toBe(1080)
    expect(fmt?.height).toBe(1080)
  })

  it('contains feed-portrait 1080x1350', () => {
    const fmt = META_FORMATS.find((f) => f.id === 'feed-portrait')
    expect(fmt?.width).toBe(1080)
    expect(fmt?.height).toBe(1350)
  })

  it('contains feed-landscape 1200x628', () => {
    const fmt = META_FORMATS.find((f) => f.id === 'feed-landscape')
    expect(fmt?.width).toBe(1200)
    expect(fmt?.height).toBe(628)
  })

  it('stories and reels have safe zone defined', () => {
    const stories = META_FORMATS.find((f) => f.id === 'stories')
    const reels = META_FORMATS.find((f) => f.id === 'reels')
    expect(stories?.safeZone).toEqual({ top: 14, bottom: 14 })
    expect(reels?.safeZone).toEqual({ top: 14, bottom: 14 })
  })
})

describe('findFormatById', () => {
  it('returns format when found', () => {
    const fmt = findFormatById('feed-square')
    expect(fmt?.id).toBe('feed-square')
  })

  it('returns undefined when not found', () => {
    expect(findFormatById('nonexistent')).toBeUndefined()
  })
})

describe('getAspectRatio', () => {
  it('returns 1 for square format', () => {
    const fmt = findFormatById('feed-square')!
    expect(getAspectRatio(fmt)).toBe(1)
  })

  it('returns correct ratio for landscape', () => {
    const fmt = findFormatById('feed-landscape')!
    expect(getAspectRatio(fmt)).toBeCloseTo(1200 / 628, 5)
  })

  it('returns ratio less than 1 for portrait formats', () => {
    const portrait = findFormatById('feed-portrait')!
    expect(getAspectRatio(portrait)).toBeLessThan(1)
  })
})
