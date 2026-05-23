import { describe, it, expect } from 'vitest'
import { META_FORMATS, findFormatById, getAspectRatio } from '@/lib/meta-formats'

describe('META_FORMATS', () => {
  it('has 4 formats', () => {
    expect(META_FORMATS).toHaveLength(4)
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

  it('contains meta-feed-square 1080x1080', () => {
    const fmt = META_FORMATS.find((f) => f.id === 'meta-feed-square')
    expect(fmt?.width).toBe(1080)
    expect(fmt?.height).toBe(1080)
  })

  it('contains meta-feed-portrait 1080x1350', () => {
    const fmt = META_FORMATS.find((f) => f.id === 'meta-feed-portrait')
    expect(fmt?.width).toBe(1080)
    expect(fmt?.height).toBe(1350)
  })

  it('contains meta-feed-landscape 1200x628', () => {
    const fmt = META_FORMATS.find((f) => f.id === 'meta-feed-landscape')
    expect(fmt?.width).toBe(1200)
    expect(fmt?.height).toBe(628)
  })

  it('meta-stories has safe zone defined', () => {
    const stories = META_FORMATS.find((f) => f.id === 'meta-stories')
    expect(stories?.safeZone).toBeDefined()
    expect(stories?.safeZone?.top).toBeGreaterThan(0)
  })
})

describe('findFormatById', () => {
  it('returns format when found', () => {
    const fmt = findFormatById('meta-feed-square')
    expect(fmt?.id).toBe('meta-feed-square')
  })

  it('returns undefined when not found', () => {
    expect(findFormatById('nonexistent')).toBeUndefined()
  })
})

describe('getAspectRatio', () => {
  it('returns 1 for square format', () => {
    const fmt = findFormatById('meta-feed-square')!
    expect(getAspectRatio(fmt)).toBe(1)
  })

  it('returns correct ratio for landscape', () => {
    const fmt = findFormatById('meta-feed-landscape')!
    expect(getAspectRatio(fmt)).toBeCloseTo(1200 / 628, 5)
  })

  it('returns ratio less than 1 for portrait formats', () => {
    const portrait = findFormatById('meta-feed-portrait')!
    expect(getAspectRatio(portrait)).toBeLessThan(1)
  })
})
