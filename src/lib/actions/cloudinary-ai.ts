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
    folder: 'adequador-temp',
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

    const response = await fetch(transformUrl)
    if (!response.ok) {
      throw new Error('Cloudinary: ' + response.status + ' ' + response.statusText)
    }

    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return 'data:image/jpeg;base64,' + base64
  } finally {
    await cloudinary.uploader.destroy(uploaded.public_id).catch(() => null)
  }
}
