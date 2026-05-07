'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

const EASE = [0.16, 1, 0.3, 1] as const
const IMG = (w: number, h: number, seed = 'adframe-lifestyle') =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`

function SmartCropVisual({ active }: { active: boolean }) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-t-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={IMG(400, 240)} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center 20%' }} />
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} />
      {active && (
        <motion.div
          className="absolute rounded-lg"
          style={{ inset: '10% 15% 8% 15%', border: '2px solid #2563EB' }}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="absolute -top-5 left-0 rounded px-1.5 py-0.5 text-[8px] font-bold text-white"
            style={{ background: '#2563EB' }}>
            4:5 · Smart crop
          </div>
          {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((cls, i) => (
            <div key={i} className={`absolute w-2 h-2 rounded-sm ${cls}`}
              style={{ margin: -2, backgroundColor: '#2563EB' }} />
          ))}
        </motion.div>
      )}
    </div>
  )
}

function GenerativeVisual({ active }: { active: boolean }) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-t-xl flex items-center justify-center"
      style={{ background: '#F1F5F9' }}>
      <div className="relative" style={{ width: 120, height: 120 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG(120, 120, 'adframe-gen')} alt="" className="absolute inset-0 w-full h-full object-cover rounded" />
        {active && (
          <>
            <motion.div
              className="absolute top-0 bottom-0 rounded-r"
              style={{ width: 40, left: '100%', background: 'linear-gradient(90deg, rgba(37,99,235,0.5), rgba(37,99,235,0.15))', borderRadius: '0 4px 4px 0' }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="absolute text-[7px] font-bold rotate-90 whitespace-nowrap" style={{ color: '#2563EB' }}>Auto fill</div>
              </motion.div>
            </motion.div>
            <motion.div
              className="absolute top-0 bottom-0 left-0 rounded-l"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
              style={{ width: 40, right: '100%', background: 'linear-gradient(270deg, rgba(37,99,235,0.5), rgba(37,99,235,0.15))', borderRadius: '4px 0 0 4px' }}
            />
          </>
        )}
        {active && (
          <motion.div
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[8px] font-semibold"
            style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            16:9 expandido
          </motion.div>
        )}
      </div>
    </div>
  )
}

function VideoVisual({ active }: { active: boolean }) {
  const formats = [
    { label: '9:16', w: 36, h: 64, seed: 'adframe-v1' },
    { label: '1:1', w: 52, h: 52, seed: 'adframe-v2' },
    { label: '16:9', w: 72, h: 40, seed: 'adframe-v3' },
  ]
  return (
    <div className="relative w-full h-full overflow-hidden rounded-t-xl flex items-center justify-center gap-3"
      style={{ background: '#F1F5F9' }}>
      {formats.map((f, i) => (
        <motion.div
          key={f.label}
          className="relative overflow-hidden rounded-lg"
          style={{ width: f.w, height: f.h, border: '1px solid #E2E8F0' }}
          initial={{ opacity: 0, y: 10 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0.4, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4, ease: EASE }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMG(f.w * 2, f.h * 2, f.seed)} alt={f.label} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.2)' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.85)' }}>
              <div className="w-0 h-0 ml-0.5" style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid #2563EB' }} />
            </div>
          </div>
          <div className="absolute bottom-1 left-0 right-0 text-center text-[7px] font-bold text-white/80">{f.label}</div>
        </motion.div>
      ))}
    </div>
  )
}

function ScoreVisual({ active }: { active: boolean }) {
  return (
    <div className="relative w-full h-full rounded-t-xl overflow-hidden flex items-center justify-center"
      style={{ background: '#F8FAFC' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={IMG(400, 240, 'adframe-score')} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <motion.div
        className="relative rounded-xl p-4 w-44"
        style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={active ? { opacity: 1, scale: 1 } : { opacity: 0.5, scale: 0.9 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold" style={{ color: '#64748B' }}>Quality Score</span>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: '#16A34A' }}>A</div>
        </div>
        {[
          { label: 'Contraste', v: 92, c: '#16A34A' },
          { label: 'Safe zones', v: 71, c: '#D97706' },
          { label: 'Saturação', v: 88, c: '#16A34A' },
        ].map(({ label, v, c }) => (
          <div key={label} className="mb-1.5">
            <div className="flex justify-between mb-0.5">
              <span className="text-[8px]" style={{ color: '#64748B' }}>{label}</span>
              <span className="text-[8px] font-bold" style={{ color: c }}>{v}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: c }}
                initial={{ width: 0 }}
                animate={active ? { width: `${v}%` } : { width: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
              />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function BatchVisual({ active }: { active: boolean }) {
  const seeds = ['adframe-b1', 'adframe-b2', 'adframe-b3', 'adframe-b4', 'adframe-b5', 'adframe-b6']
  return (
    <div className="relative w-full h-full rounded-t-xl overflow-hidden p-3" style={{ background: '#F8FAFC' }}>
      <div className="grid grid-cols-3 gap-1.5 h-full">
        {seeds.map((seed, i) => (
          <motion.div
            key={seed}
            className="relative overflow-hidden rounded-md"
            style={{ border: '1px solid #E2E8F0' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={active ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.8 }}
            transition={{ delay: i * 0.06, duration: 0.35, ease: EASE }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG(80, 60, seed)} alt="" className="w-full h-full object-cover" />
            {active && i < 4 && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.15)' }}>
                <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3" stroke="#16A34A" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                </svg>
              </div>
            )}
            {active && i === 4 && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.6)' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="h-2 w-2 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      {active && (
        <motion.div
          className="absolute bottom-2 left-2 right-2 rounded-lg px-2 py-1 text-[9px] font-semibold"
          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          5 de 6 assets processados · 2s restantes
        </motion.div>
      )}
    </div>
  )
}

function PerformancePredictionVisual({ active }: { active: boolean }) {
  const bars = [
    { label: 'Feed 1:1', ctr: 4.2, color: '#16A34A' },
    { label: 'Story',    ctr: 3.1, color: '#D97706' },
    { label: 'Banner',   ctr: 2.4, color: '#DC2626' },
    { label: 'Reel',     ctr: 5.8, color: '#16A34A' },
    { label: 'Carrossel',ctr: 3.7, color: '#D97706' },
  ]
  const max = 6
  return (
    <div className="relative w-full h-full rounded-t-xl overflow-hidden flex flex-col justify-end gap-0 px-4 pb-5 pt-3"
      style={{ background: '#F8FAFC' }}>
      <div className="flex items-end gap-1.5 h-full">
        {bars.map(({ label, ctr, color }, i) => (
          <div key={label} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[7px] font-bold" style={{ color }}>{ctr}%</span>
            <motion.div
              className="w-full rounded-t-sm"
              style={{ backgroundColor: `${color}22`, border: `1px solid ${color}55` }}
              initial={{ height: 0 }}
              animate={active ? { height: `${(ctr / max) * 80}px` } : { height: 8 }}
              transition={{ duration: 0.55, delay: i * 0.07, ease: EASE }}
            />
          </div>
        ))}
      </div>
      <div className="absolute bottom-1.5 left-4 right-4 flex justify-between">
        {bars.map(({ label }) => (
          <span key={label} className="text-[6px] text-center flex-1 truncate" style={{ color: '#94A3B8' }}>{label}</span>
        ))}
      </div>
      {active && (
        <motion.div
          className="absolute top-2.5 right-3 rounded-lg px-2 py-1 text-[8px] font-semibold"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A' }}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          CTR estimado por formato
        </motion.div>
      )}
    </div>
  )
}

function CreativeIntelligenceVisual({ active }: { active: boolean }) {
  const platforms = [
    { name: 'Meta',    score: 87, color: '#1877f2' },
    { name: 'TikTok',  score: 73, color: '#ff0050' },
    { name: 'Google',  score: 91, color: '#4285f4' },
    { name: 'LinkedIn',score: 64, color: '#0a66c2' },
  ]
  return (
    <div className="relative w-full h-full rounded-t-xl overflow-hidden flex items-center justify-center"
      style={{ background: '#F8FAFC' }}>
      <motion.div
        className="w-44 rounded-xl p-3"
        style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        initial={{ opacity: 0, y: 8 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0.5, y: 8 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <div className="text-[9px] font-semibold mb-2.5" style={{ color: '#0F172A' }}>Performance por canal</div>
        {platforms.map(({ name, score, color }, i) => (
          <div key={name} className="mb-1.5">
            <div className="flex justify-between mb-0.5">
              <span className="text-[8px]" style={{ color: '#64748B' }}>{name}</span>
              <span className="text-[8px] font-bold" style={{ color }}>{score}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={active ? { width: `${score}%` } : { width: 0 }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
              />
            </div>
          </div>
        ))}
        <motion.div
          className="mt-2 rounded px-1.5 py-1 text-[7px]"
          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB' }}
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.5 }}
        >
          ✦ Google tem melhor CPM para este formato
        </motion.div>
      </motion.div>
    </div>
  )
}

function SafeZoneMiniVisual({ active }: { active: boolean }) {
  return (
    <div className="relative w-full h-full rounded-t-xl overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={IMG(400, 240, 'adframe-sz')} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center 30%' }} />
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.2)' }} />
      {active && (
        <>
          <motion.div
            className="absolute top-0 left-0 right-0"
            style={{ height: '18%', background: 'rgba(220,38,38,0.3)', borderBottom: '1px solid rgba(220,38,38,0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex h-full items-center px-3">
              <span className="text-[8px] font-bold text-red-200">⚠ Zona bloqueada</span>
            </div>
          </motion.div>
          <motion.div
            className="absolute bottom-0 left-0 right-0"
            style={{ height: '18%', background: 'rgba(220,38,38,0.3)', borderTop: '1px solid rgba(220,38,38,0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex h-full items-center px-3">
              <span className="text-[8px] font-bold text-red-200">⚠ Zona de CTA</span>
            </div>
          </motion.div>
          <motion.div
            className="absolute left-3 right-3 rounded"
            style={{
              top: '20%', bottom: '20%',
              border: '1.5px dashed rgba(37,99,235,0.8)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="absolute top-1.5 left-2 rounded px-1 py-0.5 text-[7px] font-bold text-white"
              style={{ background: 'rgba(37,99,235,0.85)' }}>
              ✓ Safe area
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}

const FEATURES = [
  {
    id: 'smart-crop',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
    ),
    color: '#2563EB',
    iconBg: '#EFF6FF',
    title: 'Smart Crop',
    description: 'Mantém rostos, produtos e composição importantes em qualquer proporção.',
    Visual: SmartCropVisual,
  },
  {
    id: 'generative',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
    color: '#7C3AED',
    iconBg: '#F5F3FF',
    title: 'Generative Expansion',
    description: 'Expanda criativos para novos formatos com preenchimento automático.',
    Visual: GenerativeVisual,
  },
  {
    id: 'video',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    color: '#DB2777',
    iconBg: '#FDF2F8',
    title: 'Video Adaptation',
    description: 'Converta vídeos automaticamente para Stories, Reels, Shorts e TikTok.',
    Visual: VideoVisual,
  },
  {
    id: 'score',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
    color: '#D97706',
    iconBg: '#FFFBEB',
    title: 'Quality Score',
    description: 'Detecte problemas de contraste, saturação e safe zones antes de publicar.',
    Visual: ScoreVisual,
  },
  {
    id: 'batch',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
    color: '#0891B2',
    iconBg: '#ECFEFF',
    title: 'Batch Processing',
    description: 'Adapte centenas de assets em minutos com processamento em lote paralelo.',
    Visual: BatchVisual,
  },
  {
    id: 'safezones',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    color: '#16A34A',
    iconBg: '#F0FDF4',
    title: 'Safe Zones',
    description: 'Evite perdas críticas mapeando as áreas bloqueadas por cada plataforma.',
    Visual: SafeZoneMiniVisual,
  },
  {
    id: 'performance-prediction',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
    color: '#0891B2',
    iconBg: '#ECFEFF',
    title: 'Performance Prediction',
    description: 'Estime CTR e CPM por formato antes de publicar, com base em benchmarks históricos por plataforma.',
    Visual: PerformancePredictionVisual,
  },
  {
    id: 'creative-intelligence',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
    color: '#7C3AED',
    iconBg: '#F5F3FF',
    title: 'Creative Intelligence',
    description: 'Veja quais elementos visuais performam melhor por canal, formato e audiência — com recomendações acionáveis.',
    Visual: CreativeIntelligenceVisual,
  },
] as const

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number]
  index: number
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: EASE }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: '#FFFFFF',
        border: `1px solid ${hovered ? '#BFDBFE' : '#E2E8F0'}`,
        boxShadow: hovered
          ? '0 8px 32px rgba(37,99,235,0.08), 0 2px 8px rgba(0,0,0,0.04)'
          : '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* Card body — icon + title + description */}
      <div className="p-5 pb-3">
        <div
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            backgroundColor: hovered ? feature.iconBg : '#F8FAFC',
            color: feature.color,
            border: `1px solid ${hovered ? feature.iconBg : '#E2E8F0'}`,
            transition: 'background-color 0.2s, border-color 0.2s',
          }}
        >
          {feature.icon}
        </div>
        <h3 className="mb-2 text-base font-semibold" style={{ color: '#0F172A' }}>{feature.title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{feature.description}</p>
      </div>

      {/* Visual — inset box at the bottom */}
      <div
        className="mx-4 mb-4 flex-1 rounded-xl overflow-hidden"
        style={{ minHeight: 120, background: '#F8FAFC', border: '1px solid #E2E8F0' }}
      >
        <feature.Visual active={hovered} />
      </div>
    </motion.div>
  )
}

export function FeaturesGrid() {
  return (
    <section
      id="recursos"
      className="relative py-16 sm:py-24"
      style={{ backgroundColor: '#F8FAFC' }}
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
            <span className="text-xs font-semibold" style={{ color: '#1D4ED8' }}>Capacidades</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
            className="font-display text-3xl font-bold sm:text-4xl"
            style={{ color: '#0F172A' }}
          >
            Infraestrutura criativa para{' '}
            <span style={{ color: '#2563EB' }}>
              performance marketing
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="mt-4 text-base max-w-lg mx-auto"
            style={{ color: '#64748B' }}
          >
            Cada funcionalidade foi construída para resolver um problema real de quem opera mídia em escala.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
