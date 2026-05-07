import { describe, it, expect } from 'vitest'
import { buildCarouselFileName } from '@/lib/carousel-processor'
import { findFormatById } from '@/lib/meta-formats'

const square = findFormatById('feed-square')!
const portrait = findFormatById('feed-portrait')!

describe('buildCarouselFileName', () => {
  it('pads single digit index with leading zero', () => {
    expect(buildCarouselFileName(0, square)).toMatch(/^card-01_/)
    expect(buildCarouselFileName(8, square)).toMatch(/^card-09_/)
  })

  it('includes dimensions', () => {
    expect(buildCarouselFileName(0, square)).toContain('1080x1080')
    expect(buildCarouselFileName(0, portrait)).toContain('1080x1350')
  })

  it('ends with .jpg', () => {
    expect(buildCarouselFileName(0, square).endsWith('.jpg')).toBe(true)
  })

  it('uses 1-based numbering', () => {
    expect(buildCarouselFileName(0, square)).toMatch(/card-01/)
    expect(buildCarouselFileName(9, square)).toMatch(/card-10/)
  })
})
