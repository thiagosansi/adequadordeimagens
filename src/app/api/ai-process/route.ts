import { NextResponse } from 'next/server'

export const maxDuration = 60 // seconds — Cloudinary gen_fill can take a while

type RequestBody = {
  dataUrl: string
  width: number
  height: number
  mode: 'smart-crop' | 'generative-fill'
}

type Credentials = {
  cloud_name: string
  api_key: string
  api_secret: string
}

function pickCredentials(): Credentials {
  try {
    const raw = process.env.CLOUDINARY_CREDENTIALS
    if (raw) {
      const pool = JSON.parse(raw) as Credentials[]
      if (pool.length > 0) {
        return pool[Math.floor(Math.random() * pool.length)]!
      }
    }
  } catch {
    // malformed JSON — fall through
  }
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    api_key: process.env.CLOUDINARY_API_KEY ?? '',
    api_secret: process.env.CLOUDINARY_API_SECRET ?? '',
  }
}

async function fetchWithRetry(
  url: string,
  maxAttempts = 8,
  initialDelayMs = 1500,
): Promise<ArrayBuffer> {
  let delay = initialDelayMs
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(url)
    if (response.ok) return response.arrayBuffer()
    const retryable = response.status === 423 || response.status >= 500
    if (!retryable || attempt === maxAttempts) {
      throw new Error(`Cloudinary: ${response.status} ${response.statusText} (tentativa ${attempt}/${maxAttempts})`)
    }
    await new Promise((r) => setTimeout(r, delay))
    delay = Math.min(delay * 1.5, 8000)
  }
  throw new Error('Cloudinary: tempo limite excedido')
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as RequestBody
    const { dataUrl, width, height, mode } = body

    if (!dataUrl || !width || !height || !mode) {
      return NextResponse.json({ ok: false, error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const creds = pickCredentials()
    if (!creds.api_secret) {
      return NextResponse.json({
        ok: false,
        error: 'Credenciais Cloudinary não configuradas. Configure as variáveis de ambiente no Vercel.',
      })
    }

    const { v2: cloudinary } = await import('cloudinary')
    cloudinary.config({
      cloud_name: creds.cloud_name,
      api_key: creds.api_key,
      api_secret: creds.api_secret,
    })

    const uploaded = await cloudinary.uploader.upload(dataUrl, {
      folder: 'adframe-temp',
      resource_type: 'image',
    })

    try {
      const transformUrl =
        mode === 'smart-crop'
          ? cloudinary.url(uploaded.public_id, {
              width, height, crop: 'fill', gravity: 'auto:subject',
              fetch_format: 'jpg', quality: 90, secure: true, analytics: false,
            })
          : cloudinary.url(uploaded.public_id, {
              width, height, crop: 'pad', background: 'gen_fill',
              fetch_format: 'jpg', quality: 90, secure: true, analytics: false,
            })

      const buffer = await fetchWithRetry(transformUrl)
      const base64 = Buffer.from(buffer).toString('base64')
      return NextResponse.json({ ok: true, dataUrl: 'data:image/jpeg;base64,' + base64 })
    } finally {
      await cloudinary.uploader.destroy(uploaded.public_id).catch(() => null)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao processar com IA'
    console.error('[ai-process] error:', message)
    return NextResponse.json({ ok: false, error: message })
  }
}
