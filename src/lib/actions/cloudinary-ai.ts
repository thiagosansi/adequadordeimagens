'use server'

// NOTE: cloudinary is imported dynamically (not at module level) because its
// config() runs at import time and throws if CLOUDINARY_URL env var exists but
// has an invalid format (must start with 'cloudinary://'). A static import
// would crash the module before any try/catch could handle it.

export type AIMode = 'smart-crop' | 'generative-fill'

export type AIResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string }

type Credentials = {
  cloud_name: string
  api_key: string
  api_secret: string
}

/**
 * Returns one set of credentials.
 * If CLOUDINARY_CREDENTIALS is set (JSON array), picks one at random.
 * Otherwise falls back to the individual CLOUDINARY_* env vars.
 */
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
    // malformed JSON — fall through to individual vars
  }
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    api_key: process.env.CLOUDINARY_API_KEY ?? '',
    api_secret: process.env.CLOUDINARY_API_SECRET ?? '',
  }
}

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
    delay = Math.min(delay * 1.5, 8000)
  }
  throw new Error('Cloudinary: tempo limite excedido aguardando processamento da IA')
}

/**
 * Processes an image with Cloudinary AI.
 * Returns { ok: true, dataUrl } on success or { ok: false, error } on failure.
 * Never throws — all errors are returned as { ok: false }.
 */
export async function processImageWithAI(
  dataUrl: string,
  width: number,
  height: number,
  mode: AIMode,
): Promise<AIResult> {
  try {
    const creds = pickCredentials()

    if (!creds.api_secret) {
      return {
        ok: false,
        error: 'Credenciais Cloudinary não configuradas. Configure as variáveis de ambiente no Vercel.',
      }
    }

    // Dynamic import — keeps cloudinary's module-level init inside this try/catch.
    // If CLOUDINARY_URL env var is malformed, cloudinary throws at import time;
    // with a static import that would 500 before the function body runs.
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
              width,
              height,
              crop: 'fill',
              gravity: 'auto:subject',
              fetch_format: 'jpg',
              quality: 90,
              secure: true,
              analytics: false,
            })
          : cloudinary.url(uploaded.public_id, {
              width,
              height,
              crop: 'pad',
              background: 'gen_fill',
              fetch_format: 'jpg',
              quality: 90,
              secure: true,
              analytics: false,
            })

      const buffer = await fetchWithRetry(transformUrl)
      const base64 = Buffer.from(buffer).toString('base64')
      return { ok: true, dataUrl: 'data:image/jpeg;base64,' + base64 }
    } finally {
      await cloudinary.uploader.destroy(uploaded.public_id).catch(() => null)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao processar com IA'
    return { ok: false, error: message }
  }
}
