import { describe, it, expect } from 'vitest'
import { validateRequirements } from '@/lib/requirements-validator'
import { findFormatById } from '@/lib/meta-formats'

function makeFile(name: string, type: string, sizeBytes: number): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type })
  return new File([blob], name, { type })
}

const squareFormat = findFormatById('feed-square')!
const storiesFormat = findFormatById('stories')!

describe('validateRequirements', () => {
  it('returns a requirement for each rule', () => {
    const file = makeFile('test.jpg', 'image/jpeg', 1024 * 1024)
    const reqs = validateRequirements(file, 1080, 1080, squareFormat)
    const ids = reqs.map((r) => r.id)
    expect(ids).toContain('file-size')
    expect(ids).toContain('file-format')
    expect(ids).toContain('resolution')
    expect(ids).toContain('aspect-ratio')
  })

  it('adds safe-zone requirement for stories format', () => {
    const file = makeFile('test.jpg', 'image/jpeg', 1024)
    const reqs = validateRequirements(file, 1080, 1920, storiesFormat)
    expect(reqs.some((r) => r.id === 'safe-zone')).toBe(true)
  })

  it('does NOT add safe-zone requirement for feed format', () => {
    const file = makeFile('test.jpg', 'image/jpeg', 1024)
    const reqs = validateRequirements(file, 1080, 1080, squareFormat)
    expect(reqs.some((r) => r.id === 'safe-zone')).toBe(false)
  })

  describe('file-size', () => {
    it('passes for file under 30MB', () => {
      const file = makeFile('ok.jpg', 'image/jpeg', 10 * 1024 * 1024)
      const reqs = validateRequirements(file, 1080, 1080, squareFormat)
      expect(reqs.find((r) => r.id === 'file-size')?.status).toBe('pass')
    })

    it('fails for file over 30MB', () => {
      const file = makeFile('big.jpg', 'image/jpeg', 31 * 1024 * 1024)
      const reqs = validateRequirements(file, 1080, 1080, squareFormat)
      expect(reqs.find((r) => r.id === 'file-size')?.status).toBe('fail')
    })
  })

  describe('file-format', () => {
    it('passes for JPEG', () => {
      const file = makeFile('img.jpg', 'image/jpeg', 1024)
      const reqs = validateRequirements(file, 1080, 1080, squareFormat)
      expect(reqs.find((r) => r.id === 'file-format')?.status).toBe('pass')
    })

    it('passes for PNG', () => {
      const file = makeFile('img.png', 'image/png', 1024)
      const reqs = validateRequirements(file, 1080, 1080, squareFormat)
      expect(reqs.find((r) => r.id === 'file-format')?.status).toBe('pass')
    })

    it('passes for WebP', () => {
      const file = makeFile('img.webp', 'image/webp', 1024)
      const reqs = validateRequirements(file, 1080, 1080, squareFormat)
      expect(reqs.find((r) => r.id === 'file-format')?.status).toBe('pass')
    })

    it('fails for unsupported format', () => {
      const file = makeFile('img.bmp', 'image/bmp', 1024)
      const reqs = validateRequirements(file, 1080, 1080, squareFormat)
      expect(reqs.find((r) => r.id === 'file-format')?.status).toBe('fail')
    })
  })

  describe('resolution', () => {
    it('passes when shortest side >= 600px', () => {
      const file = makeFile('img.jpg', 'image/jpeg', 1024)
      const reqs = validateRequirements(file, 1080, 1080, squareFormat)
      expect(reqs.find((r) => r.id === 'resolution')?.status).toBe('pass')
    })

    it('fails when shortest side < 600px', () => {
      const file = makeFile('img.jpg', 'image/jpeg', 1024)
      const reqs = validateRequirements(file, 400, 400, squareFormat)
      expect(reqs.find((r) => r.id === 'resolution')?.status).toBe('fail')
    })

    it('fails when width is ok but height is too small', () => {
      const file = makeFile('img.jpg', 'image/jpeg', 1024)
      const reqs = validateRequirements(file, 1200, 400, squareFormat)
      expect(reqs.find((r) => r.id === 'resolution')?.status).toBe('fail')
    })
  })

  describe('aspect-ratio', () => {
    it('passes when image matches format ratio exactly', () => {
      const file = makeFile('img.jpg', 'image/jpeg', 1024)
      // Feed square 1:1
      const reqs = validateRequirements(file, 1080, 1080, squareFormat)
      expect(reqs.find((r) => r.id === 'aspect-ratio')?.status).toBe('pass')
    })

    it('returns warning when ratio is different', () => {
      const file = makeFile('img.jpg', 'image/jpeg', 1024)
      // Wide image (16:9) vs square format (1:1)
      const reqs = validateRequirements(file, 1920, 1080, squareFormat)
      expect(reqs.find((r) => r.id === 'aspect-ratio')?.status).toBe('warning')
    })
  })

  it('all requirements have required fields', () => {
    const file = makeFile('img.jpg', 'image/jpeg', 1024)
    const reqs = validateRequirements(file, 1080, 1080, squareFormat)
    for (const req of reqs) {
      expect(req.id).toBeTruthy()
      expect(req.label).toBeTruthy()
      expect(req.message).toBeTruthy()
      expect(['pass', 'fail', 'warning']).toContain(req.status)
    }
  })
})
