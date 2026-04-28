import { describe, it, expect } from 'vitest'
import { buildExportFileName } from '@/lib/batch-export'
import { findFormatById } from '@/lib/meta-formats'

describe('buildExportFileName', () => {
  it('includes the original base name', () => {
    const format = findFormatById('feed-square')!
    const name = buildExportFileName('minha-foto.jpg', format)
    expect(name).toContain('minha-foto')
  })

  it('includes the format id', () => {
    const format = findFormatById('feed-square')!
    const name = buildExportFileName('foto.jpg', format)
    expect(name).toContain('feed-square')
  })

  it('includes the format dimensions', () => {
    const format = findFormatById('feed-landscape')!
    const name = buildExportFileName('foto.jpg', format)
    expect(name).toContain('1200x628')
  })

  it('strips the original extension', () => {
    const format = findFormatById('feed-square')!
    const name = buildExportFileName('photo.png', format)
    expect(name).not.toContain('.png_')
  })

  it('ends with .jpg', () => {
    const format = findFormatById('reels')!
    const name = buildExportFileName('photo.jpg', format)
    expect(name.endsWith('.jpg')).toBe(true)
  })

  it('handles filenames without extension', () => {
    const format = findFormatById('stories')!
    const name = buildExportFileName('photo', format)
    expect(name).toContain('photo')
  })
})
