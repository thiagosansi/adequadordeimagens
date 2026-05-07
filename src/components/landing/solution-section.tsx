'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'

const EASE = [0.16, 1, 0.3, 1] as const

const FEATURES = [
  {
    id: 'crop',
    imgSrc: 'https://picsum.photos/seed/adframe-lifestyle/800/760',
    imgPos: 'center 20%',
    label: 'Smart Crop',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
    ),
    color: '#2563EB',
    badge: 'Smart · Crop automático',
    headline: 'Composição preservada em todo formato',
    description: 'O sistema identifica o ponto focal do criativo — rosto, produto, elemento principal — e calcula o crop ideal para cada placement sem cortar o que importa.',
  },
  {
    id: 'safezone',
    imgSrc: 'https://picsum.photos/seed/adframe-lifestyle/800/760',
    imgPos: 'center 20%',
    label: 'Safe Zones',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    color: '#0891B2',
    badge: 'Por plataforma · Atualizado',
    headline: 'Nunca perca conteúdo para a UI da plataforma',
    description: 'Cada plataforma tem áreas bloqueadas por perfil, CTA e ícones. O sistema mapeia pixel a pixel e alerta quando seu criativo viola essas zonas.',
  },
  {
    id: 'face',
    imgSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop',
    imgPos: 'center 20%',
    label: 'Face Detection',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
      </svg>
    ),
    color: '#16A34A',
    badge: 'Visão computacional',
    headline: 'Rostos nunca cortados, em nenhum formato',
    description: 'Modelo de visão computacional localiza o rosto principal e ancora o recorte automaticamente. Funciona com múltiplos rostos e posições variadas.',
  },
  {
    id: 'score',
    imgSrc: 'https://picsum.photos/seed/adframe-lifestyle/800/760',
    imgPos: 'center 20%',
    label: 'Quality Score',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
    color: '#D97706',
    badge: 'Análise em tempo real',
    headline: 'Problemas detectados antes da publicação',
    description: 'Cada criativo recebe uma nota A–D com análise de contraste, saturação, cobertura de texto, safe zones e conformidade técnica — antes do download.',
  },
] as const

