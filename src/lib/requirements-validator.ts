import type { MetaFormat, Requirement } from '@/shared/types/image'

const MAX_FILE_SIZE_MB = 30
const MIN_DIMENSION_PX = 600
const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp']

export function validateRequirements(
  file: File,
  imgWidth: number,
  imgHeight: number,
  format: MetaFormat,
): Requirement[] {
  const requirements: Requirement[] = [
    validateFileSize(file),
    validateFileFormat(file),
    validateResolution(imgWidth, imgHeight),
    validateAspectRatio(imgWidth, imgHeight, format),
  ]

  if (format.safeZone) {
    requirements.push(buildSafeZoneWarning(format))
  }

  return requirements
}

function validateFileSize(file: File): Requirement {
  const sizeMB = file.size / (1024 * 1024)
  const pass = sizeMB <= MAX_FILE_SIZE_MB
  return {
    id: 'file-size',
    label: 'Tamanho do arquivo',
    status: pass ? 'pass' : 'fail',
    message: pass
      ? `${sizeMB.toFixed(1)} MB (máx. ${MAX_FILE_SIZE_MB} MB)`
      : `${sizeMB.toFixed(1)} MB — excede ${MAX_FILE_SIZE_MB} MB. A imagem será comprimida no download.`,
  }
}

function validateFileFormat(file: File): Requirement {
  const pass = ACCEPTED_FORMATS.includes(file.type)
  const ext = file.type.split('/')[1]?.toUpperCase() ?? 'desconhecido'
  return {
    id: 'file-format',
    label: 'Formato do arquivo',
    status: pass ? 'pass' : 'fail',
    message: pass
      ? `${ext} — aceito pelo Meta`
      : `${ext} — use JPG, PNG ou WebP`,
  }
}

function validateResolution(imgWidth: number, imgHeight: number): Requirement {
  const shortSide = Math.min(imgWidth, imgHeight)
  const pass = shortSide >= MIN_DIMENSION_PX
  return {
    id: 'resolution',
    label: 'Resolução mínima',
    status: pass ? 'pass' : 'fail',
    message: pass
      ? `${imgWidth}×${imgHeight} px — resolução adequada`
      : `${imgWidth}×${imgHeight} px — mínimo de ${MIN_DIMENSION_PX} px no lado menor`,
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

function buildSafeZoneWarning(format: MetaFormat): Requirement {
  return {
    id: 'safe-zone',
    label: 'Área segura',
    status: 'warning',
    message: `${format.label}: mantenha o conteúdo importante fora dos ${format.safeZone!.top}% do topo e da base (área de interface do Meta)`,
  }
}
