'use server'

import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export type AIMode = 'smart-crop' | 'generative-fill'

export async function processImageWithAI(
  dataUrl: string,
  width: number,
  height: number,
  mode: AIMode,
): Promise<string> {
  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error('CLOUDINARY_API_SECRET não configurado.')
  }

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
    // Always delete — cleanup independent of success or failure
    await cloudinary.uploader.destroy(uploaded.public_id).catch(() => null)
  }
}
