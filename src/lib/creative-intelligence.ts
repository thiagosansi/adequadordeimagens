import type { ImageAnalysis } from './image-analyser'

export type ChannelId = 'Meta' | 'TikTok' | 'Google' | 'LinkedIn'

export type ChannelScore = {
  channel: ChannelId
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  color: string
  recommendations: string[]
}

// Channel-specific weight profiles — what each platform rewards most
const CHANNEL_PROFILES: Record<ChannelId, {
  contrastWeight: number
  saturationWeight: number
  brightnessIdeal: number   // 0–1, distance from this = penalty
  textPenaltyThreshold: number  // % text coverage that triggers penalty
  color: string
}> = {
  Meta: {
    contrastWeight: 0.35,
    saturationWeight: 0.35,
    brightnessIdeal: 0.55,
    textPenaltyThreshold: 15,
    color: '#1877f2',
  },
  TikTok: {
    contrastWeight: 0.25,
    saturationWeight: 0.50, // vibrant/saturated content stops scroll
    brightnessIdeal: 0.52,
    textPenaltyThreshold: 20,
    color: '#ff0050',
  },
  Google: {
    contrastWeight: 0.50, // display ads rely heavily on contrast
    saturationWeight: 0.25,
    brightnessIdeal: 0.58,
    textPenaltyThreshold: 30,
    color: '#4285f4',
  },
  LinkedIn: {
    contrastWeight: 0.40,
    saturationWeight: 0.20, // professional look — lower saturation ok
    brightnessIdeal: 0.60,
    textPenaltyThreshold: 25,
    color: '#0a66c2',
  },
}

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 50) return 'C'
  return 'D'
}

function buildRecommendations(
  channel: ChannelId,
  analysis: ImageAnalysis,
  textPercent: number | undefined,
): string[] {
  const recs: string[] = []
  const { contrastScore, saturationScore, brightnessScore } = analysis
  const profile = CHANNEL_PROFILES[channel]

  if (contrastScore < 0.15) {
    recs.push('Aumente o contraste — criativos de baixo contraste têm menor stop-scroll')
  }

  if (saturationScore < 0.20 && channel === 'TikTok') {
    recs.push('Cores mais vibrantes performam melhor no TikTok — considere aumentar a saturação')
  }

  if (saturationScore < 0.15 && channel === 'Meta') {
    recs.push('Cores apagadas tendem a ter menor CTR no feed — use paleta mais viva')
  }

  if (brightnessScore < 0.30) {
    recs.push('Imagem muito escura — pode perder visibilidade nos feeds')
  } else if (brightnessScore > 0.80) {
    recs.push('Imagem muito clara — risco de baixo contraste com fundo branco')
  }

  if (textPercent !== undefined && textPercent > profile.textPenaltyThreshold) {
    if (channel === 'Meta') {
      recs.push(`Texto ocupa ${textPercent.toFixed(0)}% — Meta penaliza acima de 20% (regra dos 20%)`)
    } else {
      recs.push(`Texto ocupa ${textPercent.toFixed(0)}% da imagem — reduza para melhor performance`)
    }
  }

  if (channel === 'LinkedIn' && saturationScore > 0.70) {
    recs.push('Saturação muito alta para LinkedIn — prefira paleta mais profissional')
  }

  if (channel === 'Google' && contrastScore < 0.20) {
    recs.push('Display ads exigem alto contraste — a imagem pode se perder na página')
  }

  // Positive tip when no issues
  if (recs.length === 0) {
    const tips: Record<ChannelId, string> = {
      Meta: 'Criativo bem equilibrado para o feed Meta — mantenha o rosto visível no primeiro frame',
      TikTok: 'Boa saturação para TikTok — adicione movimento nos primeiros 3s para aumentar retenção',
      Google: 'Alto contraste ideal para display — certifique-se de que o produto é o foco visual',
      LinkedIn: 'Tom profissional adequado — inclua dado ou métrica no criativo para aumentar CTR',
    }
    recs.push(tips[channel])
  }

  return recs.slice(0, 2) // max 2 recommendations per channel
}

export function computeCreativeIntelligence(
  analysis: ImageAnalysis | null,
  textCoveragePercent?: number,
): ChannelScore[] {
  if (!analysis) return []

  const channels: ChannelId[] = ['Meta', 'TikTok', 'Google', 'LinkedIn']

  return channels.map((channel) => {
    const profile = CHANNEL_PROFILES[channel]
    const { contrastScore, saturationScore, brightnessScore } = analysis

    // Base score 100, weighted by channel profile
    let score = 100

    // Contrast penalty/bonus
    const contrastNorm = Math.min(contrastScore / 0.35, 1) // normalise to 0–1
    score -= (1 - contrastNorm) * profile.contrastWeight * 40

    // Saturation penalty/bonus
    const satNorm = Math.min(saturationScore / 0.55, 1)
    score -= (1 - satNorm) * profile.saturationWeight * 40

    // Brightness distance from ideal
    const brightDist = Math.abs(brightnessScore - profile.brightnessIdeal)
    score -= brightDist * 20

    // Text coverage penalty
    if (textCoveragePercent !== undefined && textCoveragePercent > profile.textPenaltyThreshold) {
      const excess = textCoveragePercent - profile.textPenaltyThreshold
      score -= Math.min(excess * 1.2, 20)
    }

    score = Math.round(Math.max(0, Math.min(100, score)))

    return {
      channel,
      score,
      grade: scoreToGrade(score),
      color: profile.color,
      recommendations: buildRecommendations(channel, analysis, textCoveragePercent),
    }
  })
}
