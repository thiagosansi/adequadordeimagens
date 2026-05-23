import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { BillingActions } from '@/components/billing-actions'
import type { ActiveSubscription } from '@/lib/stripe/types'

// Returns the current billing period as 'YYYY-MM'
function currentPeriod() {
  return new Date().toISOString().slice(0, 7)
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string
  used: number
  limit: number
}) {
  const unlimited = limit === -1
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const danger = pct >= 90

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`font-semibold ${danger ? 'text-red-600' : 'text-gray-600'}`}>
          {unlimited ? `${used} / ilimitado` : `${used} / ${limit}`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        {!unlimited && (
          <div
            className={`h-full rounded-full transition-all ${danger ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        )}
        {unlimited && <div className="h-full rounded-full bg-blue-200" style={{ width: '100%' }} />}
      </div>
      {!unlimited && (
        <p className="mt-1 text-xs text-gray-400">
          {limit - used} restantes este mês
        </p>
      )}
    </div>
  )
}

const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  team: 'Team',
  enterprise: 'Enterprise',
}

const STATUS_CONFIG = {
  active:    { label: 'Ativo',         icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  trialing:  { label: 'Período de teste', icon: Clock,     color: 'text-blue-600 bg-blue-50'  },
  past_due:  { label: 'Pagamento pendente', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
  canceled:  { label: 'Cancelado',     icon: AlertTriangle, color: 'text-gray-500 bg-gray-50'  },
  incomplete:{ label: 'Incompleto',    icon: AlertTriangle, color: 'text-gray-500 bg-gray-50'  },
} as const

const PRO_BENEFITS = [
  '100 exportações/mês',
  '30 solicitações de IA/mês',
  'Todas as plataformas',
  'Suporte por email',
]

const TEAM_BENEFITS = [
  '400 exportações/assento/mês',
  '80 solicitações de IA/assento/mês',
  'Todas as plataformas',
  'Brand Kit da empresa',
  'Gestão de equipe',
  'Suporte prioritário',
]

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const period = currentPeriod()

  // Fetch personal subscription with plan features
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('entity_type', 'user')
    .eq('entity_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  const subscription = sub as ActiveSubscription | null
  const plan = subscription?.plan
  const isPaid = !!plan && plan.id !== 'free'

  // Fetch personal usage for current period
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

  const exportsLimit = (plan?.features.exports_monthly ?? 15) as number
  const aiLimit = (plan?.features.ai_requests_monthly ?? 3) as number

  const trialDays = daysUntil(subscription?.trial_ends_at ?? null)
  const statusKey = (subscription?.status ?? 'active') as keyof typeof STATUS_CONFIG
  const status = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.active
  const StatusIcon = status.icon

  // Fetch the first org where user is owner or admin (to offer Team upgrade)
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
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao editor
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cobrança e uso</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie seu plano e acompanhe o uso mensal.
          </p>
        </div>

        {/* Plan card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Plano atual
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {PLAN_LABEL[plan?.id ?? 'free']}
              </p>
              {!!plan?.price_cents && (
                <p className="mt-0.5 text-sm text-gray-500">
                  R${(plan.price_cents / 100).toFixed(2).replace('.', ',')}/mês
                </p>
              )}
            </div>
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>
          </div>

          {/* Trial countdown */}
          {subscription?.status === 'trialing' && trialDays !== null && (
            <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <span className="font-semibold">{trialDays} dias</span> restantes no período de teste.
              Você será cobrado ao final do trial.
            </div>
          )}

          {/* Past due warning */}
          {subscription?.status === 'past_due' && (
            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Pagamento pendente. Atualize seu método de pagamento para manter o acesso.
            </div>
          )}

          {/* Billing period */}
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

        {/* Plan benefits */}
        {isPaid ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Recursos do plano</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              {(plan?.id === 'team' ? TEAM_BENEFITS : PRO_BENEFITS).map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />{b}
                </li>
              ))}
            </ul>
          </div>
        ) : upgradeOrgId ? (
          /* User is owner/admin of an org — show Team only */
          <div className="rounded-2xl border border-purple-200 bg-white p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-bold text-gray-900">Team</h2>
              <span className="text-sm font-semibold text-purple-600">R$49,90/assento/mês</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              {TEAM_BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-purple-400" />{b}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          /* Individual user — show Pro only */
          <div className="rounded-2xl border border-blue-200 bg-white p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-bold text-gray-900">Pro</h2>
              <span className="text-sm font-semibold text-blue-600">R$29,90/mês</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              {PRO_BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-400" />{b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <BillingActions isPaid={isPaid} orgId={upgradeOrgId ?? undefined} />
      </div>
    </div>
  )
}
