'use client'

import { useMemo, useState } from 'react'
import type { ImageAnalysis } from '@/lib/image-analyser'
import { computeCreativeIntelligence } from '@/lib/creative-intelligence'
import type { ChannelScore } from '@/lib/creative-intelligence'

type Props = {
  imageAnalysis: ImageAnalysis | null
  textCoveragePercent?: number
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold w-6 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  )
}

function GradeBadge({ grade }: { grade: ChannelScore['grade'] }) {
  const meta: Record<string, { bg: string; text: string }> = {
    A: { bg: '#F0FDF4', text: '#16A34A' },
    B: { bg: '#F7FEE7', text: '#65A30D' },
    C: { bg: '#FFFBEB', text: '#D97706' },
    D: { bg: '#FEF2F2', text: '#DC2626' },
  }
  const m = meta[grade]!
  return (
    <span
      className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: m.bg, color: m.text }}
    >
      {grade}
    </span>
  )
}

export function CreativeIntelligencePanel({ imageAnalysis, textCoveragePercent }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const scores = useMemo(
    () => computeCreativeIntelligence(imageAnalysis, textCoveragePercent),
    [imageAnalysis, textCoveragePercent],
  )

  if (!imageAnalysis || scores.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
        <p className="text-xs text-slate-400">Carregue uma imagem para ver a análise por canal</p>
      </div>
    )
  }

  const overallAvg = Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length)
  const bestChannel = scores.reduce((a, b) => (a.score > b.score ? a : b))
  const worstChannel = scores.reduce((a, b) => (a.score < b.score ? a : b))

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: '#F5F3FF' }}>
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" style={{ color: '#7C3AED' }}>
              <path d="M8 1l1.5 4.5H14l-3.5 2.5 1.5 4.5L8 10l-4 2.5 1.5-4.5L2 5.5h4.5L8 1z"
                fill="currentColor" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-slate-700">Creative Intelligence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">Score médio</span>
          <span className="text-sm font-bold" style={{ color: '#7C3AED' }}>{overallAvg}</span>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 px-4 py-2 border-b border-slate-50">
        <div className="flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5"
          style={{ background: '#F0FDF4', color: '#16A34A' }}>
          ↑ {bestChannel.channel} <span className="font-bold">{bestChannel.score}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5"
          style={{ background: '#FEF2F2', color: '#DC2626' }}>
          ↓ {worstChannel.channel} <span className="font-bold">{worstChannel.score}</span>
        </div>
      </div>

      {/* Channel rows */}
      <div className="divide-y divide-slate-50">
        {scores.map((cs) => (
          <div key={cs.channel}>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
              onClick={() => setExpanded(expanded === cs.channel ? null : cs.channel)}
            >
              <span className="text-xs font-medium text-slate-600 w-16 flex-shrink-0">{cs.channel}</span>
              <ScoreBar score={cs.score} color={cs.color} />
              <GradeBadge grade={cs.grade} />
              <svg
                viewBox="0 0 16 16" fill="none" className="w-3 h-3 flex-shrink-0 transition-transform"
                style={{ color: '#CBD5E1', transform: expanded === cs.channel ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  stroke="currentColor" d="M4 6l4 4 4-4" />
              </svg>
            </button>

            {expanded === cs.channel && cs.recommendations.length > 0 && (
              <div className="px-4 pb-3 space-y-1.5">
                {cs.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
                    <span className="mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ backgroundColor: cs.color }}>
                      !
                    </span>
                    {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-50">
        <p className="text-[9px] text-slate-300">
          Score baseado em contraste, saturação, brilho e cobertura de texto · clique em cada canal para ver recomendações
        </p>
      </div>
    </div>
  )
}
