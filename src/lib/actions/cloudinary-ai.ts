'use server'

import { v2 as cloudinary } from 'cloudinary'

type Credentials = {
  cloud_name: string
  api_key: string
  api_secret: string
}

/**
 * Returns one set of credentials.
 * If CLOUDINARY_CREDENTIALS is set (JSON array), picks one at random.
 * Otherwise falls back to the individual CLOUDINARY_* env vars.
 *
 * CLOUDINARY_CREDENTIALS format:
 * [
 *   {"cloud_name":"x","api_key":"y","api_secret":"z"},
 *   {"cloud_name":"a","api_key":"b","api_secret":"c"}
 * ]
 */
function pickCredentials(): Credentials {
  const raw = process.env.CLOUDINARY_CREDENTIALS
  if (raw) {
    const pool = JSON.parse(raw) as Credentials[]
    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)]!
    }
  }
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    api_key: process.env.CLOUDINARY_API_KEY ?? '',
    api_secret: process.env.CLOUDINARY_API_SECRET ?? '',
  }
}

export type AIMode = 'smart-crop' | 'generative-fill'

/**
 * Fetches a Cloudinary transformation URL with exponential backoff.
 * AI transformations (gen_fill, smart-crop) are processed asynchronously —
 * the first request may return a non-200 status while Cloudinary queues the job.
 */
async function fetchWithRetry(
  url: string,
  maxAttempts = 8,
  initialDelayMs = 1500,
): Promise<ArrayBuffer> {
  let delay = initialDelayMs
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(url)
    if (response.ok) {
      return response.arrayBuffer()
    }
    // 423 = transformation queued/processing; retry on that and 5xx
    const retryable = response.status === 423 || response.status >= 500
    if (!retryable || attempt === maxAttempts) {
      throw new Error(
        `Cloudinary: ${response.status} ${response.statusText} (tentativa ${attempt}/${maxAttempts})`,
      )
    }
    await new Promise((r) => setTimeout(r, delay))
    delay = Math.min(delay * 1.5, 8000) // cap at 8 s
  }
  throw new Error('Cloudinary: tempo limite excedido aguardando processamento da IA')
}

export async function processImageWithAI(
  dataUrl: string,
  width: number,
  height: number,
  mode: AIMode,
): Promise<string> {
  const creds = pickCredentials()

  if (!creds.api_secret) {
    throw new Error('Credenciais Cloudinary não configuradas.')
  }

  // Configure per-request so the pool takes effect on every call
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
            width,
            height,
            crop: 'fill',
            gravity: 'auto:subject',
            fetch_format: 'jpg',
            quality: 90,
            secure: true,
          })
        : cloudinary.url(uploaded.public_id, {
            width,
            height,
            crop: 'pad',
            background: 'gen_fill',
            fetch_format: 'jpg',
            quality: 90,
            secure: true,
          })

    const buffer = await fetchWithRetry(transformUrl)
    const base64 = Buffer.from(buffer).toString('base64')
    return 'data:image/jpeg;base64,' + base64
  } finally {
    await cloudinary.uploader.destroy(uploaded.public_id).catch(() => null)
  }
}
