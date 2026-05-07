'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { TransformationEngine } from './transformation-engine'

const EASE = [0.16, 1, 0.3, 1] as const

function fadeUpProps(delay: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, delay, ease: EASE },
  } as const
}

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden min-h-screen flex items-center pt-16"
      style={{
        background: 'linear-gradient(160deg, #F8FAFC 0%, #EFF6FF 40%, #F8FAFC 100%)',
      }}
    >
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.35,
        }}
      />

      {/* Soft blue glow top-right */}
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: 600,
          height: 500,
          background: 'radial-gradient(ellipse at top right, rgba(37,99,235,0.07) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 sm:py-24 w-full">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-12 items-center">

          {/* ── Left: Copy ── */}
          <div className="flex flex-col items-start">

            {/* Badge */}
            <motion.div
              {...fadeUpProps(0)}
              className="mb-6 flex items-center gap-2 rounded-full border px-4 py-1.5"
              style={{
                borderColor: '#BFDBFE',
                backgroundColor: '#EFF6FF',
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-sm font-medium" style={{ color: '#1D4ED8' }}>
                Criação de assets para mídia paga
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUpProps(0.08)}
              className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl xl:text-6xl"
              style={{ color: '#0F172A' }}
            >
              Adapte criativos para todos os formatos de{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #3b82f6 100%)',
                }}
              >
                mídia paga
              </span>{' '}
              em segundos
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              {...fadeUpProps(0.16)}
              className="mt-6 text-lg leading-relaxed max-w-lg"
              style={{ color: '#64748B' }}
            >
              Envie uma imagem ou vídeo e o AdFrame gera versões otimizadas para Meta, TikTok, Google Ads
              e outros placements — preservando rostos, textos e áreas seguras.
            </motion.p>

            {/* CTAs */}
            <motion.div
              {...fadeUpProps(0.24)}
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: '#2563EB',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
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

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border px-6 py-3.5 text-base font-semibold transition-all duration-200"
                style={{
                  borderColor: '#E2E8F0',
                  color: '#475569',
                  background: '#FFFFFF',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Ver como funciona
              </button>
            </motion.div>

            {/* Trust */}
            <motion.p
              {...fadeUpProps(0.32)}
              className="mt-5 text-sm"
              style={{ color: '#94A3B8' }}
            >
              Sem cartão de crédito · Configuração em 2 minutos
            </motion.p>
          </div>

          {/* ── Right: App Preview ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            className="flex justify-center lg:justify-end"
          >
            <div
              className="relative w-full rounded-3xl pt-10 pb-6 px-4 sm:px-6 sm:w-auto"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.04)',
              }}
            >
              {/* App bar indicator */}
              <div
                className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-3 py-1 whitespace-nowrap"
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" style={{ animation: 'pulse 2s infinite' }} />
                <span className="text-[11px] font-medium" style={{ color: '#64748B' }}>
                  Processando criativo…
                </span>
              </div>

              <TransformationEngine />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
