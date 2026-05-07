'use client'

import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const CYCLE_MS = 8500
const EASE = [0.16, 1, 0.3, 1] as const

const HERO_IMG = '/hero-creative.png'

const OUTPUTS = [
  {
    id: 'feed',
    label: 'Feed · 1:1',
    platform: 'Meta',
    color: '#1877f2',
    w: 90,
    h: 90,
    objPos: 'center 25%',
    score: 'A',
    scoreBg: '#16A34A',
    pos: { top: 18, left: 22 },
    delay: 0,
  },
  {
    id: 'story',
    label: 'Story · 9:16',
    platform: 'Meta',
    color: '#1877f2',
    w: 54,
    h: 96,
    objPos: 'center 15%',
    score: 'A',
    scoreBg: '#16A34A',
    pos: { top: 18, right: 22 },
    delay: 0.14,
  },
  {
    id: 'banner',
    label: 'Banner · 16:9',
    platform: 'Google',
    color: '#4285f4',
    w: 122,
    h: 69,
    objPos: 'center 8%',
    score: 'A',
    scoreBg: '#16A34A',
    pos: { bottom: 28, left: 14 },
    delay: 0.28,
  },
  {
    id: 'reel',
    label: 'Reel · 9:16',
    platform: 'TikTok',
    color: '#ff0050',
    w: 52,
    h: 92,
    objPos: 'center 10%',
    score: 'B',
    scoreBg: '#F59E0B',
    pos: { bottom: 28, right: 22 },
    delay: 0.42,
  },
] as const

function ScanLine({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, #2563EB, transparent)' }}
          initial={{ top: '0%', opacity: 0.7 }}
          animate={{ top: '100%', opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'linear' }}
        />
      )}
    </AnimatePresence>
  )
}

