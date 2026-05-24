'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, XCircle, Clock, Loader2, ImageIcon, SendHorizonal } from 'lucide-react'

interface Submission {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  comment: string | null
  created_at: string
  updated_at: string
  thumbnail_url: string | null
  project: { id: string; name: string; format_label: string; width: number; height: number } | null
  reviewer: { full_name: string | null } | null
}

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

const STATUS_CONFIG = {
  pending:   { label: 'Aguardando',  color: 'bg-amber-100 text-amber-700',  icon: Clock        },
  approved:  { label: 'Aprovado',    color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  rejected:  { label: 'Rejeitado',   color: 'bg-red-100 text-red-700',      icon: XCircle      },
  cancelled: { label: 'Cancelado',   color: 'bg-gray-100 text-gray-500',    icon: XCircle      },
} as const

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',      label: 'Todos'    },
  { id: 'pending',  label: 'Pendente' },
  { id: 'approved', label: 'Aprovado' },
  { id: 'rejected', label: 'Rejeitado'},
]

export default function MySubmissionsPage() {
  const { orgId } = useParams<{ orgId: string }>()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  const loadSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/org/${orgId}/approvals?mine=true`)
      const data = await res.json() as { approvals?: Submission[] }
      setSubmissions((data.approvals ?? []).filter(a => a.status !== 'cancelled'))
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { void loadSubmissions() }, [loadSubmissions])

  const pending = submissions.filter(s => s.status === 'pending')
  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter)

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Meus envios</h1>
            <p className="mt-1 text-sm text-gray-500">
              Projetos que você enviou para aprovação.
            </p>
          </div>
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">
              {pending.length} aguardando
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 scrollbar-none w-fit max-w-full">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === f.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white py-14 text-center">
            <SendHorizonal className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">Nenhum envio encontrado</p>
            <p className="mt-1 text-xs text-gray-400">
              {filter === 'all'
                ? 'Exporte um projeto e solicite aprovação na página de Projetos.'
                : 'Nenhum envio com esse status.'}
            </p>
            {filter === 'all' && (
              <a
                href="/app/projects"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Ver projetos
              </a>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(submission => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SubmissionCard({ submission }: { submission: Submission }) {
  const config = STATUS_CONFIG[submission.status] ?? STATUS_CONFIG.cancelled
  const Icon = config.icon
  const project = submission.project

  return (
    <div className={`rounded-2xl border bg-white p-4 ${
      submission.status === 'pending' ? 'border-amber-200' :
      submission.status === 'approved' ? 'border-green-100' :
      submission.status === 'rejected' ? 'border-red-100' : 'border-gray-100'
    }`}>
      <div className="flex items-center gap-3">
        {submission.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={submission.thumbnail_url}
            alt="Preview"
            className="h-16 w-16 shrink-0 rounded-lg object-cover border border-gray-100"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-300">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {project?.name ?? 'Projeto'}
              </p>
              <p className="text-xs text-gray-400">
                {project?.format_label} · {project?.width}×{project?.height}px
              </p>
            </div>
            <span className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
              <Icon className="h-3 w-3" />
              {config.label}
            </span>
          </div>

          <p className="mt-1 text-xs text-gray-400">
            Enviado em{' '}
            {new Date(submission.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </p>

          {submission.status !== 'pending' && (
            <p className="text-xs text-gray-400">
              Revisado por{' '}
              <span className="font-medium text-gray-600">
                {submission.reviewer?.full_name ?? 'Admin'}
              </span>
              {' em '}
              {new Date(submission.updated_at).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'short',
              })}
            </p>
          )}

          {submission.comment && (
            <p className={`mt-1 text-xs italic ${
              submission.status === 'rejected' ? 'text-red-500' : 'text-gray-400'
            }`}>
              "{submission.comment}"
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
