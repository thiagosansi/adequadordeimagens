import { describe, it, expect } from 'vitest'
import { buildCarouselFileName } from '@/lib/carousel-processor'
import { findFormatById } from '@/lib/meta-formats'

const square = findFormatById('meta-feed-square')!
const portrait = findFormatById('meta-feed-portrait')!

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
})
