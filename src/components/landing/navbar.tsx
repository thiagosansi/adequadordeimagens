'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { label: 'Produto',  href: '#produto'  },
  { label: 'Soluções', href: '#solucoes' },
  { label: 'Recursos', href: '#recursos' },
  { label: 'Preços',   href: '#precos'   },
  { label: 'Docs',     href: '/docs'     },
] as const

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={
        scrolled
          ? {
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderBottom: '1px solid #E2E8F0',
              boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
            }
          : {
              backgroundColor: 'transparent',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              borderBottom: '1px solid transparent',
              boxShadow: 'none',
            }
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #2563EB, #3b82f6)' }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 text-white"
              stroke="currentColor"
              strokeWidth={2}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <span className="font-display text-base font-semibold" style={{ color: '#0F172A' }}>
            AdFrame
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150"
              style={{ color: '#64748B', textDecoration: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.backgroundColor = '#F1F5F9' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-150"
            style={{ color: '#64748B' }}
          >
            Entrar
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: '#2563EB',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            }}
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  )
}
