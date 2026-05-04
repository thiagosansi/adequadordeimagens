'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Trash2, Loader2, FolderOpen } from 'lucide-react'
import { listProjects, deleteProject, type Project } from '@/lib/projects'
import { getExportUrl } from '@/lib/storage'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .finally(() => setLoading(false))
  }, [])

  async function handleDownload(project: Project) {
    try {
      const url = await getExportUrl(project.storage_path)
      const link = document.createElement('a')
      link.href = url
      link.download = project.name
      link.click()
    } catch {
      alert('Não foi possível baixar a imagem.')
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
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao editor
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Meus projetos</h1>

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-gray-400">
            <FolderOpen className="h-12 w-12" />
            <p className="text-sm">Nenhum projeto ainda.<br />Faça seu primeiro export no editor.</p>
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
                    <p className="text-xs text-gray-400">
                      {project.width}×{project.height} px
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {project.format_id}
                  </span>
                </div>

                <p className="mb-4 truncate text-xs text-gray-400" title={project.name}>
                  {project.name}
                </p>

                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {new Date(project.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center gap-2">
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
