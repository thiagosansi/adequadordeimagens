import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertTriangle, Clock, Check, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { BillingActions } from '@/components/billing-actions'
import type { ActiveSubscription } from '@/lib/stripe/types'

function currentPeriod() {
  return new Date().toISOString().slice(0, 7)
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = limit === -1
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const isAmber = pct >= 80 && pct < 100
  const isFull = pct >= 100

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`font-semibold ${isFull ? 'text-red-600' : isAmber ? 'text-amber-600' : 'text-gray-600'}`}>
          {unlimited ? `${used} / ilimitado` : `${used} / ${limit}`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        {!unlimited && (
          <div
            className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : isAmber ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        )}
        {unlimited && <div className="h-full w-full rounded-full bg-blue-200" />}
      </div>
      {!unlimited && (
        <p className="mt-1 text-xs text-gray-400">{limit - used} restantes este mês</p>
      )}
    </div>
  )
}

const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuito', pro: 'Pro', team: 'Team', enterprise: 'Enterprise',
}

const STATUS_CONFIG = {
  active:    { label: 'Ativo',              icon: CheckCircle2,   color: 'text-green-600 bg-green-50'  },
  trialing:  { label: 'Período de teste',   icon: Clock,          color: 'text-blue-600 bg-blue-50'   },
  past_due:  { label: 'Pagamento pendente', icon: AlertTriangle,  color: 'text-amber-600 bg-amber-50'  },
  canceled:  { label: 'Cancelado',          icon: AlertTriangle,  color: 'text-gray-500 bg-gray-50'   },
  incomplete:{ label: 'Incompleto',         icon: AlertTriangle,  color: 'text-gray-500 bg-gray-50'   },
} as const

// Comparison table rows: [label, free, pro, team]
type CellValue = string | boolean
const COMPARISON_ROWS: { label: string; free: CellValue; pro: CellValue; team: CellValue }[] = [
  { label: 'Exportações/mês',       free: '15',               pro: '100',             team: '400/assento'    },
  { label: 'Solicitações de IA/mês',free: '3',                pro: '30',              team: '80/assento'     },
  { label: 'Modo Imagem única',     free: true,               pro: true,              team: true             },
  { label: 'Modo Lote',             free: false,              pro: true,              team: true             },
  { label: 'Modo Vídeo',           free: false,              pro: true,              team: true             },
  { label: 'Modo Carrossel',        free: false,              pro: true,              team: true             },
  { label: 'Brand Kit da empresa',  free: false,              pro: false,             team: true             },
  { label: 'Gestão de equipe',      free: false,              pro: false,             team: true             },
  { label: 'Suporte',               free: 'Comunidade',       pro: 'Email',           team: 'Prioritário'    },
]

