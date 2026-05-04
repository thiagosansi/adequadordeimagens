import type { MetaFormat, Requirement } from '@/shared/types/image'
import { analyseSafeZoneContent } from './canvas-renderer'
import { getPlatformRules } from './platform-rules'

// Variance score above this threshold = significant content detected in the zone
const SAFE_ZONE_CONTENT_THRESHOLD = 0.04

export function validateRequirements(
  file: File,
  imgWidth: number,
  imgHeight: number,
  format: MetaFormat,
): Requirement[] {
  const rules = getPlatformRules(format.platform)
  const requirements: Requirement[] = [
    validateFileSize(file, rules.maxFileSizeMB),
    validateFileFormat(file, rules.acceptedMimeTypes, rules.platformName),
    validateResolution(imgWidth, imgHeight, rules.minDimensionPx),
    validateAspectRatio(imgWidth, imgHeight, format),
  ]

  if (format.safeZone) {
    requirements.push(buildSafeZoneWarning(format, rules.platformName))
  }

  return requirements
}

export async function validateRequirementsWithSafeZone(
  file: File,
  img: HTMLImageElement,
  format: MetaFormat,
): Promise<Requirement[]> {
  const rules = getPlatformRules(format.platform)
  const requirements: Requirement[] = [
    validateFileSize(file, rules.maxFileSizeMB),
    validateFileFormat(file, rules.acceptedMimeTypes, rules.platformName),
    validateResolution(img.naturalWidth, img.naturalHeight, rules.minDimensionPx),
    validateAspectRatio(img.naturalWidth, img.naturalHeight, format),
  ]

  if (format.safeZone) {
    const scores = analyseSafeZoneContent(img, format.safeZone)
    requirements.push(buildSafeZoneResult(format, scores, rules.safeZoneCoveredBy))
  }

  return requirements
}

function validateFileSize(file: File, maxFileSizeMB: number): Requirement {
  const sizeMB = file.size / (1024 * 1024)
  const pass = sizeMB <= maxFileSizeMB
  return {
    id: 'file-size',
    label: 'Tamanho do arquivo',
    status: pass ? 'pass' : 'fail',
    message: pass
      ? `${sizeMB.toFixed(1)} MB (máx. ${maxFileSizeMB} MB)`
      : `${sizeMB.toFixed(1)} MB — excede ${maxFileSizeMB} MB. A imagem será comprimida no download.`,
  }
}

function validateFileFormat(file: File, acceptedMimeTypes: string[], platformName: string): Requirement {
  const pass = acceptedMimeTypes.includes(file.type)
  const ext = file.type.split('/')[1]?.toUpperCase() ?? 'desconhecido'
  const acceptedExts = acceptedMimeTypes.map((m) => m.split('/')[1]!.toUpperCase()).join(', ')
  return {
    id: 'file-format',
    label: 'Formato do arquivo',
    status: pass ? 'pass' : 'fail',
    message: pass
      ? `${ext} — aceito pelo ${platformName}`
      : `${ext} — use ${acceptedExts}`,
  }
}

function validateResolution(imgWidth: number, imgHeight: number, minDimensionPx: number): Requirement {
  const shortSide = Math.min(imgWidth, imgHeight)
  const pass = shortSide >= minDimensionPx
  return {
    id: 'resolution',
    label: 'Resolução mínima',
    status: pass ? 'pass' : 'fail',
    message: pass
      ? `${imgWidth}×${imgHeight} px — resolução adequada`
      : `${imgWidth}×${imgHeight} px — mínimo de ${minDimensionPx} px no lado menor`,
  }
}

function validateAspectRatio(imgWidth: number, imgHeight: number, format: MetaFormat): Requirement {
  const srcRatio = imgWidth / imgHeight
  const targetRatio = format.width / format.height
  const diff = Math.abs(srcRatio - targetRatio) / targetRatio

  let status: Requirement['status']
  let message: string

  if (diff < 0.02) {
    status = 'pass'
    message = `Proporção ${format.ratio} — perfeita para este formato`
  } else if (diff < 0.3) {
    status = 'warning'
    message = `Proporção diferente — será feito um corte para encaixar em ${format.ratio}`
  } else {
    status = 'warning'
    message = `Proporção bem diferente — corte significativo necessário para ${format.ratio}`
  }

  return {
    id: 'aspect-ratio',
    label: 'Proporção da imagem',
    status,
    message,
  }
}

function buildSafeZoneWarning(format: MetaFormat, platformName: string): Requirement {
  const sz = format.safeZone!
  const parts: string[] = []
  if (sz.top) parts.push(`topo ${sz.top}%`)
  if (sz.bottom) parts.push(`base ${sz.bottom}%`)
  if (sz.left) parts.push(`esquerda ${sz.left}%`)
  if (sz.right) parts.push(`direita ${sz.right}%`)
  return {
    id: 'safe-zone',
    label: 'Área segura',
    status: 'warning',
    message: `${format.label}: mantenha conteúdo fora de ${parts.join(', ')} — reservados pelo ${platformName}`,
  }
}

function buildSafeZoneResult(
  format: MetaFormat,
  scores: { topScore: number; bottomScore: number; leftScore: number; rightScore: number },
  safeZoneCoveredBy: string,
): Requirement {
  const sz = format.safeZone!
  const { topScore, bottomScore, leftScore, rightScore } = scores

  const violations: string[] = []
  if (sz.top && topScore > SAFE_ZONE_CONTENT_THRESHOLD) violations.push(`topo (${sz.top}%)`)
  if (sz.bottom && bottomScore > SAFE_ZONE_CONTENT_THRESHOLD) violations.push(`base (${sz.bottom}%)`)
  if (sz.left && leftScore > SAFE_ZONE_CONTENT_THRESHOLD) violations.push(`esquerda (${sz.left}%)`)
  if (sz.right && rightScore > SAFE_ZONE_CONTENT_THRESHOLD) violations.push(`direita (${sz.right}%)`)

  const isStoriesOrReels = format.category === 'stories' || format.category === 'reels'
  const reason = isStoriesOrReels
    ? `coberta pela ${safeZoneCoveredBy}`
    : 'cortada em placements que exibem o formato como 1:1'

  if (violations.length === 0) {
    const safeParts: string[] = []
    if (sz.top) safeParts.push(`topo ${sz.top}%`)
    if (sz.bottom) safeParts.push(`base ${sz.bottom}%`)
    if (sz.left) safeParts.push(`esquerda ${sz.left}%`)
    if (sz.right) safeParts.push(`direita ${sz.right}%`)
    return {
      id: 'safe-zone',
      label: 'Área segura',
      status: 'pass',
      message: `Conteúdo dentro da área segura — ${safeParts.join(', ')} livres`,
    }
  }

  return {
    id: 'safe-zone',
    label: 'Área segura',
    status: 'warning',
    message: `Conteúdo detectado na zona restrita: ${violations.join(' e ')}. Essa área pode ser ${reason}`,
  }
}
