'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'

const PLAN_OPTIONS = [
  { value: 'free',       label: 'Free',       color: 'bg-gray-100 text-gray-600' },
  { value: 'pro',        label: 'Pro',         color: 'bg-blue-100 text-blue-700' },
  { value: 'team',       label: 'Team',        color: 'bg-purple-100 text-purple-700' },
  { value: 'enterprise', label: 'Enterprise',  color: 'bg-amber-100 text-amber-700' },
] as const

type PlanId = (typeof PLAN_OPTIONS)[number]['value']

interface UserRow {
  id: string
  email: string
  fullName: string | null
  planId: PlanId
}

interface OrgRow {
  id: string
  name: string
  planId: PlanId
  memberCount: number
}

function PlanBadge({ planId }: { planId: PlanId }) {
  const opt = PLAN_OPTIONS.find((p) => p.value === planId) ?? PLAN_OPTIONS[0]
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${opt.color}`}>
      {opt.label}
    </span>
  )
}

function PlanSelect({
  entityType,
  entityId,
  currentPlan,
}: {
  entityType: 'user' | 'organization'
  entityId: string
  currentPlan: PlanId
}) {
  const [plan, setPlan] = useState<PlanId>(currentPlan)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleChange(newPlan: PlanId) {
    setPlan(newPlan)
    setSaved(false)
    startTransition(async () => {
      await fetch('/api/admin/set-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId, planId: newPlan }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={plan}
        onChange={(e) => handleChange(e.target.value as PlanId)}
        disabled={isPending}
        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 outline-none focus:border-blue-400 disabled:opacity-60"
      >
        {PLAN_OPTIONS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
      {saved && !isPending && (
        <span className="text-xs font-medium text-green-600">Salvo</span>
      )}
    </div>
  )
}

export function PlanManager({ users, orgs }: { users: UserRow[]; orgs: OrgRow[] }) {
  return (
    <div className="space-y-6">
      {/* Users */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Usuários ({users.length})
          </p>
        </div>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-2.5 font-semibold text-gray-500">Nome / E-mail</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500">Plano atual</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500">Alterar</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-gray-900">{u.fullName ?? '—'}</p>
                  <p className="text-gray-400">{u.email}</p>
                </td>
                <td className="px-4 py-2.5">
                  <PlanBadge planId={u.planId} />
                </td>
                <td className="px-4 py-2.5">
                  <PlanSelect entityType="user" entityId={u.id} currentPlan={u.planId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Orgs */}
      {orgs.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Organizações ({orgs.length})
            </p>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-2.5 font-semibold text-gray-500">Organização</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500">Membros</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500">Plano atual</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500">Alterar</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{o.name}</td>
                  <td className="px-4 py-2.5 tabular-nums text-gray-500">{o.memberCount}</td>
                  <td className="px-4 py-2.5">
                    <PlanBadge planId={o.planId} />
                  </td>
                  <td className="px-4 py-2.5">
                    <PlanSelect entityType="organization" entityId={o.id} currentPlan={o.planId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
