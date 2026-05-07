'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const EASE = [0.16, 1, 0.3, 1] as const

const MEMBERS = [
  { name: 'Ana Lima',    role: 'Admin',       color: '#2563EB', initials: 'AL', online: true  },
  { name: 'Bruno Melo',  role: 'Media Buyer', color: '#0891B2', initials: 'BM', online: true  },
  { name: 'Carol Dias',  role: 'Designer',    color: '#D97706', initials: 'CD', online: false },
  { name: 'Diego Faro',  role: 'Viewer',      color: '#16A34A', initials: 'DF', online: true  },
]

const PROJECTS = [
  { name: 'Campanha Meta Q2',    assets: 24, status: 'active'   },
  { name: 'TikTok — Lançamento', assets: 12, status: 'review'   },
  { name: 'Google Display',      assets: 36, status: 'approved' },
  { name: 'Brand Kit v3',        assets: 8,  status: 'active'   },
]

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  active:   { label: 'Ativo',      bg: '#EFF6FF',  color: '#2563EB', border: '#BFDBFE' },
  review:   { label: 'Em revisão', bg: '#FFFBEB',  color: '#D97706', border: '#FDE68A' },
  approved: { label: 'Aprovado',   bg: '#F0FDF4',  color: '#16A34A', border: '#BBF7D0' },
}

const WORKFLOW = [
  { step: 'Upload',    done: true  },
  { step: 'Adaptação', done: true  },
  { step: 'Revisão',  done: true  },
  { step: 'Aprovação', done: false },
  { step: 'Publish',  done: false },
]

const BRAND_COLORS = ['#2563EB', '#0891B2', '#D97706', '#0F172A', '#FFFFFF']

const HIGHLIGHTS = [
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: '#2563EB',
    iconBg: '#EFF6FF',
    iconBorder: '#BFDBFE',
    title: 'Controle de acesso',
    description: 'Roles granulares: Admin, Editor, Media Buyer e Viewer com permissões por projeto.',
  },
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    color: '#16A34A',
    iconBg: '#F0FDF4',
    iconBorder: '#BBF7D0',
    title: 'Fluxo de aprovação',
    description: 'Workflows de revisão configuráveis antes da exportação. Nenhum asset sai sem aprovação.',
  },
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
      </svg>
    ),
    color: '#D97706',
    iconBg: '#FFFBEB',
    iconBorder: '#FDE68A',
    title: 'Brand Kits',
    description: 'Paletas, fontes e guidelines de marca centralizados. Todos os exports respeitam o padrão.',
  },
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
    ),
    color: '#0891B2',
    iconBg: '#ECFEFF',
    iconBorder: '#A5F3FC',
    title: 'Multi-workspace',
    description: 'Separe clientes, marcas e campanhas em workspaces independentes com configurações próprias.',
  },
] as const

