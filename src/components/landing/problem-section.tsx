'use client'

import { motion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

const PROBLEMS = [
  {
    id: 'rework',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
    iconColor: '#DC2626',
    iconBg: '#FEF2F2',
    borderColor: '#FECACA',
    title: 'Retrabalho constante',
    description:
      'Cada placement exige uma versão diferente do criativo. O time repete o mesmo trabalho para Meta, TikTok e Google — todo mês, para cada campanha.',
    stat: '~4h',
    statLabel: 'por campanha, por plataforma',
    statColor: '#DC2626',
    statBg: '#FEF2F2',
  },
  {
    id: 'performance',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    iconColor: '#EA580C',
    iconBg: '#FFF7ED',
    borderColor: '#FED7AA',
    title: 'Performance comprometida',
    description:
      'Rostos cortados. Produto fora do enquadramento. CTA na área de sobreposição da UI. As plataformas redimensionam sem critério — e o CPM sobe.',
    stat: '−34%',
    statLabel: 'CTR com criativos mal dimensionados',
    statColor: '#EA580C',
    statBg: '#FFF7ED',
  },
  {
    id: 'bottleneck',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    iconColor: '#7C3AED',
    iconBg: '#F5F3FF',
    borderColor: '#DDD6FE',
    title: 'Gargalo operacional',
    description:
      'Media buyers dependem do time criativo para cada variação de formato. A velocidade de lançamento cai, testes A/B atrasam e oportunidades são perdidas.',
    stat: '3–5 dias',
    statLabel: 'tempo médio entre briefing e publicação',
    statColor: '#7C3AED',
    statBg: '#F5F3FF',
  },
  {
    id: 'consistency',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
    ),
    iconColor: '#0369A1',
    iconBg: '#F0F9FF',
    borderColor: '#BAE6FD',
    title: 'Inconsistência visual',
    description:
      'Sem padronização entre canais, a marca fica fragmentada. Cada plataforma parece uma campanha diferente — prejudicando o reconhecimento e o brand equity.',
    stat: '60%',
    statLabel: 'das marcas sem consistência cross-channel',
    statColor: '#0369A1',
    statBg: '#F0F9FF',
  },
] as const

export function ProblemSection() {
  return (
    <section
      className="relative py-16 sm:py-24"
      style={{ backgroundColor: '#F1F5F9' }}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1"
            style={{ borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="text-xs font-semibold" style={{ color: '#DC2626' }}>O problema atual</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
            className="font-display text-3xl font-bold sm:text-4xl"
            style={{ color: '#0F172A' }}
          >
            Adaptar criativos manualmente{' '}
            <span style={{ color: '#DC2626' }}>não escala</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="mt-4 text-base max-w-xl mx-auto"
            style={{ color: '#64748B' }}
          >
            Times de mídia crescem em volume, mas o processo criativo continua manual.
            O gargalo não é criatividade — é operação.
          </motion.p>
        </div>

        {/* Cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
          {PROBLEMS.map((problem, i) => (
            <motion.div
              key={problem.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: EASE }}
              className="group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              {/* Icon */}
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: problem.iconBg,
                  color: problem.iconColor,
                  border: `1px solid ${problem.borderColor}`,
                }}
              >
                {problem.icon}
              </div>

              {/* Title */}
              <h3 className="mb-2 text-base font-semibold" style={{ color: '#0F172A' }}>
                {problem.title}
              </h3>

              {/* Description */}
              <p className="mb-5 text-sm leading-relaxed" style={{ color: '#64748B' }}>
                {problem.description}
              </p>

              {/* Stat */}
              <div
                className="flex items-baseline gap-2 rounded-xl px-3 py-2"
                style={{ backgroundColor: problem.statBg, border: `1px solid ${problem.borderColor}` }}
              >
                <span className="font-display text-lg font-bold" style={{ color: problem.statColor }}>
                  {problem.stat}
                </span>
                <span className="text-xs" style={{ color: problem.statColor, opacity: 0.75 }}>
                  {problem.statLabel}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom hint */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
          className="mt-12 flex justify-center"
        >
          <div className="flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4" style={{ color: '#2563EB' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
            </svg>
            Existe uma forma melhor
          </div>
        </motion.div>
      </div>
    </section>
  )
}