function SmartCropOverlay() {
  return (
    <motion.div
      key="crop"
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        className="absolute border-2 rounded-lg"
        style={{ inset: '15% 22% 10% 22%', borderColor: '#2563EB' }}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: EASE }}
      >
        <div className="absolute inset-0 rounded-lg" style={{ boxShadow: '0 0 0 999px rgba(0,0,0,0.4)' }} />
        {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((cls, i) => (
          <div key={i} className={`absolute w-3 h-3 rounded-sm ${cls}`}
            style={{ margin: -2, backgroundColor: '#2563EB' }} />
        ))}
        <div className="absolute -top-7 left-0 rounded px-2 py-1 text-[10px] font-semibold text-white"
          style={{ background: '#2563EB' }}>
          Smart crop · 4:5
        </div>
        <div className="absolute inset-0 rounded-lg overflow-hidden opacity-25">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-blue-300" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-blue-300" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-blue-300" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-blue-300" />
        </div>
      </motion.div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
        {['1:1', '4:5', '9:16', '16:9'].map((ratio, i) => (
          <motion.div
            key={ratio}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: EASE }}
            className="rounded px-2 py-0.5 text-[9px] font-bold text-white"
            style={{ backgroundColor: i === 1 ? '#2563EB' : 'rgba(37,99,235,0.4)' }}
          >
            {ratio}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function SafeZoneOverlay() {
  return (
    <motion.div
      key="safezone"
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="absolute top-0 left-0 right-0 rounded-t-xl flex items-center justify-between px-3"
        style={{ height: '12%', background: 'rgba(220,38,38,0.3)', border: '1px solid rgba(220,38,38,0.5)' }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
      >
        <span className="text-[9px] font-semibold text-white">⚠ Zona de perfil</span>
        <span className="text-[8px] text-red-200">bloqueada</span>
      </motion.div>
      <motion.div
        className="absolute bottom-0 left-0 right-0 rounded-b-xl flex items-center justify-between px-3"
        style={{ height: '14%', background: 'rgba(220,38,38,0.3)', border: '1px solid rgba(220,38,38,0.5)' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: EASE }}
      >
        <span className="text-[9px] font-semibold text-white">⚠ Zona de CTA</span>
        <span className="text-[8px] text-red-200">bloqueada</span>
      </motion.div>
      <motion.div
        className="absolute left-4 right-4"
        style={{
          top: '14%', bottom: '16%',
          border: '1.5px dashed rgba(37,99,235,0.9)',
          borderRadius: 8,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <div className="absolute top-2 left-2 rounded px-1.5 py-0.5 text-[9px] font-semibold text-white"
          style={{ background: 'rgba(37,99,235,0.85)' }}>
          ✓ Área segura
        </div>
      </motion.div>
    </motion.div>
  )
}

function FaceDetectionOverlay() {
  const landmarks = [
    { label: 'Olho E', x: '38%', y: '35%' },
    { label: 'Olho D', x: '62%', y: '35%' },
    { label: 'Nariz',  x: '50%', y: '52%' },
    { label: 'Boca',   x: '50%', y: '65%' },
  ]

  return (
    <motion.div
      key="face"
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <motion.div
        className="absolute"
        style={{ top: '18%', left: '50%', marginLeft: -80, width: 160, height: 160 }}
        initial={{ scale: 1.35, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.55, ease: EASE }}
      >
        <motion.div
          className="absolute inset-0 rounded-full border border-green-400/40"
          animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
        <div className="absolute inset-0 rounded-full border-2 border-green-400" />
        {[
          { top: -2, left: -2,   borderTop: '2.5px solid #4ade80', borderLeft: '2.5px solid #4ade80' },
          { top: -2, right: -2,  borderTop: '2.5px solid #4ade80', borderRight: '2.5px solid #4ade80' },
          { bottom: -2, left: -2,  borderBottom: '2.5px solid #4ade80', borderLeft: '2.5px solid #4ade80' },
          { bottom: -2, right: -2, borderBottom: '2.5px solid #4ade80', borderRight: '2.5px solid #4ade80' },
        ].map((s, i) => (
          <div key={i} className="absolute w-5 h-5" style={s as React.CSSProperties} />
        ))}
        <motion.div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold text-white"
          style={{ background: 'rgba(22,163,74,0.9)' }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          ✓ Confiança 98.4%
        </motion.div>
      </motion.div>
      {landmarks.map(({ label, x, y }, i) => (
        <motion.div
          key={label}
          className="absolute"
          style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45 + i * 0.08, duration: 0.3, ease: EASE }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
          <div
            className="absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded px-1 py-px text-[7px] font-semibold"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#86efac' }}
          >
            {label}
          </div>
        </motion.div>
      ))}
      <motion.div
        className="absolute bottom-4 left-4 right-4 rounded-xl px-4"
        style={{ height: 38, background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.4)' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.4 }}
      >
        <div className="flex h-full items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-white">
            1 rosto detectado · Crop ancorado automaticamente
          </span>
          <div className="ml-auto rounded-full px-2 py-0.5 text-[8px] font-bold text-white" style={{ background: '#16A34A' }}>
            A
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function QualityScoreOverlay() {
  const scores = [
    { label: 'Contraste', value: 92, grade: 'A', color: '#16A34A' },
    { label: 'Safe zones', value: 78, grade: 'B', color: '#D97706' },
    { label: 'Saturação', value: 88, grade: 'A', color: '#16A34A' },
    { label: 'Texto', value: 95, grade: 'A', color: '#16A34A' },
  ]
  return (
    <motion.div
      key="score"
      className="absolute inset-0 flex items-center justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-3 w-44"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: EASE }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-semibold" style={{ color: '#64748B' }}>Quality Score</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: '#16A34A' }}>
            A
          </div>
        </div>
        {scores.map(({ label, value, grade, color }, i) => (
          <motion.div
            key={label}
            className="mb-2"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.07, duration: 0.35 }}
          >
            <div className="mb-0.5 flex items-center justify-between">
              <span className="text-[9px]" style={{ color: '#64748B' }}>{label}</span>
              <span className="text-[9px] font-bold" style={{ color }}>{grade}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ delay: 0.35 + i * 0.07, duration: 0.6, ease: EASE }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

export function SolutionSection() {
  const [active, setActive] = useState(0)

  const advance = useCallback(() => {
    setActive((prev) => (prev + 1) % FEATURES.length)
  }, [])

  useEffect(() => {
    const id = setInterval(advance, 3600)
    return () => clearInterval(id)
  }, [advance])

  const feature = FEATURES[active]

  return (
    <section
      id="produto"
      className="relative py-16 sm:py-24"
      style={{ backgroundColor: '#FFFFFF' }}
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
            style={{ borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#2563EB' }} />
            <span className="text-xs font-semibold" style={{ color: '#1D4ED8' }}>A solução</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
            className="font-display text-3xl font-bold sm:text-4xl"
            style={{ color: '#0F172A' }}
          >
            Upload uma vez.{' '}
            <span style={{ color: '#2563EB' }}>
              Publique em qualquer lugar.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="mt-4 text-base max-w-xl mx-auto"
            style={{ color: '#64748B' }}
          >
            A AdFrame adapta automaticamente imagens e vídeos para qualquer placement
            usando visão computacional e regras específicas por plataforma.
          </motion.p>
        </div>

        {/* Interactive canvas */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="mx-auto max-w-4xl"
        >
          {/* Feature tabs */}
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {FEATURES.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActive(i)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200"
                style={{
                  backgroundColor: active === i ? '#EFF6FF' : '#F8FAFC',
                  color: active === i ? f.color : '#64748B',
                  border: `1px solid ${active === i ? '#BFDBFE' : '#E2E8F0'}`,
                  boxShadow: active === i ? '0 1px 4px rgba(37,99,235,0.1)' : 'none',
                }}
              >
                <span style={{ color: active === i ? f.color : '#94A3B8' }}>{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>

          {/* Canvas + description row */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px]">
              {/* Canvas */}
              <div className="relative overflow-hidden" style={{ height: 380 }}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={feature.imgSrc}
                    // eslint-disable-next-line @next/next/no-img-element
                    src={feature.imgSrc}
                    alt="Creative demo"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: feature.imgPos }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {active === 0 && <SmartCropOverlay />}
                  {active === 1 && <SafeZoneOverlay />}
                  {active === 2 && <FaceDetectionOverlay />}
                  {active === 3 && <QualityScoreOverlay />}
                </AnimatePresence>

                {/* Feature badge */}
                <div className="absolute top-3 left-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: feature.color }}
                    >
                      {feature.badge}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Auto-progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#E2E8F0' }}>
                  <motion.div
                    key={active}
                    className="h-full"
                    style={{ backgroundColor: feature.color }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3.6, ease: 'linear' }}
                  />
                </div>
              </div>

              {/* Description panel */}
              <div
                className="flex flex-col justify-center p-8 border-t lg:border-t-0 lg:border-l"
                style={{ borderColor: '#E2E8F0' }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <div
                      className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: '#EFF6FF', color: feature.color, border: '1px solid #BFDBFE' }}
                    >
                      {feature.icon}
                    </div>

                    <h3 className="mb-3 text-lg font-semibold leading-snug" style={{ color: '#0F172A' }}>
                      {feature.headline}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                      {feature.description}
                    </p>

                    <div className="mt-8 flex gap-1.5">
                      {FEATURES.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActive(i)}
                          className="rounded-full transition-all duration-300"
                          style={{
                            width: active === i ? 20 : 6,
                            height: 6,
                            backgroundColor: active === i ? feature.color : '#E2E8F0',
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