function OutputCard({
  output,
  visible,
  showScore,
}: {
  output: (typeof OUTPUTS)[number]
  visible: boolean
  showScore: boolean
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute flex flex-col items-center gap-1"
          style={output.pos as React.CSSProperties}
          initial={{ opacity: 0, scale: 0.6, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.6, filter: 'blur(8px)' }}
          transition={{ duration: 0.5, delay: output.delay, ease: EASE }}
        >
          <div
            className="relative overflow-hidden rounded-xl"
            style={{
              width: output.w,
              height: output.h,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMG}
              alt={output.label}
              width={output.w}
              height={output.h}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: output.objPos }}
            />

            {/* Safe zone dashed border */}
            <div
              className="absolute rounded-xl pointer-events-none"
              style={{
                inset: 4,
                border: '1px dashed rgba(37,99,235,0.45)',
              }}
            />

            {/* Platform badge */}
            <div
              className="absolute top-1.5 left-1.5 rounded-full px-1.5 py-px text-[7px] font-bold text-white"
              style={{ backgroundColor: output.color }}
            >
              {output.platform}
            </div>

            {/* Quality score */}
            <AnimatePresence>
              {showScore && (
                <motion.div
                  className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow"
                  style={{ backgroundColor: output.scoreBg }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                >
                  {output.score}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="text-[9px] font-medium whitespace-nowrap" style={{ color: '#64748B' }}>
            {output.label}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const LINES = [
  { x2: '18%', y2: '22%' },
  { x2: '82%', y2: '22%' },
  { x2: '18%', y2: '80%' },
  { x2: '82%', y2: '80%' },
]

function ConnectionLines({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 4 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <defs>
            <linearGradient id="lg-light" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {LINES.map((l, i) => (
            <motion.line
              key={i}
              x1="50%"
              y1="50%"
              x2={l.x2}
              y2={l.y2}
              stroke="url(#lg-light)"
              strokeWidth="1"
              strokeDasharray="3 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            />
          ))}
        </motion.svg>
      )}
    </AnimatePresence>
  )
}

function StatusIndicator({ phase }: { phase: number }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1 justify-center">
        {[1, 2, 3, 4, 5].map((p) => (
          <motion.div
            key={p}
            className="rounded-full"
            animate={{
              width: phase >= p ? 14 : 5,
              backgroundColor: phase >= p ? '#2563EB' : '#E2E8F0',
            }}
            style={{ height: 5 }}
            transition={{ duration: 0.35 }}
          />
        ))}
      </div>
      <p className="text-[10px] text-center font-medium" style={{ color: '#64748B' }}>
        {phase === 0 && 'Analisando criativo…'}
        {phase === 1 && 'Mapeando safe zones…'}
        {phase === 2 && 'Detectando elementos…'}
        {phase === 3 && 'Calculando crop inteligente…'}
        {phase === 4 && 'Gerando formatos…'}
        {phase === 5 && '✓ 4 formatos prontos para exportar'}
      </p>
    </div>
  )
}

function CentralCard({
  cropControls,
  scanActive,
  phase,
  width,
  height,
}: {
  cropControls: ReturnType<typeof useAnimation>
  scanActive: boolean
  phase: number
  width: number
  height: number
}) {
  const marginTop = -Math.round(height / 2)
  const marginLeft = -Math.round(width / 2)
  return (
    <motion.div
      className="overflow-hidden rounded-2xl animate-float-slow"
      style={{
        width,
        height,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
      }}
      animate={cropControls}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_IMG}
        alt="Creative original"
        width={width}
        height={height}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: 'center 15%' }}
      />

      {/* Ad overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
        <div className="h-2 rounded-sm bg-white/90 w-4/5" />
        <div className="h-1.5 rounded-sm bg-white/60 w-3/5" />
        <div className="mt-2 h-5 w-16 rounded-md flex items-center justify-center"
          style={{ background: '#2563EB' }}>
          <div className="h-1.5 w-9 rounded bg-white/90" />
        </div>
      </div>

      <ScanLine visible={scanActive} />

      {/* Phase 1 — Safe zones */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div
              className="absolute rounded-xl"
              style={{ inset: 10, border: '1.5px dashed rgba(37,99,235,0.6)' }}
            />
            {([
              { top: 8, left: 8 },
              { top: 8, right: 8 },
              { bottom: 8, left: 8 },
              { bottom: 8, right: 8 },
            ] as const).map((corner, i) => (
              <div
                key={i}
                className="absolute w-3 h-3"
                style={{
                  ...corner,
                  borderTop: i < 2 ? '2px solid #2563EB' : undefined,
                  borderBottom: i >= 2 ? '2px solid #2563EB' : undefined,
                  borderLeft: i % 2 === 0 ? '2px solid #2563EB' : undefined,
                  borderRight: i % 2 === 1 ? '2px solid #2563EB' : undefined,
                }}
              />
            ))}
            <div
              className="absolute top-2 left-2 rounded px-1.5 py-0.5 text-[8px] font-semibold text-white"
              style={{ background: 'rgba(37,99,235,0.8)' }}
            >
              Safe zone
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 2 — Face detection */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            className="absolute"
            style={{ top: '14%', left: '50%', marginLeft: -22, width: 44, height: 44 }}
            initial={{ opacity: 0, scale: 1.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-green-400" />
            <motion.div
              className="absolute inset-0 rounded-full border border-green-400/60"
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-green-400" />
            </div>
            <div
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1 py-px text-[7px] font-semibold text-white"
              style={{ background: 'rgba(22,163,74,0.85)' }}
            >
              Face detected
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3 — Smart crop frame */}
      <AnimatePresence>
        {phase >= 3 && (
          <motion.div
            className="absolute"
            style={{ inset: 6 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{ border: '1.5px solid rgba(37,99,235,0.8)' }}
            />
            <div
              className="absolute top-1.5 right-2 rounded px-1 py-0.5 text-[7px] font-semibold text-white"
              style={{ background: 'rgba(37,99,235,0.85)' }}
            >
              Smart crop ✓
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function TransformationEngine() {
  const [phase, setPhase] = useState(0)
  const [scanActive, setScanActive] = useState(false)
  const cropControls = useAnimation()

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    function t(fn: () => void, ms: number) {
      timers.push(setTimeout(fn, ms))
    }

    async function cycle() {
      setPhase(0)
      setScanActive(false)
      cropControls.set({ x: 0, y: 0 })

      t(() => setPhase(1), 500)
      t(() => { setPhase(2); setScanActive(true) }, 1300)
      t(() => setScanActive(false), 2600)
      t(async () => {
        setPhase(3)
        await cropControls.start({
          x: 6,
          y: -8,
          transition: { duration: 0.9, ease: EASE },
        })
      }, 2800)
      t(() => setPhase(4), 3800)
      t(() => setPhase(5), 5400)
      t(() => cycle(), CYCLE_MS)
    }

    cycle()
    return () => timers.forEach(clearTimeout)
  }, [cropControls])

  return (
    <>
      {/* ── Desktop: full animated engine (480×460) ── */}
      <div
        className="hidden sm:block relative flex-shrink-0"
        style={{ width: 480, height: 460 }}
      >
        {/* Output cards */}
        {OUTPUTS.map((o) => (
          <OutputCard key={o.id} output={o} visible={phase >= 4} showScore={phase >= 5} />
        ))}

        {/* Connection lines */}
        <ConnectionLines visible={phase >= 4} />

        {/* Central creative */}
        <div className="absolute" style={{ top: '50%', left: '50%', marginTop: -117, marginLeft: -84, zIndex: 10 }}>
          <CentralCard cropControls={cropControls} scanActive={scanActive} phase={phase} width={168} height={234} />
        </div>

        {/* Status label */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: 0, zIndex: 20 }}>
          <StatusIndicator phase={phase} />
        </div>
      </div>

      {/* ── Mobile: stacked simplified layout ── */}
      <div className="sm:hidden w-full flex flex-col items-center gap-4">
        {/* Central card */}
        <div className="relative" style={{ width: 140, height: 196 }}>
          <CentralCard cropControls={cropControls} scanActive={scanActive} phase={phase} width={140} height={196} />
        </div>

        {/* Output grid — appears at phase 4 */}
        <AnimatePresence>
          {phase >= 4 && (
            <motion.div
              className="grid grid-cols-4 gap-2 w-full px-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {OUTPUTS.map((o, i) => (
                <motion.div
                  key={o.id}
                  className="flex flex-col items-center gap-1"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: o.delay, duration: 0.4, ease: EASE }}
                >
                  <div
                    className="relative overflow-hidden rounded-lg mx-auto"
                    style={{
                      width: Math.round(o.w * 0.75),
                      height: Math.round(o.h * 0.75),
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={HERO_IMG}
                      alt={o.label}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ objectPosition: o.objPos }}
                    />
                    <div
                      className="absolute top-0.5 left-0.5 rounded-full px-1 text-[6px] font-bold text-white"
                      style={{ backgroundColor: o.color }}
                    >
                      {o.platform}
                    </div>
                    {phase >= 5 && (
                      <div
                        className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ backgroundColor: o.scoreBg }}
                      >
                        {o.score}
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] font-medium text-center leading-tight" style={{ color: '#64748B' }}>
                    {o.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <StatusIndicator phase={phase} />
      </div>
    </>
  )
}
