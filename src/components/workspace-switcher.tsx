'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Building2, User } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  role: string
}

const COOKIE_NAME = 'adframe-workspace'

function getActiveOrgId(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setActiveOrgId(orgId: string | null) {
  const value = orgId ? encodeURIComponent(orgId) : ''
  const expires = orgId
    ? `; max-age=${60 * 60 * 24 * 365}`
    : '; max-age=0'
  document.cookie = `${COOKIE_NAME}=${value}${expires}; path=/; SameSite=Lax`
}

export function WorkspaceSwitcher({ userName }: { userName?: string }) {
  const [orgs, setOrgs] = useState<Workspace[]>([])
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveOrgIdState(getActiveOrgId())

    fetch('/api/workspaces')
      .then(r => r.json())
      .then((data: { workspaces?: Workspace[] }) => {
        setOrgs(data.workspaces ?? [])
      })
      .catch(() => {/* silent */})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const activeOrg = orgs.find(o => o.id === activeOrgId)
  const label = activeOrg ? activeOrg.name : (userName ?? 'Pessoal')

  function switchTo(orgId: string | null) {
    setActiveOrgId(orgId)
    setActiveOrgIdState(orgId)
    setOpen(false)
  }

  // Only show switcher if user belongs to at least one org
  if (orgs.length === 0) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
      >
        {activeOrg ? (
          <Building2 className="h-3.5 w-3.5 text-blue-500" />
        ) : (
          <User className="h-3.5 w-3.5 text-gray-400" />
        )}
        <span className="max-w-[120px] truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-md">
          {/* Personal workspace */}
          <button
            onClick={() => switchTo(null)}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${!activeOrgId ? 'font-medium text-blue-600' : 'text-gray-700'}`}
          >
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{userName ?? 'Pessoal'}</span>
            {!activeOrgId && <span className="ml-auto text-xs text-blue-400">ativo</span>}
          </button>

          {orgs.length > 0 && (
            <div className="my-1 border-t border-gray-100" />
          )}

          {/* Org workspaces */}
          {orgs.map(org => (
            <button
              key={org.id}
              onClick={() => switchTo(org.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${activeOrgId === org.id ? 'font-medium text-blue-600' : 'text-gray-700'}`}
            >
              <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{org.name}</span>
              {activeOrgId === org.id && <span className="ml-auto text-xs text-blue-400">ativo</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
