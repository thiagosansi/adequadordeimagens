/**
 * Client-side helper for the /api/ai-process route handler.
 * Replaces the old processImageWithAI server action which failed with
 * "Maximum array nesting exceeded" when serializing large base64 payloads.
 */

export type AIMode = 'smart-crop' | 'generative-fill'

export type AIResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string; quotaExceeded?: boolean }

export async function processImageWithAI(
  dataUrl: string,
  width: number,
  height: number,
  mode: AIMode,
): Promise<AIResult> {
  try {
    const response = await fetch('/api/ai-process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, width, height, mode }),
    })

    if (response.status === 429) {
      const data = await response.json() as { error?: string }
      return {
        ok: false,
        error: data.error ?? 'Limite de IA atingido.',
        quotaExceeded: true,
      }
    }

    if (!response.ok) {
      return { ok: false, error: `Erro do servidor: ${response.status}` }
    }

    return await response.json() as AIResult
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao chamar a IA'
    return { ok: false, error: message }
  }
}