function Cell({ value }: { value: CellValue }) {
  if (typeof value === 'boolean') {
    return value
      ? <Check className="mx-auto h-4 w-4 text-green-500" />
      : <Minus className="mx-auto h-4 w-4 text-gray-300" />
  }
  return <span className="text-xs text-gray-700">{value}</span>
}

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const period = currentPeriod()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('entity_type', 'user')
    .eq('entity_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  const subscription = sub as ActiveSubscription | null
  const plan = subscription?.plan
  const planId = plan?.id ?? 'free'
  const isPaid = planId !== 'free'

  const db = createServiceClient()
  const { data: usageRows } = await db
    .from('usage_counters')
    .select('action, count')
    .eq('entity_type', 'user')
    .eq('entity_id', user.id)
    .eq('user_id', user.id)
    .eq('period', period)

  const usageMap = Object.fromEntries((usageRows ?? []).map((r) => [r.action, r.count as number]))
  const exportsUsed = usageMap['export'] ?? 0
  const aiUsed = usageMap['ai_request'] ?? 0
  const exportsLimit = (plan?.features?.exports_monthly ?? 15) as number
  const aiLimit = (plan?.features?.ai_requests_monthly ?? 3) as number

  const trialDays = daysUntil(subscription?.trial_ends_at ?? null)
  const statusKey = (subscription?.status ?? 'active') as keyof typeof STATUS_CONFIG
  const status = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.active
  const StatusIcon = status.icon

  const { data: orgMembership } = await db
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .maybeSingle()

  const upgradeOrgId = orgMembership?.organization_id ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link href="/app" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao editor
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cobrança e uso</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie seu plano e acompanhe o uso mensal.</p>
        </div>

        {/* Plan card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Plano atual</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{PLAN_LABEL[planId]}</p>
              {!!plan?.price_cents && (
                <p className="mt-0.5 text-sm text-gray-500">
                  R${(plan.price_cents / 100).toFixed(2).replace('.', ',')}/mês
                </p>
              )}
            </div>
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>
          </div>

          {subscription?.status === 'trialing' && trialDays !== null && (
            <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <span className="font-semibold">{trialDays} dias</span> restantes no período de teste.
              Você será cobrado ao final do trial.
            </div>
          )}
          {subscription?.status === 'past_due' && (
            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Pagamento pendente. Atualize seu método de pagamento para manter o acesso.
            </div>
          )}
          {subscription?.current_period_start && subscription.current_period_end && (
            <p className="mt-4 text-xs text-gray-400">
              Período de cobrança:{' '}
              {new Date(subscription.current_period_start).toLocaleDateString('pt-BR')} –{' '}
              {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        {/* Usage meters */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Uso em {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="space-y-5">
            <UsageMeter label="Exportações" used={exportsUsed} limit={exportsLimit} />
            <UsageMeter label="Solicitações de IA" used={aiUsed} limit={aiLimit} />
          </div>
        </div>

        {/* Plan comparison table */}
        {!isPaid && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="grid grid-cols-4 border-b border-gray-100">
              <div className="px-4 py-4" />
              {/* Free */}
              <div className="border-l border-gray-100 px-4 py-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Gratuito</p>
                <p className="mt-1 text-lg font-bold text-gray-900">R$0</p>
                <p className="text-xs text-gray-400">/mês</p>
              </div>
              {/* Pro */}
              <div className="border-l border-blue-100 bg-blue-50/50 px-4 py-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Pro</p>
                <p className="mt-1 text-lg font-bold text-gray-900">R$29,90</p>
                <p className="text-xs text-gray-400">/mês</p>
              </div>
              {/* Team */}
              <div className={`border-l px-4 py-4 text-center ${upgradeOrgId ? 'border-purple-100 bg-purple-50/50' : 'border-gray-100'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${upgradeOrgId ? 'text-purple-600' : 'text-gray-400'}`}>Team</p>
                <p className="mt-1 text-lg font-bold text-gray-900">R$49,90</p>
                <p className="text-xs text-gray-400">/assento/mês</p>
              </div>
            </div>

            {COMPARISON_ROWS.map((row, i) => (
              <div key={i} className={`grid grid-cols-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <div className="px-4 py-3 text-sm text-gray-600">{row.label}</div>
                <div className="flex items-center justify-center border-l border-gray-100 px-4 py-3 text-center">
                  <Cell value={row.free} />
                </div>
                <div className="flex items-center justify-center border-l border-blue-100 bg-blue-50/30 px-4 py-3 text-center">
                  <Cell value={row.pro} />
                </div>
                <div className={`flex items-center justify-center border-l px-4 py-3 text-center ${upgradeOrgId ? 'border-purple-100 bg-purple-50/30' : 'border-gray-100'}`}>
                  <Cell value={row.team} />
                </div>
              </div>
            ))}

            {/* CTA row */}
            <div className="grid grid-cols-4 border-t border-gray-100 bg-white px-4 py-4">
              <div />
              <div className="flex justify-center border-l border-gray-100 px-3">
                <span className="text-xs text-gray-400">Plano atual</span>
              </div>
              <div className="flex justify-center border-l border-blue-100 px-3">
                <BillingActions isPaid={false} orgId={undefined} variant="pro" />
              </div>
              <div className={`flex justify-center border-l px-3 ${upgradeOrgId ? 'border-purple-100' : 'border-gray-100'}`}>
                {upgradeOrgId && <BillingActions isPaid={false} orgId={upgradeOrgId} variant="team" />}
              </div>
            </div>
          </div>
        )}

        {/* Paid plan management */}
        {isPaid && (
          <BillingActions isPaid={isPaid} orgId={upgradeOrgId ?? undefined} />
        )}
      </div>
    </div>
  )
}
