import type { Requirement } from '@/shared/types/image'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  requirements: Requirement[]
  platformLabel?: string
  onSuggestInteractiveCrop?: () => void
}

export function RequirementsChecklist({ requirements, platformLabel, onSuggestInteractiveCrop }: Props) {
  if (requirements.length === 0) return null

  const hasFail = requirements.some((r) => r.status === 'fail')
  const allPass = !hasFail

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Requisitos {platformLabel ?? 'da Plataforma'}
        </h2>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            allPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
          )}
        >
          {allPass ? 'Aprovado' : 'Atenção'}
        </span>
      </div>
      <div className="space-y-2">
        {requirements.map((req) => (
          <RequirementRow
            key={req.id}
            requirement={req}
            onSuggestInteractiveCrop={req.id === 'safe-zone' && req.status === 'warning' ? onSuggestInteractiveCrop : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function RequirementRow({
  requirement,
  onSuggestInteractiveCrop,
}: {
  requirement: Requirement
  onSuggestInteractiveCrop?: () => void
}) {
  const config = {
    pass: {
      icon: <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />,
      bg: 'bg-green-50 border-green-100',
    },
    fail: {
      icon: <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />,
      bg: 'bg-red-50 border-red-100',
    },
    warning: {
      icon: <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />,
      bg: 'bg-amber-50 border-amber-100',
    },
  }[requirement.status]

  return (
    <div className={cn('flex items-start gap-3 rounded-lg border p-3', config.bg)}>
      {config.icon}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-700">{requirement.label}</p>
        <p className="text-xs text-gray-600">{requirement.message}</p>
        {onSuggestInteractiveCrop && (
          <button
            onClick={onSuggestInteractiveCrop}
            className="mt-1.5 text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900"
          >
            Usar recorte interativo para ajustar →
          </button>
        )}
      </div>
    </div>
  )
}
