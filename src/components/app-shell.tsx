'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

interface AppShellProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function AppShell({ sidebar, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:shrink-0">
        {sidebar}
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative flex h-full">
          {sidebar}
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute right-[-40px] top-3 flex h-8 w-8 items-center justify-center rounded-r-lg bg-white shadow-md text-gray-500"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile hamburger bar */}
        <div className="flex h-12 items-center border-b border-gray-200 bg-white px-4 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
