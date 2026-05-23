'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Copy, Check, Trash2, Loader2 } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Dono',
  admin: 'Admin',
  media_buyer: 'Media Buyer',
  designer: 'Designer',
  viewer: 'Visualizador',
}

interface Member {
  userId: string
  role: string
  joinedAt: string
  fullName: string | null
  email: string
  isCurrentUser: boolean
}

export default function MembersPage() {
  const { orgId } = useParams<{ orgId: string }>()

  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('media_buyer')
  const [inviting, setInviting] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [inviteError, setInviteError] = useState('')

  // Remove member
  const [removing, setRemoving] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true)
    try {
      const res = await fetch(`/api/org/${orgId}/members`)
      const data = await res.json() as { members?: Member[] }
      setMembers(data.members ?? [])
    } finally {
      setLoadingMembers(false)
    }
  }, [orgId])

  useEffect(() => { void loadMembers() }, [loadMembers])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError('')
    setInviteLink('')
    try {
      const res = await fetch(`/api/org/${orgId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json() as { ok?: boolean; inviteUrl?: string; emailSent?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erro ao criar convite')
      setInviteLink(data.inviteUrl ?? '')
      setInviteEmail('')
      if (data.emailSent) {
        setInviteLink(`E-mail enviado para ${inviteEmail}. Link: ${data.inviteUrl ?? ''}`)
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Algo deu errado')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(userId: string) {
    setRemoving(userId)
    try {
      await fetch(`/api/org/${orgId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      setMembers((prev) => prev.filter((m) => m.userId !== userId))
    } finally {
      setRemoving(null)
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentUserRole = members.find((m) => m.isCurrentUser)?.role ?? ''
  const canManage = ['owner', 'admin'].includes(currentUserRole)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Link href="/app" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao editor
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Membros da equipe</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie quem tem acesso à organização.</p>
        </div>

        {/* Invite form — only for owners and admins */}
        {canManage && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <UserPlus className="h-4 w-4" />
              Convidar membro
            </h2>
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@empresa.com"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="media_buyer">Media Buyer</option>
                  <option value="designer">Designer</option>
                  <option value="viewer">Visualizador</option>
                </select>
              </div>

              {inviteError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{inviteError}</p>
              )}

              <button
                type="submit"
                disabled={inviting}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {inviting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {inviting ? 'Criando convite...' : 'Enviar convite'}
              </button>
            </form>

            {/* Invite link */}
            {inviteLink && (
              <div className="mt-4 rounded-xl bg-green-50 p-3">
                <p className="mb-1.5 text-xs font-medium text-green-700">
                  Convite criado! Compartilhe o link:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-white px-2 py-1 text-xs text-gray-700 ring-1 ring-green-200">
                    {inviteLink}
                  </code>
                  <button
                    onClick={copyLink}
                    className="rounded-lg bg-green-600 p-1.5 text-white hover:bg-green-700"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Members list */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <p className="text-sm font-semibold text-gray-700">
              {members.length} {members.length === 1 ? 'membro' : 'membros'}
            </p>
          </div>

          {loadingMembers ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {members.map((member) => (
                <li key={member.userId} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {member.fullName ?? member.email}
                      {member.isCurrentUser && (
                        <span className="ml-2 text-xs text-gray-400">(você)</span>
                      )}
                    </p>
                    {member.fullName && (
                      <p className="text-xs text-gray-500">{member.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      {ROLE_LABELS[member.role] ?? member.role}
                    </span>
                    {canManage && !member.isCurrentUser && member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemove(member.userId)}
                        disabled={removing === member.userId}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                      >
                        {removing === member.userId
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />
                        }
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
