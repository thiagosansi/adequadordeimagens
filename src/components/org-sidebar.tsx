'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, CheckSquare, Users, Palette, CreditCard, FolderOpen, SendHorizonal, Zap } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  role: string
}

interface Approval {
  status: string
}

interface UsageStatus {
  planId: string
  exportsUsed: number
  exportsLimit: number
}

function getActiveOrgId(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)adframe-workspace=([^;]*)/)
  return match ? decodeURIComponent(match[1] ?? '') || null : null
}

export function OrgSidebar({ userDisplay, userEmail }: { userDisplay: string; userEmail: string }) {
  const pathname = usePathname()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState('')
  const [role, setRole] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [ready, setReady] = useState(false)
  const [usage, setUsage] = useState<UsageStatus | null>(null)

  useEffect(() => {
    const activeId = getActiveOrgId()
    setOrgId(activeId)

    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((data: { workspaces?: Workspace[] }) => {
        const org = (data.workspaces ?? []).find((w) => w.id === activeId)
        if (org) {
          setOrgName(org.name)
          setRole(org.role)
        }
        setReady(true)
      })
      .catch(() => setReady(true))
  }, [])

  useEffect(() => {
    fetch('/api/usage-status')
      .then((r) => r.json())
      .then((d: UsageStatus) => setUsage(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!orgId || !['owner', 'admin'].includes(role ?? '')) return

    fetch(`/api/org/${orgId}/approvals`)
      .then((r) => r.json())
      .then((data: { approvals?: Approval[] }) => {
        setPendingCount((data.approvals ?? []).filter((a) => a.status === 'pending').length)
      })
      .catch(() => {})
  }, [orgId, role])

  // Don't render until we know the user's context
  if (!ready || !orgId || !role) return null

  const isAdmin = ['owner', 'admin'].includes(role)

  const navItems = [
    { href: '/app', label: 'Editor', icon: LayoutGrid },
    { href: '/app/projects', label: 'Projetos', icon: FolderOpen },
    ...(isAdmin ? [
      { href: `/app/org/${orgId}/approvals`, label: 'Aprovações', icon: CheckSquare, badge: pendingCount },
      { href: `/app/org/${orgId}/members`, label: 'Membros', icon: Users },
    ] : [
      { href: `/app/org/${orgId}/my-submissions`, label: 'Meus envios', icon: SendHorizonal },
    ]),
    { href: `/app/org/${orgId}/brand-kit`, label: 'Brand Kit', icon: Palette },
    ...(isAdmin ? [
      { href: '/app/billing', label: 'Cobrança', icon: CreditCard },
    ] : []),
  ]

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-gray-100 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-white" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900">AdFrame</span>
      </div>

      {/* Workspace */}
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Workspace</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-gray-800">{orgName}</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const isActive = href === '/app' ? pathname === '/app' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 font-semibold text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge != null && badge > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Usage bar */}
      {usage && usage.exportsLimit > 0 && (
        <div className="border-t border-gray-100 px-4 py-3">
          {(() => {
            const pct = Math.min(100, Math.round((usage.exportsUsed / usage.exportsLimit) * 100))
            const isAmber = pct >= 80 && pct < 100
            const isFull = pct >= 100
            return (
              <>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    <span className={`font-semibold ${isFull ? 'text-red-600' : isAmber ? 'text-amber-600' : 'text-gray-700'}`}>
                      {usage.exportsUsed}/{usage.exportsLimit}
                    </span>
                    {' '}exports este mês
                  </p>
                  {usage.planId === 'free' && (
                    <Link href="/app/billing" className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 hover:text-blue-800">
                      <Zap className="h-3 w-3" />
                      Upgrade
                    </Link>
                  )}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : isAmber ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* User info */}
      <div className="border-t border-gray-100 px-4 py-3">
        <p className="truncate text-sm font-medium text-gray-800">{userDisplay}</p>
        {userDisplay !== userEmail && (
          <p className="truncate text-xs text-gray-400">{userEmail}</p>
        )}
        <span className="mt-1.5 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
          {role === 'owner' ? 'Dono' : role === 'admin' ? 'Admin' : role === 'media_buyer' ? 'Media Buyer' : role === 'designer' ? 'Designer' : 'Visualizador'}
        </span>
      </div>
    </aside>
  )
}
