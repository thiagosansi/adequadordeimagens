'use client'

import { motion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

const ITEMS = [
  {
    id: 'saliency',
    status: 'Em desenvolvimento',
    statusColor: '#2563EB',
    statusBg: '#EFF6FF',
    statusBorder: '#BFDBFE',
    quarter: 'Q3 2025',
    title: 'Smart Saliency',
    description:
      'Mapeamento visual de atenção para sugerir o melhor enquadramento. O sistema indica onde o olhar humano foca antes mesmo do crop.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
    iconBg: '#EFF6FF',
    visual: (
      <div className="relative h-full flex items-center justify-center">
        <div className="relative w-28 h-20 rounded-lg overflow-hidden"
          style={{ border: '1px solid #E2E8F0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://picsum.photos/seed/saliency/112/80" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 40% 35% at 55% 35%, rgba(220,38,38,0.5) 0%, rgba(234,88,12,0.25) 45%, transparent 70%)',
          }} />
        </div>
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
          {['#ef4444','#f97316','#eab308','#86efac','#60a5fa'].map((c, i) => (
            <div key={i} className="w-2 h-2 rounded-sm" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="absolute bottom-1 left-0 right-0 text-center text-[8px]" style={{ color: '#94A3B8' }}>
          Mapa de atenção
        </div>
      </div>
    ),
  },
  {
    id: 'prediction',
    status: 'Disponível',
    statusColor: '#16A34A',
    statusBg: '#F0FDF4',
    statusBorder: '#BBF7D0',
    quarter: 'Lançado',
    title: 'Performance Prediction',
    description:
      'Estimativa de CTR e CPM antes da publicação com base em benchmarks históricos por formato e plataforma.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
    iconBg: '#ECFEFF',
    visual: (
      <div className="relative h-full flex items-end justify-center gap-2 pb-4 px-2">
        {[
          { h: '55%', color: '#16A34A', label: 'A' },
          { h: '40%', color: '#D97706', label: 'B' },
          { h: '70%', color: '#16A34A', label: 'C' },
          { h: '30%', color: '#DC2626', label: 'D' },
          { h: '65%', color: '#16A34A', label: 'E' },
        ].map(({ h, color, label }) => (
          <div key={label} className="flex flex-col items-center gap-1 flex-1">
            <div className="text-[8px] font-bold" style={{ color }}>{label}</div>
            <motion.div
              className="w-full rounded-t-sm"
              style={{ height: h, backgroundColor: `${color}25`, border: `1px solid ${color}50` }}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE }}
            />
          </div>
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: '#E2E8F0' }} />
        <div className="absolute bottom-1 left-0 text-[7px]" style={{ color: '#94A3B8' }}>CTR estimado</div>
      </div>
    ),
  },
  {
    id: 'variants',
    status: 'Planejado',
    statusColor: '#D97706',
    statusBg: '#FFFBEB',
    statusBorder: '#FDE68A',
    quarter: 'Q1 2026',
    title: 'A/B Variants',
    description:
      'Geração automática de variantes visuais para testes A/B. O sistema cria versões com enquadramentos e composições diferentes a partir de um único upload.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    iconBg: '#FFFBEB',
    visual: (
      <div className="relative h-full flex items-center justify-center gap-2">
        {['A', 'B', 'C'].map((v, i) => (
          <div key={v} className="flex flex-col items-center gap-1">
            <div className="relative overflow-hidden rounded-md"
              style={{ width: 40, height: i === 1 ? 56 : 48, border: `1px solid ${i === 0 ? '#FDE68A' : '#E2E8F0'}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://picsum.photos/seed/variant-${v}/40/60`} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="text-[8px] font-bold rounded-full px-1.5 py-px"
              style={{
                background: i === 0 ? '#FFFBEB' : '#F8FAFC',
                color: i === 0 ? '#D97706' : '#94A3B8',
                border: `1px solid ${i === 0 ? '#FDE68A' : '#E2E8F0'}`,
              }}>
              {v}
            </div>
          </div>
        ))}
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
          style={{ backgroundColor: '#D97706' }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          +
        </motion.div>
      </div>
    ),
  },
  {
    id: 'intelligence',
    status: 'Disponível',
    statusColor: '#16A34A',
    statusBg: '#F0FDF4',
    statusBorder: '#BBF7D0',
    quarter: 'Lançado',
    title: 'Creative Intelligence',
    description:
      'Insights de adaptação cross-platform: quais elementos visuais performam melhor por canal, formato e audiência — com recomendações acionáveis.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
    iconBg: '#F0FDF4',
    visual: (
      <div className="relative h-full flex flex-col justify-center gap-1.5 px-2">
        {[
          { platform: 'Meta',   score: 87, color: '#1877f2' },
          { platform: 'TikTok', score: 73, color: '#ff0050' },
          { platform: 'Google', score: 91, color: '#4285f4' },
        ].map(({ platform, score, color }) => (
          <div key={platform}>
            <div className="flex justify-between mb-0.5">
              <span className="text-[8px]" style={{ color: '#64748B' }}>{platform}</span>
              <span className="text-[8px] font-bold" style={{ color }}>{score}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${score}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
              />
            </div>
          </div>
        ))}
        <div className="mt-1 rounded-lg px-2 py-1 text-[8px]"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A' }}>
          ✦ Meta tem melhor CPM para este formato
        </div>
      </div>
    ),
  },
] as const

export function RoadmapSection() {
  return (
    <section className="relative py-16 sm:py-24" style={{ backgroundColor: '#F1F5F9' }}>
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }}
            className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1"
            style={{ borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#2563EB' }} />
            <span className="text-xs font-semibold" style={{ color: '#1D4ED8' }}>Roadmap</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
            className="font-display text-3xl font-bold sm:text-4xl"
            style={{ color: '#0F172A' }}
          >
            O que está chegando ao{' '}
            <span style={{ color: '#2563EB' }}>AdFrame</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="mt-4 text-base max-w-xl mx-auto"
            style={{ color: '#64748B' }}
          >
            Estamos construindo a infraestrutura definitiva para operações criativas de mídia paga.
          </motion.p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Horizontal connector on desktop */}
          <div className="hidden lg:block absolute top-[72px] left-[12.5%] right-[12.5%] h-px"
            style={{ background: 'linear-gradient(90deg, #BFDBFE, #E2E8F0, #DDD6FE)' }}
          />

          {/* Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ITEMS.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: EASE }}
                className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* Timeline dot */}
                <div className="absolute -top-px left-1/2 -translate-x-1/2 hidden lg:flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white z-10"
                    style={{ backgroundColor: item.statusColor }} />
                </div>

                {/* Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: item.iconBg, color: item.statusColor, border: `1px solid ${item.statusBorder}` }}>
                      {item.icon}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                        style={{ backgroundColor: item.statusBg, color: item.statusColor, border: `1px solid ${item.statusBorder}` }}>
                        {item.status}
                      </div>
                      <span className="text-[9px]" style={{ color: '#94A3B8' }}>{item.quarter}</span>
                    </div>
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: '#0F172A' }}>{item.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>{item.description}</p>
                </div>

                {/* Visual area */}
                <div className="mx-4 mb-4 flex-1 rounded-xl overflow-hidden"
                  style={{ height: 100, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  {item.visual}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            Roadmap atualizado em maio de 2025 ·{' '}
            <span className="cursor-pointer transition-colors hover:text-blue-600" style={{ color: '#2563EB' }}>
              Sugira uma feature →
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