function WorkspaceMockup() {
  const [activeProject, setActiveProject] = useState(0)

  return (
    <div className="flex h-full gap-0 overflow-hidden rounded-xl"
      style={{ border: '1px solid #E2E8F0' }}>

      {/* Sidebar */}
      <div className="w-48 flex-shrink-0 flex flex-col"
        style={{ background: '#F8FAFC', borderRight: '1px solid #E2E8F0' }}>

        <div className="p-3 border-b" style={{ borderColor: '#E2E8F0' }}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: '#2563EB' }}>A</div>
            <span className="text-[11px] font-semibold" style={{ color: '#0F172A' }}>AdFrame Agency</span>
          </div>
        </div>

        <div className="flex-1 p-2 overflow-hidden">
          <p className="text-[8px] font-bold uppercase tracking-wider mb-1.5 px-1" style={{ color: '#94A3B8' }}>Projetos</p>
          {PROJECTS.map((p, i) => {
            const st = STATUS_STYLE[p.status]
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => setActiveProject(i)}
                className="w-full text-left rounded-lg px-2 py-1.5 mb-0.5 flex items-center justify-between transition-colors duration-150"
                style={{ background: activeProject === i ? '#EFF6FF' : 'transparent', border: activeProject === i ? '1px solid #BFDBFE' : '1px solid transparent' }}
              >
                <span className="text-[10px] font-medium truncate" style={{ color: '#0F172A' }}>{p.name}</span>
                <span className="text-[8px] font-bold ml-1 flex-shrink-0" style={{ color: st.color }}>{p.assets}</span>
              </button>
            )
          })}
        </div>

        <div className="p-2 border-t" style={{ borderColor: '#E2E8F0' }}>
          <p className="text-[8px] font-bold uppercase tracking-wider mb-1.5 px-1" style={{ color: '#94A3B8' }}>Equipe</p>
          {MEMBERS.map((m) => (
            <div key={m.name} className="flex items-center gap-1.5 px-1 py-1">
              <div className="relative flex-shrink-0">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                  style={{ backgroundColor: m.color }}>
                  {m.initials}
                </div>
                {m.online && (
                  <div className="absolute -bottom-px -right-px w-1.5 h-1.5 rounded-full bg-green-400 border border-white" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-medium truncate" style={{ color: '#0F172A' }}>{m.name}</div>
                <div className="text-[7px]" style={{ color: '#94A3B8' }}>{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: '#FFFFFF' }}>

        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: '#E2E8F0' }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={activeProject}
              className="text-sm font-semibold"
              style={{ color: '#0F172A' }}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25 }}
            >
              {PROJECTS[activeProject].name}
            </motion.span>
          </AnimatePresence>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {WORKFLOW.map((w, i) => (
                <div key={w.step} className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-semibold"
                    style={{ background: w.done ? '#16A34A' : '#F1F5F9', color: w.done ? '#fff' : '#94A3B8', border: w.done ? 'none' : '1px solid #E2E8F0' }}>
                    {w.done ? '✓' : i + 1}
                  </div>
                  {i < WORKFLOW.length - 1 && (
                    <div className="w-3 h-px" style={{ background: w.done ? '#16A34A' : '#E2E8F0' }} />
                  )}
                </div>
              ))}
            </div>
            <div className="rounded-lg px-2.5 py-1 text-[9px] font-bold text-white"
              style={{ background: '#2563EB' }}>Aprovar</div>
          </div>
        </div>

        <div className="flex-1 p-3 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 h-full">
            {Array.from({ length: 8 }).map((_, i) => (
              <AnimatePresence key={i} mode="wait">
                <motion.div
                  key={`${activeProject}-${i}`}
                  className="relative overflow-hidden rounded-lg aspect-square"
                  style={{ border: '1px solid #E2E8F0' }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.3, ease: EASE }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://picsum.photos/seed/ent-${activeProject}-${i}/80/80`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.06)' }} />
                  <div className="absolute top-1 left-1 rounded px-1 text-[6px] font-bold text-white"
                    style={{ background: i < 5 ? '#16A34A' : i === 5 ? '#D97706' : 'rgba(0,0,0,0.45)' }}>
                    {i < 5 ? '✓' : i === 5 ? '…' : '—'}
                  </div>
                  <div className="absolute bottom-1 right-1 rounded px-1 text-[6px]"
                    style={{ background: 'rgba(255,255,255,0.85)', color: '#64748B' }}>
                    {['1:1','9:16','4:5','16:9','1:1','9:16','4:5','16:9'][i]}
                  </div>
                </motion.div>
              </AnimatePresence>
            ))}
          </div>
        </div>

        <div className="px-3 py-2 border-t flex items-center gap-3 flex-shrink-0"
          style={{ borderColor: '#E2E8F0' }}>
          <span className="text-[9px] font-semibold" style={{ color: '#94A3B8' }}>Brand Kit</span>
          <div className="flex items-center gap-1">
            {BRAND_COLORS.map((c) => (
              <div key={c} className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: c, borderColor: '#E2E8F0' }} />
            ))}
          </div>
          <span className="text-[8px] ml-1" style={{ color: '#94A3B8' }}>Inter · Space Grotesk</span>
          <div className="ml-auto flex -space-x-1">
            {MEMBERS.filter(m => m.online).map(m => (
              <div key={m.name} className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-bold text-white"
                style={{ backgroundColor: m.color }}>
                {m.initials[0]}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function EnterpriseSection() {
  return (
    <section className="relative py-16 sm:py-24" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }}
            className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1"
            style={{ borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#2563EB' }} />
            <span className="text-xs font-semibold" style={{ color: '#1D4ED8' }}>Para equipes</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
            className="font-display text-3xl font-bold sm:text-4xl"
            style={{ color: '#0F172A' }}
          >
            Estrutura pronta para{' '}
            <span style={{ color: '#2563EB' }}>equipes modernas</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="mt-4 text-base max-w-lg mx-auto"
            style={{ color: '#64748B' }}
          >
            Do freelancer à agência com 50 pessoas. Workspaces, aprovações e brand kits para operar sem fricção.
          </motion.p>
        </div>

        {/* Workspace mockup — hidden on mobile, shown on sm+ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="hidden sm:block mb-12 mx-auto"
          style={{ height: 340 }}
        >
          <WorkspaceMockup />
        </motion.div>

        {/* Highlights grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
              className="rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: h.iconBg, color: h.color, border: `1px solid ${h.iconBorder}` }}>
                {h.icon}
              </div>
              <h3 className="mb-1.5 text-sm font-semibold" style={{ color: '#0F172A' }}>{h.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>{h.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
