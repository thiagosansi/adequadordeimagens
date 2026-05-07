'use client'

import type { Requirement, MetaFormat } from '@/shared/types/image'
import type { ImageAnalysis } from '@/lib/image-analyser'
import { calculateQualityScore, GRADE_META } from '@/lib/quality-score'
import { getFormatBenchmark, CPC_TENDENCY_META } from '@/lib/format-benchmarks'
import { cn } from '@/lib/utils'
import { TrendingDown, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'

// ── Score card ────────────────────────────────────────────────────────────────

type ScoreProps = {
  requirements: Requirement[]
  textCoveragePercent?: number
  imageAnalysis?: ImageAnalysis | null
}

export function QualityScoreCard({ requirements, textCoveragePercent, imageAnalysis }: ScoreProps) {
  if (requirements.length === 0) return null

  const { score, grade, deductions, bonuses } = calculateQualityScore(
    requirements,
    textCoveragePercent,
    imageAnalysis,
  )
  const gradeMeta = GRADE_META[grade]

  return (
    <div className={cn('rounded-xl border p-4', gradeMeta.bg, gradeMeta.border)}>
      <div className="flex items-center gap-4">
        {/* Grade circle */}
        <div className={cn(
          'flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2',
          gradeMeta.border, gradeMeta.bg,
        )}>
          <span className={cn('text-2xl font-bold leading-none', gradeMeta.color)}>{grade}</span>
          <span className={cn('text-[10px] font-medium', gradeMeta.color)}>{score}/100</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-semibold', gradeMeta.color)}>
            Boas práticas para anúncios — {gradeMeta.label}
          </p>

          {deductions.length === 0 && bonuses.length === 0 ? (
            <p className="mt-0.5 text-xs text-gray-500">
              Todos os critérios aprovados. Criativo pronto para publicação.
            </p>
          ) : (
            <ul className="mt-1 space-y-0.5">
              {deductions.map((d) => (
                <li key={d.reason} className="flex items-start gap-1.5 text-xs text-gray-600">
                  <TrendingDown className={cn('mt-0.5 h-3 w-3 shrink-0', gradeMeta.color)} />
                  <span><span className={cn('font-semibold', gradeMeta.color)}>−{d.points}pts</span> {d.reason}</span>
                </li>
              ))}
              {bonuses.map((b) => (
                <li key={b.reason} className="flex items-start gap-1.5 text-xs text-gray-600">
                  <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-green-600" />
                  <span><span className="font-semibold text-green-600">+{b.points}pts</span> {b.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/60">
        <div
          className={cn('h-full rounded-full transition-all', {
            'bg-green-500': grade === 'A',
            'bg-lime-500':  grade === 'B',
            'bg-amber-500': grade === 'C',
            'bg-red-500':   grade === 'D',
          })}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

// ── Benchmark card ────────────────────────────────────────────────────────────

type BenchmarkProps = {
  format?: MetaFormat | null
}

export function FormatBenchmarkCard({ format }: BenchmarkProps) {
  const benchmark = format ? getFormatBenchmark(format.id) : null
  const cpcMeta = benchmark ? CPC_TENDENCY_META[benchmark.cpcTendency] : null

  if (!benchmark || !cpcMeta) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Benchmark do formato
        </p>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', cpcMeta.bg, cpcMeta.color)}>
          {cpcMeta.label} · {benchmark.avgCpm}
        </span>
      </div>

      {/* Per-placement cost breakdown */}
      {benchmark.costBreakdown && (
        <div className="rounded-lg border border-gray-100 bg-gray-50 divide-y divide-gray-100">
          {benchmark.costBreakdown.map(({ label, cpm }) => (
            <div key={label} className="flex items-center justify-between px-3 py-1.5">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-xs font-semibold text-gray-700">{cpm} <span className="font-normal text-gray-400">CPM est.</span></span>
            </div>
          ))}
        </div>
      )}

      {/* Strengths */}
      <div>
        <p className="mb-1 text-xs font-medium text-gray-500">Pontos fortes</p>
        <ul className="space-y-0.5">
          {benchmark.strengths.map((s) => (
            <li key={s} className="flex items-start gap-1.5 text-xs text-gray-600">
              <span className="mt-0.5 text-green-500">✓</span>
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Watchouts */}
      {benchmark.watchouts.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Atenção</p>
          <ul className="space-y-0.5">
            {benchmark.watchouts.map((w) => (
              <li key={w} className="flex items-start gap-1.5 text-xs text-gray-600">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main tip */}
      <div className="flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
        <p className="text-xs text-blue-700">{benchmark.tip}</p>
      </div>
    </div>
  )
}

// ── Combined (kept for convenience) ──────────────────────────────────────────

type Props = {
  requirements: Requirement[]
  format?: MetaFormat | null
  textCoveragePercent?: number
  imageAnalysis?: ImageAnalysis | null
}

export function QualityScoreBadge({ requirements, format, textCoveragePercent, imageAnalysis }: Props) {
  if (requirements.length === 0) return null
  return (
    <div className="space-y-3">
      <QualityScoreCard requirements={requirements} textCoveragePercent={textCoveragePercent} imageAnalysis={imageAnalysis} />
      <FormatBenchmarkCard format={format} />
    </div>
  )
}
