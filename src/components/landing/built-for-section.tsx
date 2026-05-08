'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const EASE = [0.16, 1, 0.3, 1] as const
const IMG = (w: number, h: number, seed: string) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`

function AgencyMockup() {
  const clients = [
    { name: 'Brand Alpha', assets: 24, done: 24, color: '#2563EB' },
    { name: 'Studio Beta', assets: 18, done: 15, color: '#0891B2' },
    { name: 'Corp Gamma', assets: 36, done: 36, color: '#16A34A' },
    { name: 'Nova Delta', assets: 12, done: 8, color: '#D97706' },
  ]
  return (
    <div className="flex h-full gap-3">
      <div className="w-40 flex-shrink-0 rounded-xl p-3 flex flex-col gap-1.5"
        style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#94A3B8' }}>Clientes</p>
        {clients.map((c) => (
          <div key={c.name} className="flex items-center justify-between rounded-lg px-2 py-1.5"
            style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-[10px] font-medium" style={{ color: '#0F172A' }}>{c.name}</span>
            </div>
            <span className="text-[9px]" style={{ color: '#64748B' }}>{c.done}/{c.assets}</span>
          </div>
        ))}
        <div className="mt-auto pt-2 border-t" style={{ borderColor: '#E2E8F0' }}>
          <div className="rounded-lg px-2 py-1 text-[9px] font-semibold text-center"
            style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
            + Novo cliente
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold" style={{ color: '#0F172A' }}>Brand Alpha · Campanha Q2</span>
          <span className="rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>✓ 24 assets prontos</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 flex-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="relative overflow-hidden rounded-lg"
              style={{ border: '1px solid #E2E8F0' }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, duration: 0.35, ease: EASE }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG(80, 80, `agency-${i}`)} alt="" className="w-full h-full object-cover aspect-square" />
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.1)' }} />
              <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: '#16A34A' }}>
                <svg viewBox="0 0 8 8" fill="none" className="w-2 h-2" stroke="white" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 4l2 2 3-3" />
                </svg>
              </div>
              <div className="absolute top-1 left-1 rounded px-1 text-[7px] font-bold text-white"
                style={{ background: 'rgba(0,0,0,0.5)' }}>
                {['1:1', '9:16', '4:5', '16:9', '1:1', '9:16', '4:5', '16:9'][i]}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="rounded-xl px-3 py-2 flex items-center justify-between"
          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <span className="text-[10px] font-semibold" style={{ color: '#1D4ED8' }}>Exportar tudo · ZIP por plataforma</span>
          <div className="rounded-lg px-3 py-1 text-[9px] font-bold text-white"
            style={{ background: '#2563EB' }}>Baixar</div>
        </div>
      </div>
    </div>
  )
}

function MediaBuyerMockup() {
  const steps = [
    { label: 'Upload', done: true, time: '0:02' },
    { label: 'Análise automática', done: true, time: '0:08' },
    { label: 'Formatos', done: true, time: '0:15' },
    { label: 'Download', done: false, time: '—' },
  ]
  return (
    <div className="flex h-full gap-4 items-center">
      <div className="relative w-44 flex-shrink-0 rounded-xl overflow-hidden"
        style={{ height: 220, border: '1px solid #E2E8F0' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/built-for-photographer.png" alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 45%' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <div className="text-[9px] font-bold text-white">Criativo original</div>
          <div className="text-[8px] text-slate-300">2340 × 1080 · JPG</div>
        </div>
        <div className="absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white"
          style={{ background: '#2563EB' }}>Auto</div>
      </div>

      <div className="flex flex-col gap-2 flex-shrink-0">
        {steps.map((s, i) => (
          <motion.div
            key={s.label}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
            style={{
              background: s.done ? '#F0FDF4' : '#EFF6FF',
              border: `1px solid ${s.done ? '#BBF7D0' : '#BFDBFE'}`,
              minWidth: 160,
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: EASE }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
              style={{ background: s.done ? '#16A34A' : '#EFF6FF', color: s.done ? '#fff' : '#2563EB', border: s.done ? 'none' : '1px solid #BFDBFE' }}>
              {s.done ? '✓' : i + 1}
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-semibold" style={{ color: '#0F172A' }}>{s.label}</div>
              <div className="text-[8px]" style={{ color: '#64748B' }}>{s.time}</div>
            </div>
          </motion.div>
        ))}
        <div className="rounded-xl px-3 py-2 mt-1"
          style={{ background: '#ECFEFF', border: '1px solid #A5F3FC' }}>
          <div className="text-[9px]" style={{ color: '#64748B' }}>Tempo total</div>
          <div className="text-sm font-bold" style={{ color: '#0891B2' }}>0:25 <span className="text-[10px] font-normal" style={{ color: '#94A3B8' }}>vs 4h manual</span></div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-1.5">
        {[
          { label: '1:1 Feed',    w: 100, h: 100, objPos: 'center 50%' },
          { label: '9:16 Story',  w: 58,  h: 102, objPos: 'center 40%' },
          { label: '16:9 Banner', w: 124, h: 70,  objPos: 'center 50%' },
          { label: '4:5 Feed',    w: 82,  h: 102, objPos: 'center 45%' },
        ].map((f, i) => (
          <motion.div
            key={f.label}
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.07, duration: 0.4, ease: EASE }}
          >
            <div className="relative overflow-hidden rounded-md mx-auto"
              style={{ width: f.w, height: f.h, border: '1px solid #E2E8F0' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/built-for-photographer.png" alt={f.label} className="w-full h-full object-cover" style={{ objectPosition: f.objPos }} />
              <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ background: '#16A34A' }}>
                <svg viewBox="0 0 8 8" fill="none" className="w-2 h-2" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 4l2 2 3-3" />
                </svg>
              </div>
            </div>
            <span className="text-[8px]" style={{ color: '#64748B' }}>{f.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const CONCERT_IMG = '/built-for-concert.png'

function EcommerceMockup() {
  const platforms = [
    { name: 'Meta Feed', ratio: '1:1',    color: '#1877f2', objPos: 'center 35%' },
    { name: 'Stories',   ratio: '9:16',   color: '#1877f2', objPos: 'center 25%' },
    { name: 'TikTok',   ratio: '9:16',   color: '#ff0050', objPos: 'center 20%' },
    { name: 'Google',   ratio: '16:9',   color: '#4285f4', objPos: 'center 30%' },
    { name: 'LinkedIn', ratio: '1.91:1', color: '#0a66c2', objPos: 'center 30%' },
  ]
  return (
    <div className="flex h-full gap-4 items-center">
      <div className="flex-shrink-0">
        <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>Original</div>
        <div className="relative overflow-hidden rounded-xl"
          style={{ width: 140, height: 140, border: '1px solid #E2E8F0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CONCERT_IMG} alt="Criativo original" className="w-full h-full object-cover" style={{ objectPosition: 'center 30%' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-1.5 left-0 right-0 text-center text-[8px] font-bold text-white">Criativo</div>
        </div>
      </div>

      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, transparent, #BFDBFE)' }} />
        <div className="rounded-full p-1.5" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" stroke="#2563EB" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M8.5 4l4.5 4-4.5 4" />
          </svg>
        </div>
        <div className="w-px h-8" style={{ background: 'linear-gradient(to top, transparent, #BFDBFE)' }} />
        <span className="text-[8px] font-semibold" style={{ color: '#2563EB' }}>Auto</span>
      </div>

      <div className="flex-1">
        <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>Todos os placements</div>
        <div className="flex flex-wrap gap-2 items-end">
          {platforms.map((p, i) => (
            <motion.div
              key={p.name}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: EASE }}
            >
              <div className="relative overflow-hidden rounded-lg"
                style={{
                  width: p.ratio === '9:16' ? 62 : p.ratio === '16:9' || p.ratio === '1.91:1' ? 116 : 86,
                  height: p.ratio === '9:16' ? 110 : p.ratio === '16:9' || p.ratio === '1.91:1' ? 61 : 86,
                  border: `1px solid ${p.color}30`,
                }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={CONCERT_IMG} alt={p.name} className="w-full h-full object-cover" style={{ objectPosition: p.objPos }} />
                <div className="absolute top-0.5 left-0 right-0 flex justify-center">
                  <div className="rounded-b px-1 text-[6px] font-bold text-white"
                    style={{ backgroundColor: p.color }}>{p.ratio}</div>
                </div>
                <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full flex items-center justify-center"
                  style={{ background: '#16A34A' }}>
                  <svg viewBox="0 0 8 8" fill="none" className="w-2 h-2" stroke="#fff" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 4l2 2 3-3" />
                  </svg>
                </div>
              </div>
              <span className="text-[7px] text-center leading-tight w-14" style={{ color: '#64748B' }}>{p.name}</span>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="mt-3 rounded-lg px-3 py-1.5 flex items-center gap-2"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-[9px] font-semibold" style={{ color: '#16A34A' }}>✓ Identidade visual consistente em todos os canais</span>
        </motion.div>
      </div>
    </div>
  )
}

function GrowthMockup() {
  const variants = [
    { id: 'A', label: 'Variant A', ctr: '4.2%', spend: 'R$ 320', status: 'winner', seed: 'growth-a' },
    { id: 'B', label: 'Variant B', ctr: '3.1%', spend: 'R$ 280', status: 'running', seed: 'growth-b' },
    { id: 'C', label: 'Variant C', ctr: '2.8%', spend: 'R$ 240', status: 'running', seed: 'growth-c' },
  ]
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: '#0F172A' }}>A/B Test · Campanha Growth Q2</span>
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-semibold" style={{ color: '#16A34A' }}>Live · 3 variantes</span>
        </div>
      </div>

      <div className="flex gap-2 flex-1">
        {variants.map((v, i) => (
          <motion.div
            key={v.id}
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: v.status === 'winner' ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
              background: v.status === 'winner' ? '#EFF6FF' : '#F8FAFC',
            }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: EASE }}
          >
            <div className="relative flex-1 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG(120, 80, v.seed)} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.15)' }} />
              {v.status === 'winner' && (
                <div className="absolute top-1.5 left-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white"
                  style={{ background: '#2563EB' }}>
                  🏆 Winner
                </div>
              )}
              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: 'rgba(0,0,0,0.5)' }}>{v.id}</div>
            </div>
            <div className="p-2">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[9px]" style={{ color: '#64748B' }}>CTR</span>
                <span className="text-[11px] font-bold" style={{ color: v.status === 'winner' ? '#2563EB' : '#64748B' }}>{v.ctr}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: v.status === 'winner' ? '#2563EB' : '#CBD5E1' }}
                  initial={{ width: 0 }}
                  animate={{ width: v.status === 'winner' ? '85%' : v.id === 'B' ? '63%' : '57%' }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.7, ease: EASE }}
                />
              </div>
              <div className="mt-1 text-[8px]" style={{ color: '#94A3B8' }}>{v.spend}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl px-3 py-2 flex items-center justify-between"
        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <span className="text-[10px]" style={{ color: '#1D4ED8' }}>Variant A supera B em <strong>+35% CTR</strong></span>
        <div className="rounded-lg px-2 py-1 text-[9px] font-bold text-white"
          style={{ background: '#2563EB' }}>Escalar A</div>
      </div>
    </div>
  )
}

const TABS = [
  {
    id: 'buyers',
    label: 'Media Buyers',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
    ),
    color: '#0891B2',
    headline: 'Do briefing à publicação em minutos',
    sub: 'Pare de esperar o time criativo. Adapte qualquer criativo para qualquer placement sem sair do seu fluxo.',
    Mockup: MediaBuyerMockup,
  },
  {
    id: 'ecommerce',
    label: 'E-commerce',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5v-7.5a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 12v7.5A1.5 1.5 0 0 0 3.75 21Z" />
      </svg>
    ),
    color: '#16A34A',
    headline: 'Consistência visual em todos os placements',
    sub: 'Um produto. Cinco plataformas. Todos os formatos. Sem retrabalho.',
    Mockup: EcommerceMockup,
  },
  {
    id: 'growth',
    label: 'Growth Teams',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
    color: '#D97706',
    headline: 'Automatize operações criativas multi-canal',
    sub: 'Lance testes A/B mais rápido. Distribua variantes em múltiplos canais automaticamente.',
    Mockup: GrowthMockup,
  },
] as const

export function BuiltForSection() {
  const [active, setActive] = useState(0)
  const tab = TABS[active]

  return (
    <section
      id="solucoes"
      className="relative py-16 sm:py-24 overflow-x-hidden"
      style={{ backgroundColor: '#F1F5F9' }}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1"
            style={{ borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#2563EB' }} />
            <span className="text-xs font-semibold" style={{ color: '#1D4ED8' }}>Para quem é</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
            className="font-display text-3xl font-bold sm:text-4xl"
            style={{ color: '#0F172A' }}
          >
            Feito para times que operam{' '}
            <span style={{ color: '#2563EB' }}>mídia em escala</span>
          </motion.h2>
        </div>

        {/* Tab nav */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
          className="mb-6 flex justify-center gap-2 flex-wrap"
        >
          {TABS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(i)}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: active === i ? '#EFF6FF' : '#FFFFFF',
                color: active === i ? t.color : '#64748B',
                border: `1px solid ${active === i ? '#BFDBFE' : '#E2E8F0'}`,
                boxShadow: active === i ? '0 1px 4px rgba(37,99,235,0.1)' : 'none',
              }}
            >
              <span style={{ color: active === i ? t.color : '#94A3B8' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.18, ease: EASE }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
            {/* Left: info */}
            <div
              className="flex flex-col justify-center p-8 border-b lg:border-b-0 lg:border-r"
              style={{ borderColor: '#F1F5F9' }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: '#EFF6FF', color: tab.color, border: '1px solid #BFDBFE' }}>
                    {tab.icon}
                  </div>
                  <h3 className="mb-3 text-lg font-semibold leading-snug" style={{ color: '#0F172A' }}>
                    {tab.headline}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{tab.sub}</p>

                  <div className="mt-8 flex gap-1.5">
                    {TABS.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActive(i)}
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: active === i ? 20 : 6,
                          height: 6,
                          backgroundColor: active === i ? tab.color : '#E2E8F0',
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right: mockup — scrollable on mobile */}
            <div className="relative p-4 sm:p-6 overflow-x-auto min-w-0" style={{ minHeight: 280, background: '#FAFBFC' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab.id}
                  className="h-full"
                  style={{ minHeight: 260, minWidth: 500 }}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <tab.Mockup />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
