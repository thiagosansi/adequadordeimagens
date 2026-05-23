'use client'

import { useEffect, useState } from 'react'
import { Image, Layers, LayoutGrid, Video, CheckCircle2, Circle, ArrowRight, X } from 'lucide-react'
import type { AppMode } from '@/components/app-mode-switcher'

interface OnboardingStatus {
  accountCreated: boolean
  hasExport: boolean
  hasMemberInvited: boolean
  brandKitConfigured: boolean
  orgId: string | null
}

const MODES: { id: AppMode; label: string; description: string; icon: React.ElementType; color: string }[] = [
  {
    id: 'single',
    label: 'Imagem única',
    description: 'Ajuste e adapte uma imagem para qualquer plataforma',
    icon: Image,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'batch',
    label: 'Lote',
    description: 'Exporte múltiplos formatos de uma vez',
    icon: Layers,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    id: 'carousel',
    label: 'Carrossel',
    description: 'Monte carrosséis multi-frame para redes sociais',
    icon: LayoutGrid,
    color: 'bg-green-50 text-green-600',
  },
  {
    id: 'video',
    label: 'Vídeo',
    description: 'Adapte vídeos curtos para múltiplos formatos',
    icon: Video,
    color: 'bg-amber-50 text-amber-600',
  },
]

interface WelcomeCardProps {
  onSelectMode: (mode: AppMode) => void
  isAdmin: boolean
}

export function WelcomeCard({ onSelectMode, isAdmin }: WelcomeCardProps) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [checklistDismissed, setChecklistDismissed] = useState(false)

  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/onboarding-status')
      .then((r) => r.json())
      .then((d: OnboardingStatus) => setStatus(d))
      .catch(() => {})
  }, [isAdmin])

  const allDone = status
    ? status.accountCreated && status.hasExport && status.hasMemberInvited && status.brandKitConfigured
    : false

  const showChecklist = isAdmin && status && !allDone && !checklistDismissed

  return (
    <div className="space-y-4">
      {/* Mode selection card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-bold text-gray-900">Bem-vindo ao AdFrame</h2>
        <p className="mb-5 text-sm text-gray-500">
          Escolha um modo ou arraste uma imagem para começar.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MODES.map(({ id, label, description, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => onSelectMode(id)}
              className="group flex flex-col items-start gap-2 rounded-xl border border-gray-100 p-4 text-left transition-all hover:border-blue-200 hover:shadow-sm"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="mt-0.5 text-xs text-gray-400 leading-snug">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Onboarding checklist — only for admin/owner */}
      {showChecklist && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-blue-900">Primeiros passos</h3>
            <button
              onClick={() => setChecklistDismissed(true)}
              className="text-blue-400 hover:text-blue-600"
              aria-label="Dispensar checklist"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="space-y-2.5">
            <ChecklistItem done={status!.accountCreated} label="Criar sua conta" />
            <ChecklistItem
              done={status!.hasExport}
              label="Fazer sua primeira exportação"
              action={{ label: 'Exportar agora', onClick: () => onSelectMode('single') }}
            />
            {status!.orgId && (
              <>
                <ChecklistItem
                  done={status!.hasMemberInvited}
                  label="Convidar um membro para a equipe"
                  action={{ label: 'Convidar', href: `/app/org/${status!.orgId}/members` }}
                />
                <ChecklistItem
                  done={status!.brandKitConfigured}
                  label="Configurar o Brand Kit da empresa"
                  action={{ label: 'Configurar', href: `/app/org/${status!.orgId}/brand-kit` }}
                />
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

function ChecklistItem({
  done,
  label,
  action,
}: {
  done: boolean
  label: string
  action?: { label: string; href?: string; onClick?: () => void }
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {done ? (
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-blue-600" />
        ) : (
          <Circle className="h-4.5 w-4.5 shrink-0 text-blue-300" />
        )}
        <span className={`text-sm ${done ? 'text-blue-700 line-through opacity-60' : 'text-blue-800'}`}>
          {label}
        </span>
      </div>
      {!done && action && (
        action.href ? (
          <a
            href={action.href}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            {action.label}
            <ArrowRight className="h-3 w-3" />
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            {action.label}
            <ArrowRight className="h-3 w-3" />
          </button>
        )
      )}
    </li>
  )
}
