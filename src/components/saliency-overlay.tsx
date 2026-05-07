'use client'

import { useEffect, useRef } from 'react'
import type { SaliencyResult } from '@/lib/saliency'

type Props = {
  result: SaliencyResult
  /** Rendered image dimensions (CSS pixels) */
  imgWidth: number
  imgHeight: number
}

/**
 * Canvas overlay that renders a jet-colormap heatmap + focal-point crosshair
 * on top of the original image. Position with `absolute inset-0`.
 */
export function SaliencyOverlay({ result, imgWidth, imgHeight }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = imgWidth
    canvas.height = imgHeight

    const ctx = canvas.getContext('2d', { willReadFrequently: false })!
    ctx.clearRect(0, 0, imgWidth, imgHeight)

    const { scores, size, focal, srcWidth, srcHeight } = result

    // Draw heatmap cells
    const cellW = imgWidth / size
    const cellH = imgHeight / size

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const v = scores[row * size + col]
        if (v < 0.15) continue // skip near-zero cells — keep image visible

        const [r, g, b] = jetColormap(v)
        const alpha = 0.55 * smoothstep(0.15, 0.45, v)
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.fillRect(
          Math.round(col * cellW),
          Math.round(row * cellH),
          Math.ceil(cellW),
          Math.ceil(cellH),
        )
      }
    }

    // Focal point crosshair
    const fx = (focal.x / srcWidth) * imgWidth
    const fy = (focal.y / srcHeight) * imgHeight
    const R = 12

    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(fx - R, fy); ctx.lineTo(fx + R, fy)
    ctx.moveTo(fx, fy - R); ctx.lineTo(fx, fy + R)
    ctx.stroke()

    ctx.strokeStyle = '#2563EB'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(fx - R, fy); ctx.lineTo(fx + R, fy)
    ctx.moveTo(fx, fy - R); ctx.lineTo(fx, fy + R)
    ctx.stroke()

    // Focal circle
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(fx, fy, 5, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = '#2563EB'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(fx, fy, 5, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }, [result, imgWidth, imgHeight])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ width: imgWidth, height: imgHeight }}
    />
  )
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Jet colormap: blue → cyan → green → yellow → red */
function jetColormap(t: number): [number, number, number] {
  // piecewise linear approximation
  const r = clamp255(255 * jetR(t))
  const g = clamp255(255 * jetG(t))
  const b = clamp255(255 * jetB(t))
  return [r, g, b]
}

function jetR(t: number): number {
  if (t < 0.35) return 0
  if (t < 0.66) return (t - 0.35) / 0.31
  if (t < 0.89) return 1
  return 1 - (t - 0.89) / 0.11
}
function jetG(t: number): number {
  if (t < 0.125) return 0
  if (t < 0.375) return (t - 0.125) / 0.25
  if (t < 0.625) return 1
  if (t < 0.875) return 1 - (t - 0.625) / 0.25
  return 0
}
function jetB(t: number): number {
  if (t < 0.11) return 0.5 + t / 0.22
  if (t < 0.34) return 1
  if (t < 0.65) return 1 - (t - 0.34) / 0.31
  return 0
}

function clamp255(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
