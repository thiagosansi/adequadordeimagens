'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Clock, Loader2, Users } from 'lucide-react'

interface Approval {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  comment: string | null
  created_at: string
  updated_at: string
  project: { id: string; name: string; format_label: string; width: number; height: number } | null
  requester: { full_name: string | null } | null
  reviewer: { full_name: string | null } | null
}

const STATUS_CONFIG = {
  pending:   { label: 'Aguardando',  color: 'bg-amber-100 text-amber-700',  icon: Clock          },
  approved:  { label: 'Aprovado',    color: 'bg-green-100 text-green-700',  icon: CheckCircle2   },
  rejected:  { label: 'Rejeitado',   color: 'bg-red-100 text-red-700',      icon: XCircle        },
  cancelled: { label: 'Cancelado',   color: 'bg-gray-100 text-gray-500',    icon: XCircle        },
} as const

export default function ApprovalsPage() {
  const { orgId } = useParams<{ orgId: string }>()

  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, string>>({})

  const loadApprovals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/org/${orgId}/approvals`)
      const data = await res.json() as { approvals?: Approval[] }
      setApprovals(data.approvals ?? [])
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { void loadApprovals() }, [loadApprovals])

  async function handleReview(approvalId: string, decision: 'approved' | 'rejected') {
    setReviewing(approvalId)
    try {
      await fetch(`/api/org/${orgId}/approvals/${approvalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment: comments[approvalId] ?? '' }),
      })
      // Refresh list
      await loadApprovals()
    } finally {
      setReviewing(null)
    }
  }

  const pending   = approvals.filter(a => a.status === 'pending')
  const reviewed  = approvals.filter(a => a.status !== 'pending' && a.status !== 'cancelled')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/app" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao editor
            </Link>
            <Link href={`/app/org/${orgId}/members`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
              <Users className="h-4 w-4" />
              Membros
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Aprovações</h1>
            <p className="mt-1 text-sm text-gray-500">Revise os projetos enviados pela equipe.</p>
          </div>
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">
              {pending.length}
            </span>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        )}

        {/* Pending */}
        {!loading && pending.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Pendentes ({pending.length})
            </p>
            {pending.map(approval => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                comment={comments[approval.id] ?? ''}
                onCommentChange={(v) => setComments(prev => ({ ...prev, [approval.id]: v }))}
                onApprove={() => handleReview(approval.id, 'approved')}
                onReject={() => handleReview(approval.id, 'rejected')}
                isReviewing={reviewing === approval.id}
              />
            ))}
          </div>
        )}

        {!loading && pending.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-green-400" />
            <p className="text-sm font-medium text-gray-700">Nenhuma aprovação pendente</p>
            <p className="mt-1 text-xs text-gray-400">Tudo em dia por aqui.</p>
          </div>
        )}

        {/* History */}
        {!loading && reviewed.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Histórico
            </p>
            {reviewed.map(approval => (
              <HistoryCard key={approval.id} approval={approval} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ApprovalCard({
  approval, comment, onCommentChange, onApprove, onReject, isReviewing,
}: {
  approval: Approval
  comment: string
  onCommentChange: (v: string) => void
  onApprove: () => void
  onReject: () => void
  isReviewing: boolean
}) {
  const project = approval.project
  const requester = approval.requester?.full_name ?? 'Membro'

  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{project?.name ?? 'Projeto'}</p>
          <p className="text-xs text-gray-400">
            {project?.format_label} · {project?.width}×{project?.height}px
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          Aguardando
        </span>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        Solicitado por <span className="font-medium text-gray-700">{requester}</span>
        {' · '}
        {new Date(approval.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
      </p>

      <textarea
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder="Comentário (opcional)"
        rows={2}
        className="mb-3 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400"
      />

      <div className="flex gap-2">
        <button
          onClick={onApprove}
          disabled={isReviewing}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          {isReviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Aprovar
        </button>
        <button
          onClick={onReject}
          disabled={isReviewing}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
        >
          {isReviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Rejeitar
        </button>
      </div>
    </div>
  )
}

function HistoryCard({ approval }: { approval: Approval }) {
  const config = STATUS_CONFIG[approval.status] ?? STATUS_CONFIG.cancelled
  const Icon = config.icon
  const project = approval.project

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-800">{project?.name ?? 'Projeto'}</p>
          <p className="text-xs text-gray-400">
            {approval.requester?.full_name ?? 'Membro'} ·{' '}
            {new Date(approval.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </p>
          {approval.comment && (
            <p className="mt-1 text-xs italic text-gray-400">"{approval.comment}"</p>
          )}
        </div>
        <span className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
          <Icon className="h-3 w-3" />
          {config.label}
        </span>
      </div>
    </div>
  )
}
