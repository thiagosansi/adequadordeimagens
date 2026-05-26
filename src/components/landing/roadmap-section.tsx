'use client'

import { motion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

const ITEMS = [
  {
    id: 'variants',
    status: 'Planejado',
    statusColor: '#D97706',
    statusBg: '#FFFBEB',
    statusBorder: '#FDE68A',
    quarter: 'Q3 2026',
    title: 'A/B Variants',
    description:
      'Geração de 3 imagens distintas por IA a partir de 1 upload — mesmos elementos visuais, composições diferentes — prontas para testes A/B reais.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    iconBg: '#FFFBEB',
    visual: (
      <div className="h-full flex flex-col justify-between py-2 px-3">
        <div className="flex items-end justify-center gap-2">
          {(['A', 'B', 'C'] as const).map((v, i) => (
            <div key={v} className="flex flex-col items-center gap-1">
              <div className="relative overflow-hidden rounded-md"
                style={{ width: 36, height: i === 1 ? 52 : 44, border: `1px solid ${i === 0 ? '#FDE68A' : '#E2E8F0'}` }}>
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
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-medium shrink-0" style={{ color: '#94A3B8' }}>Via IA:</span>
          <div className="flex gap-1 flex-wrap">
            <div className="flex items-center gap-1 rounded-md px-1.5 py-0.5"
              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <span className="text-[7px] font-bold" style={{ color: '#16A34A' }}>fal.ai</span>
              <span className="text-[7px]" style={{ color: '#64748B' }}>FLUX · ~$0,05/set</span>
            </div>
            <div className="flex items-center gap-1 rounded-md px-1.5 py-0.5"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <span className="text-[7px] font-bold" style={{ color: '#475569' }}>OpenAI</span>
              <span className="text-[7px]" style={{ color: '#94A3B8' }}>~$0,25/set</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'photoshop-plugin',
    status: 'Em breve',
    statusColor: '#D97706',
    statusBg: '#FFFBEB',
    statusBorder: '#FDE68A',
    quarter: 'Q1 2027',
    title: 'Plugin Photoshop',
    description:
      'Exporte layers e documentos do Photoshop direto para o AdFrame via Adobe UXP. Adapte criativos para todas as plataformas sem sair do seu fluxo de produção.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
      </svg>
    ),
    iconBg: '#FFFBEB',
    visual: (
      <div className="relative h-full flex flex-col justify-center gap-2 px-3">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5"
          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"
            style={{ background: '#001E36' }}>
            <span className="text-[7px] font-black" style={{ color: '#31A8FF' }}>Ps</span>
          </div>
          <span className="text-[9px] font-medium" style={{ color: '#0F172A' }}>campanha-verao.psd</span>
          <div className="ml-auto text-[8px] font-semibold px-1.5 py-px rounded"
            style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
            Exportar →
          </div>
        </div>
        <div className="flex items-center justify-center gap-1" style={{ color: '#94A3B8' }}>
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v12M3 9l5 5 5-5" />
          </svg>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5"
          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: '#2563EB' }}>
            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-white" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <span className="text-[9px] font-medium" style={{ color: '#1D4ED8' }}>AdFrame — pronto para adaptar</span>
        </div>
      </div>
    ),
  },
  {
    id: 'figma-plugin',
    status: 'Em breve',
    statusColor: '#7C3AED',
    statusBg: '#F5F3FF',
    statusBorder: '#DDD6FE',
    quarter: 'Q4 2026',
    title: 'Plugin Figma',
    description:
      'Exporte frames do Figma direto para o AdFrame com um clique. Aplique Brand Kit, gere variantes e publique assets sem sair do seu fluxo de design.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
      </svg>
    ),
    iconBg: '#F5F3FF',
    visual: (
      <div className="relative h-full flex flex-col justify-center gap-2 px-3">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5"
          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"
            style={{ background: '#1E1E1E' }}>
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
              <path d="M8 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" fill="#F24E1E"/>
              <path d="M8 12a4 4 0 0 0 0 8h4v-8H8Z" fill="#0ACF83"/>
              <path d="M12 12h4a4 4 0 0 1 0 8v0a4 4 0 0 1-4-4v-4Z" fill="#A259FF"/>
              <path d="M12 4H8a4 4 0 0 0 0 8h4V4Z" fill="#F24E1E"/>
              <path d="M16 4h-4v8h4a4 4 0 0 0 0-8Z" fill="#FF7262"/>
            </svg>
          </div>
          <span className="text-[9px] font-medium" style={{ color: '#0F172A' }}>hero-banner.fig</span>
          <div className="ml-auto text-[8px] font-semibold px-1.5 py-px rounded"
            style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
            Exportar →
          </div>
        </div>
        <div className="flex items-center justify-center gap-1" style={{ color: '#94A3B8' }}>
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
            <path d="M8 1v14M1 8l7 7 7-7" stroke="currentColor" strokeWidth={1.5} fill="none"/>
          </svg>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5"
          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: '#2563EB' }}>
            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-white" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <span className="text-[9px] font-medium" style={{ color: '#1D4ED8' }}>AdFrame — pronto para adaptar</span>
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
          <div className="hidden lg:block absolute top-[72px] left-[16.5%] right-[16.5%] h-px"
            style={{ background: 'linear-gradient(90deg, #BFDBFE, #DDD6FE, #DDD6FE)' }}
          />

          {/* Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
            Roadmap atualizado em maio de 2026 ·{' '}
            <span className="cursor-pointer transition-colors hover:text-blue-600" style={{ color: '#2563EB' }}>
              Sugira uma feature →
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
