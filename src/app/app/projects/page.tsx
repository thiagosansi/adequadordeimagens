'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Trash2, Loader2, FolderOpen, User, Building2, SendHorizonal, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { listProjects, deleteProject, type Project } from '@/lib/projects'
import { getExportUrl } from '@/lib/storage'

const STATUS_BADGE: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
  pending_approval: { label: 'Aguardando',  className: 'bg-amber-100 text-amber-700',  Icon: Clock         },
  approved:         { label: 'Aprovado',    className: 'bg-green-100 text-green-700',  Icon: CheckCircle2  },
  rejected:         { label: 'Rejeitado',   className: 'bg-red-100 text-red-700',      Icon: XCircle       },
}

interface Workspace {
  id: string
  name: string
  role: string
}

function getActiveOrgId(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)adframe-workspace=([^;]*)/)
  return match ? decodeURIComponent(match[1] ?? '') || null : null
}

export default function ProjectsPage() {
  const [tab, setTab] = useState<'personal' | 'org'>('personal')
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)
  const [activeOrgName, setActiveOrgName] = useState<string>('')
  const [hasOrg, setHasOrg] = useState(false)

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  // Resolve active workspace on mount
  useEffect(() => {
    const orgId = getActiveOrgId()
    setActiveOrgId(orgId)

    fetch('/api/workspaces')
      .then(r => r.json())
      .then((data: { workspaces?: Workspace[] }) => {
        const orgs = data.workspaces ?? []
        setHasOrg(orgs.length > 0)
        const active = orgs.find(o => o.id === orgId)
        if (active) setActiveOrgName(active.name)
        // Auto-switch to org tab if workspace is active
        if (orgId && active) setTab('org')
      })
      .catch(() => {/* silent */})
  }, [])

  const loadProjects = useCallback(async (context: 'personal' | 'org') => {
    setLoading(true)
    setProjects([])
    try {
      const orgId = context === 'org' ? activeOrgId : null
      const data = await listProjects(orgId)
      setProjects(data)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [activeOrgId])

  useEffect(() => {
    void loadProjects(tab)
  }, [tab, loadProjects])

  async function handleDownload(project: Project) {
    try {
      const url = await getExportUrl(project.storage_path)
      window.open(url, '_blank')
    } catch {
      alert('Não foi possível abrir a imagem.')
    }
  }

  async function handleRequestApproval(project: Project) {
    if (!activeOrgId) return
    setSubmittingId(project.id)
    try {
      const res = await fetch(`/api/org/${activeOrgId}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        alert(body.error ?? 'Não foi possível solicitar aprovação.')
        return
      }
      setProjects(prev =>
        prev.map(p => p.id === project.id ? { ...p, status: 'pending_approval' } : p),
      )
    } catch {
      alert('Não foi possível solicitar aprovação.')
    } finally {
      setSubmittingId(null)
    }
  }

  async function handleDelete(project: Project) {
    if (!confirm(`Excluir "${project.name}"?`)) return
    setDeletingId(project.id)
    try {
      await deleteProject(project.id, project.storage_path)
      setProjects(prev => prev.filter(p => p.id !== project.id))
    } catch {
      alert('Não foi possível excluir.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/app" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">AdFrame</span>
          </Link>
          <Link href="/app" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao editor
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
        </div>

        {/* Tabs — only shown when user has an active org */}
        {hasOrg && activeOrgId && (
          <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-white p-1 w-fit">
            <button
              onClick={() => setTab('personal')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === 'personal'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Pessoal
            </button>
            <button
              onClick={() => setTab('org')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === 'org'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              {activeOrgName || 'Equipe'}
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-gray-400">
            <FolderOpen className="h-12 w-12" />
            <p className="text-sm">
              {tab === 'org'
                ? 'Nenhum projeto da equipe ainda.\nExporte uma imagem com o workspace da organização ativo.'
                : 'Nenhum projeto ainda.\nFaça seu primeiro export no editor.'}
            </p>
            <Link
              href="/app"
              className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Ir para o editor
            </Link>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <div
                key={project.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{project.format_label}</p>
                    <p className="text-xs text-gray-400">{project.width}×{project.height} px</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {project.format_id}
                  </span>
                </div>

                <p className="mb-1 truncate text-xs text-gray-400" title={project.name}>
                  {project.name}
                </p>

                {/* Creator — shown for org projects */}
                {tab === 'org' && project.creator_name && (
                  <p className="mb-2 flex items-center gap-1 text-xs text-gray-400">
                    <User className="h-3 w-3" />
                    {project.creator_name}
                  </p>
                )}

                {/* Status badge — shown for org projects */}
                {tab === 'org' && (() => {
                  const badge = STATUS_BADGE[project.status]
                  if (!badge) return null
                  const BadgeIcon = badge.Icon
                  return (
                    <span className={`mb-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                      <BadgeIcon className="h-3 w-3" />
                      {badge.label}
                    </span>
                  )
                })()}

                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-xs text-gray-400">
                    {new Date(project.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    {tab === 'org' && project.status === 'draft' && (
                      <button
                        onClick={() => handleRequestApproval(project)}
                        disabled={submittingId === project.id}
                        className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                      >
                        {submittingId === project.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <SendHorizonal className="h-3.5 w-3.5" />
                        }
                        Solicitar
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(project)}
                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      disabled={deletingId === project.id}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:border-red-200 hover:text-red-500 disabled:opacity-50"
                    >
                      {deletingId === project.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
