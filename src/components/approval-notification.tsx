'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

interface ReviewedSubmission {
  id: string
  status: 'approved' | 'rejected'
  comment: string | null
  updated_at: string
  project: { name: string } | null
}

interface Approval {
  id: string
  status: string
  comment: string | null
  updated_at: string
  project: { name: string } | null
}

const SEEN_KEY = 'adframe_seen_approvals'

function getSeenIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function markSeen(ids: string[]) {
  try {
    const existing = getSeenIds()
    ids.forEach(id => existing.add(id))
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...existing]))
  } catch {
    // noop
  }
}

function getActiveOrgId(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)adframe-workspace=([^;]*)/)
  return match ? decodeURIComponent(match[1] ?? '') || null : null
}

export function ApprovalNotification() {
  const [items, setItems] = useState<ReviewedSubmission[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const orgId = getActiveOrgId()
    if (!orgId) return

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const seen = getSeenIds()

    fetch(`/api/org/${orgId}/approvals?mine=true`)
      .then(r => r.json())
      .then((data: { approvals?: Approval[] }) => {
        const recent = (data.approvals ?? []).filter(
          (a) =>
            (a.status === 'approved' || a.status === 'rejected') &&
            a.updated_at > sevenDaysAgo &&
            !seen.has(a.id),
        ) as ReviewedSubmission[]

        if (recent.length > 0) {
          setItems(recent)
          setVisible(true)
        }
      })
      .catch(() => {})
  }, [])

  function dismiss() {
    markSeen(items.map(i => i.id))
    setVisible(false)
  }

  if (!visible || items.length === 0) return null

  const single = items[0]
  const isApproved = single.status === 'approved'

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-80 rounded-2xl border p-4 shadow-lg ${
      isApproved
        ? 'border-green-200 bg-green-50'
        : 'border-red-200 bg-red-50'
    }`}>
      <div className="flex items-start gap-3">
        {isApproved
          ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        }
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${isApproved ? 'text-green-800' : 'text-red-800'}`}>
            {items.length === 1
              ? `Projeto ${isApproved ? 'aprovado' : 'rejeitado'}`
              : `${items.length} projetos revisados`}
          </p>
          <p className={`mt-0.5 truncate text-xs ${isApproved ? 'text-green-700' : 'text-red-700'}`}>
            {items.length === 1
              ? (single.project?.name ?? 'Projeto')
              : items.map(i => i.project?.name ?? 'Projeto').join(', ')}
          </p>
          {single.comment && items.length === 1 && (
            <p className={`mt-1 text-xs italic ${isApproved ? 'text-green-600' : 'text-red-600'}`}>
              "{single.comment}"
            </p>
          )}
        </div>
        <button onClick={dismiss} className={`shrink-0 ${isApproved ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'}`}>
          <X className="h-4 w-4" />
        </button>
      </div>
      {items.length > 1 && (
        <p className={`mt-2 text-xs ${isApproved ? 'text-green-600' : 'text-red-600'}`}>
          Veja todos em <a href="#" className="font-semibold underline">Meus envios</a>
        </p>
      )}
    </div>
  )
}
