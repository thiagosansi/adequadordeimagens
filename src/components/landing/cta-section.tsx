'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

const STATS = [
  { value: '50k+', label: 'assets gerados' },
  { value: '< 30s', label: 'por adaptação' },
  { value: '5', label: 'plataformas' },
]

export function CtaSection() {
  return (
    <section
      id="precos"
      className="relative py-20 sm:py-32"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #E2E8F0, transparent)' }} />

      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(37,99,235,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-10 flex justify-center gap-8 sm:gap-16 flex-wrap"
        >
          {STATS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
              className="flex flex-col items-center gap-0.5"
            >
              <span className="font-display text-2xl font-bold sm:text-3xl" style={{ color: '#2563EB' }}>
                {value}
              </span>
              <span className="text-xs" style={{ color: '#64748B' }}>{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <div
          className="mx-auto mb-10 h-px"
          style={{
            maxWidth: 320,
            background: 'linear-gradient(90deg, transparent, #E2E8F0, transparent)',
          }}
        />

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl"
          style={{ color: '#0F172A' }}
        >
          Escale sua operação criativa{' '}
          <span style={{ color: '#2563EB' }}>
            sem escalar retrabalho
          </span>
        </motion.h2>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.18, ease: EASE }}
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed"
          style={{ color: '#64748B' }}
        >
          Transforme qualquer criativo em versões prontas para performar em qualquer plataforma.
          Sem retrabalho. Sem gargalo. Sem comprometer a composição.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.26, ease: EASE }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Link
            href="/login"
            className="group inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: '#2563EB',
              boxShadow: '0 4px 20px rgba(37,99,235,0.3)',
            }}
          >
            Começar grátis
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold transition-all duration-200"
            style={{
              border: '1px solid #E2E8F0',
              color: '#475569',
              background: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            Ver planos
          </Link>
        </motion.div>

        {/* Fine print */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.36, ease: EASE }}
          className="mt-6 flex items-center justify-center gap-4 flex-wrap"
        >
          {['Sem cartão de crédito', 'Configuração em 2 minutos', 'Cancele quando quiser'].map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-sm" style={{ color: '#94A3B8' }}>
              <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3" stroke="#16A34A" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
              </svg>
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <div
        className="relative z-10 mx-auto mt-20 max-w-6xl px-6"
        style={{ borderTop: '1px solid #E2E8F0', paddingTop: 24 }}
      >
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: '#2563EB' }}>
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-white" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>AdFrame</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {['Produto', 'Preços', 'Docs', 'Blog'].map((link) => (
              <span key={link} className="text-sm cursor-pointer transition-colors" style={{ color: '#94A3B8' }}>
                {link}
              </span>
            ))}
          </div>

          <p className="text-xs" style={{ color: '#CBD5E1' }}>
            © {new Date().getFullYear()} AdFrame · Todos os direitos reservados
          </p>
        </div>
      </div>
    </section>
  )
}
