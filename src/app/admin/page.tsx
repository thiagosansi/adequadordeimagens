import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { RefreshButton } from './refresh-button'
import { PlanManager } from './plan-manager'

// ─── Types ────────────────────────────────────────────────────────────────────

type EventRow = {
  event_name: string
  user_id: string | null
  properties: Record<string, unknown>
  created_at: string
}

type DownloadMetric = { total: number; last30d: number; last7d: number }

type TopOrg = { id: string; name: string; memberCount: number }

type Metrics = {
  downloads: {
    image: DownloadMetric
    batch: DownloadMetric
    allPlatforms: DownloadMetric
    video: DownloadMetric
    carousel: DownloadMetric
  }
  users: {
    signups: DownloadMetric
    logins: DownloadMetric
    activeUsers7d: number
    activeUsers30d: number
    totalAuthUsers: number
  }
  eventsPerDay: { date: string; count: number }[]
  topPlatforms: [string, number][]
  topFormats: [string, { label: string; count: number }][]
  recentEvents: EventRow[]
  orgs: {
    total: number
    new30d: number
    new7d: number
    totalMembers: number
    topOrgs: TopOrg[]
  }
  subs: {
    proActive: number
    teamActive: number
    totalTeamSeats: number
    mrrCents: number
    pendingApprovals: number
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  'download_image',
  'download_batch',
  'download_all_platforms',
  'download_video',
  'download_carousel',
  'user_signup',
  'user_login',
  'project_saved',
] as const

const EVENT_LABELS: Record<string, string> = {
  download_image: 'Baixar imagem',
  download_batch: 'Baixar batch (.zip)',
  download_all_platforms: 'Todas plataformas (.zip)',
  download_video: 'Baixar vídeo',
  download_carousel: 'Baixar carrossel',
  user_signup: 'Cadastro',
  user_login: 'Login',
  project_saved: 'Projeto salvo',
}

const PLATFORM_LABELS: Record<string, string> = {
  meta: 'Meta',
  tiktok: 'TikTok',
  google: 'Google Ads',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR')
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  return `${Math.floor(hrs / 24)}d atrás`
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchMetrics(): Promise<Metrics> {
  const service = createServiceClient()
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    { data: allEvents30dRaw },
    { data: recentRaw },
    allTimeCounts,
    { data: totalAuthUsers },
    { data: orgsRaw },
    { data: membersRaw },
    { data: subsRaw },
    { count: pendingApprovals },
  ] = await Promise.all([
    service
      .from('analytics_events')
      .select('event_name, user_id, properties, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString()),

    service
      .from('analytics_events')
      .select('event_name, user_id, properties, created_at')
      .order('created_at', { ascending: false })
      .limit(50),

    Promise.all(
      EVENT_TYPES.map(async (eventName) => {
        const { count } = await service
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_name', eventName)
        return { eventName, count: count ?? 0 }
      }),
    ),

    // Total real de usuários cadastrados via função SQL (auth schema não é exposto pelo PostgREST)
    service.rpc('count_auth_users'),

    service.from('organizations').select('id, name, created_at'),

    service.from('organization_members').select('organization_id, joined_at'),

    service
      .from('subscriptions')
      .select('plan_id, status, entity_type, seat_count')
      .in('status', ['active', 'trialing']),

    service
      .from('approval_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const events30d = (allEvents30dRaw ?? []) as EventRow[]
  const recentEvents = (recentRaw ?? []) as EventRow[]

  function allTime(name: string) {
    return allTimeCounts.find((c) => c.eventName === name)?.count ?? 0
  }

  function count30d(name: string) {
    return events30d.filter((e) => e.event_name === name).length
  }

  function count7d(name: string) {
    return events30d.filter(
      (e) => e.event_name === name && new Date(e.created_at) >= sevenDaysAgo,
    ).length
  }

  function metric(name: string): DownloadMetric {
    return { total: allTime(name), last30d: count30d(name), last7d: count7d(name) }
  }

  const activeUsers7d = new Set(
    events30d
      .filter((e) => e.user_id && new Date(e.created_at) >= sevenDaysAgo)
      .map((e) => e.user_id!),
  ).size

  const activeUsers30d = new Set(
    events30d.filter((e) => e.user_id).map((e) => e.user_id!),
  ).size

  const dayCounts: Record<string, number> = {}
  for (const e of events30d) {
    const date = e.created_at.slice(0, 10)
    dayCounts[date] = (dayCounts[date] ?? 0) + 1
  }
  const eventsPerDay = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(thirtyDaysAgo.getTime() + (i + 1) * 24 * 60 * 60 * 1000)
    const date = d.toISOString().slice(0, 10)
    return { date, count: dayCounts[date] ?? 0 }
  })

  const platformCounts: Record<string, number> = {}
  for (const e of events30d) {
    if (e.event_name.startsWith('download_') && e.properties?.platform) {
      const p = e.properties.platform as string
      platformCounts[p] = (platformCounts[p] ?? 0) + 1
    }
  }
  const topPlatforms = Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6) as [string, number][]

  const formatCounts: Record<string, { label: string; count: number }> = {}
  for (const e of events30d) {
    if (e.event_name === 'download_image' && e.properties?.format_id) {
      const id = e.properties.format_id as string
      const label = (e.properties.format_label as string) ?? id
      if (!formatCounts[id]) formatCounts[id] = { label, count: 0 }
      formatCounts[id]!.count++
    }
  }
  const topFormats = Object.entries(formatCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8) as [string, { label: string; count: number }][]

  // ── Org metrics ───────────────────────────────────────────────────────────
  const orgs = orgsRaw ?? []
  const members = membersRaw ?? []

  const orgNew30d = orgs.filter(o => new Date(o.created_at) >= thirtyDaysAgo).length
  const orgNew7d  = orgs.filter(o => new Date(o.created_at) >= sevenDaysAgo).length
  const activeMembers = members.filter(m => m.joined_at != null)
  const totalMembers = activeMembers.length

  const memberCountByOrg = new Map<string, number>()
  for (const m of activeMembers) {
    memberCountByOrg.set(m.organization_id, (memberCountByOrg.get(m.organization_id) ?? 0) + 1)
  }
  const topOrgs: TopOrg[] = orgs
    .map(o => ({ id: o.id, name: o.name, memberCount: memberCountByOrg.get(o.id) ?? 0 }))
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 5)

  // ── Subscription metrics ───────────────────────────────────────────────────
  const subs = subsRaw ?? []
  const proSubs  = subs.filter(s => s.plan_id === 'pro'  && s.entity_type === 'user')
  const teamSubs = subs.filter(s => s.plan_id === 'team' && s.entity_type === 'organization')
  const totalTeamSeats = teamSubs.reduce((sum, s) => sum + (s.seat_count ?? 0), 0)
  const mrrCents = proSubs.length * 2990 + totalTeamSeats * 4990

  return {
    downloads: {
      image: metric('download_image'),
      batch: metric('download_batch'),
      allPlatforms: metric('download_all_platforms'),
      video: metric('download_video'),
      carousel: metric('download_carousel'),
    },
    users: {
      signups: metric('user_signup'),
      logins: metric('user_login'),
      activeUsers7d,
      totalAuthUsers: Number(totalAuthUsers ?? 0),
      activeUsers30d,
    },
    eventsPerDay,
    topPlatforms,
    topFormats,
    recentEvents,
    orgs: {
      total: orgs.length,
      new30d: orgNew30d,
      new7d: orgNew7d,
      totalMembers,
      topOrgs,
    },
    subs: {
      proActive: proSubs.length,
      teamActive: teamSubs.length,
      totalTeamSeats,
      mrrCents,
      pendingApprovals: pendingApprovals ?? 0,
    },
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
      <span className="h-4 w-1 rounded-full bg-blue-500" />
      {children}
    </h2>
  )
}

function MetricCard({
  title,
  total,
  last30d,
  last7d,
  accent = false,
}: {
  title: string
  total: number
  last30d: number
  last7d: number
  accent?: boolean
}) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? 'border-blue-100 bg-blue-50' : 'border-gray-100 bg-white'}`}>
      <p className="text-xs font-medium text-gray-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${accent ? 'text-blue-700' : 'text-gray-900'}`}>
        {fmt(total)}
      </p>
      <div className="mt-3 flex gap-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
        <span><span className="font-semibold text-gray-600">{fmt(last30d)}</span> / 30d</span>
        <span><span className="font-semibold text-gray-600">{fmt(last7d)}</span> / 7d</span>
      </div>
    </div>
  )
}

function StatCard({ title, value, sub, color = 'blue' }: { title: string; value: number | string; sub?: string; color?: 'blue' | 'green' | 'gray' }) {
  const colors = {
    blue:  'border-blue-100 bg-blue-50 text-blue-700',
    green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    gray:  'border-gray-100 bg-white text-gray-900',
  }
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-medium text-gray-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums`}>{typeof value === 'number' ? fmt(value) : value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function DailyChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex h-32 items-end gap-0.5">
      {data.map(({ date, count }) => (
        <div key={date} className="flex flex-1 flex-col items-center justify-end">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{
              height: count > 0 ? `${Math.max(6, (count / max) * 100)}%` : '3px',
              backgroundColor: count > 0 ? '#3b82f6' : '#e2e8f0',
            }}
            title={`${date}: ${count} evento${count !== 1 ? 's' : ''}`}
          />
        </div>
      ))}
    </div>
  )
}

function EventBadge({ name }: { name: string }) {
  const colors: Record<string, string> = {
    download_image:         'bg-blue-50 text-blue-700',
    download_batch:         'bg-purple-50 text-purple-700',
    download_all_platforms: 'bg-indigo-50 text-indigo-700',
    download_video:         'bg-pink-50 text-pink-700',
    download_carousel:      'bg-orange-50 text-orange-700',
    user_signup:            'bg-emerald-50 text-emerald-700',
    user_login:             'bg-gray-100 text-gray-600',
    project_saved:          'bg-amber-50 text-amber-700',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[name] ?? 'bg-gray-100 text-gray-500'}`}>
      {EVENT_LABELS[name] ?? name}
    </span>
  )
}

// ─── Plan management data ─────────────────────────────────────────────────────

type PlanId = 'free' | 'pro' | 'team' | 'enterprise'

interface UserRow { id: string; email: string; fullName: string | null; planId: PlanId }
interface OrgRow  { id: string; name: string; planId: PlanId; memberCount: number }

async function fetchPlanData(): Promise<{ users: UserRow[]; orgs: OrgRow[] }> {
  const db = createServiceClient()

  const [
    listUsersResult,
    { data: profiles },
    { data: activeSubs },
    { data: orgsRaw },
    { data: membersRaw },
  ] = await Promise.all([
    db.auth.admin.listUsers({ perPage: 1000 }),
    db.from('user_profiles').select('id, full_name'),
    db.from('subscriptions').select('entity_type, entity_id, plan_id').in('status', ['active', 'trialing']),
    db.from('organizations').select('id, name').order('name'),
    db.from('organization_members').select('organization_id').not('joined_at', 'is', null),
  ])

  const authUsers = listUsersResult.data?.users ?? []
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name ?? null]))
  const subMap = Object.fromEntries(
    (activeSubs ?? []).map((s) => [`${s.entity_type}:${s.entity_id}`, s.plan_id as PlanId])
  )
  const memberCount = new Map<string, number>()
  for (const m of membersRaw ?? []) {
    memberCount.set(m.organization_id, (memberCount.get(m.organization_id) ?? 0) + 1)
  }

  const users: UserRow[] = authUsers.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    fullName: profileMap[u.id] ?? null,
    planId: subMap[`user:${u.id}`] ?? 'free',
  }))

  const orgs: OrgRow[] = (orgsRaw ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    planId: subMap[`organization:${o.id}`] ?? 'free',
    memberCount: memberCount.get(o.id) ?? 0,
  }))

  return { users, orgs }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
  if (!adminEmails.includes(user.email ?? '')) redirect('/app')

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: '#F8FAFC' }}
      >
        <div
          className="max-w-md rounded-xl p-8 text-center"
          style={{ border: '1px solid #FECACA', backgroundColor: '#FEF2F2' }}
        >
          <p className="text-sm font-semibold" style={{ color: '#991B1B' }}>
            Variável de ambiente ausente
          </p>
          <p className="mt-2 text-xs" style={{ color: '#DC2626' }}>
            Adicione{' '}
            <code
              className="rounded px-1 py-0.5"
              style={{ backgroundColor: '#FEE2E2' }}
            >
              SUPABASE_SERVICE_ROLE_KEY
            </code>{' '}
            nas variáveis de ambiente do projeto.
          </p>
        </div>
      </main>
    )
  }

  const [metrics, planData] = await Promise.all([fetchMetrics(), fetchPlanData()])
  const { downloads, users, eventsPerDay, topPlatforms, topFormats, recentEvents, orgs: orgMetrics, subs: subsMetrics } = metrics

  const totalDownloads =
    downloads.image.total +
    downloads.batch.total +
    downloads.allPlatforms.total +
    downloads.video.total +
    downloads.carousel.total

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 px-6 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">AdFrame</p>
              <h1 className="text-sm font-bold text-gray-900">Painel Administrativo</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <RefreshButton />
            <span className="hidden rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 sm:block">
              {user.email}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">

        {/* ── Usuários ──────────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Usuários</SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricCard title="Total cadastrados" total={users.totalAuthUsers} last30d={users.signups.last30d} last7d={users.signups.last7d} accent />
            <MetricCard title="Logins" total={users.logins.total} last30d={users.logins.last30d} last7d={users.logins.last7d} />
            <StatCard title="Ativos 7 dias" value={users.activeUsers7d} sub="usuários únicos com evento" />
            <StatCard title="Ativos 30 dias" value={users.activeUsers30d} sub="usuários únicos com evento" />
          </div>
        </section>

        {/* ── Downloads ─────────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>
            Downloads
            <span className="ml-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {fmt(totalDownloads)} total
            </span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <MetricCard title="Imagem" total={downloads.image.total} last30d={downloads.image.last30d} last7d={downloads.image.last7d} />
            <MetricCard title="Batch (.zip)" total={downloads.batch.total} last30d={downloads.batch.last30d} last7d={downloads.batch.last7d} />
            <MetricCard title="Todas plataformas" total={downloads.allPlatforms.total} last30d={downloads.allPlatforms.last30d} last7d={downloads.allPlatforms.last7d} />
            <MetricCard title="Vídeo" total={downloads.video.total} last30d={downloads.video.last30d} last7d={downloads.video.last7d} />
            <MetricCard title="Carrossel" total={downloads.carousel.total} last30d={downloads.carousel.last30d} last7d={downloads.carousel.last7d} />
          </div>
        </section>

        {/* ── Atividade + Top Plataformas + Top Formatos ────────────────────── */}
        <section>
          <SectionTitle>Atividade</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <p className="text-sm font-semibold text-gray-900">Últimos 30 dias</p>
              <p className="mb-5 mt-0.5 text-xs text-gray-400">
                {eventsPerDay.reduce((s, d) => s + d.count, 0)} eventos no período
              </p>
              <DailyChart data={eventsPerDay} />
              <div className="mt-2 flex justify-between text-[10px] text-gray-300">
                <span>{eventsPerDay[0]?.date?.slice(5) ?? ''}</span>
                <span>{eventsPerDay[eventsPerDay.length - 1]?.date?.slice(5) ?? ''}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <p className="mb-4 text-sm font-semibold text-gray-900">
                Top plataformas <span className="font-normal text-gray-400">30d</span>
              </p>
              {topPlatforms.length === 0 ? (
                <p className="text-xs text-gray-300">Sem dados ainda</p>
              ) : (
                <div className="space-y-3">
                  {topPlatforms.map(([platform, count]) => {
                    const max = topPlatforms[0]?.[1] ?? 1
                    return (
                      <div key={platform}>
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-gray-800">{PLATFORM_LABELS[platform] ?? platform}</span>
                          <span className="tabular-nums text-gray-500">{fmt(count)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <p className="mb-4 text-sm font-semibold text-gray-900">
                Top formatos <span className="font-normal text-gray-400">30d</span>
              </p>
              {topFormats.length === 0 ? (
                <p className="text-xs text-gray-300">Sem dados ainda</p>
              ) : (
                <div className="space-y-3">
                  {topFormats.map(([id, { label, count }]) => {
                    const max = topFormats[0]?.[1]?.count ?? 1
                    return (
                      <div key={id}>
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-gray-800">{label}</span>
                          <span className="tabular-nums text-gray-500">{fmt(count)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Eventos recentes ──────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Eventos recentes</SectionTitle>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            {recentEvents.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-gray-300">
                Nenhum evento registrado ainda. Use o produto para ver dados aqui.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">Evento</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500">Usuário</th>
                    <th className="hidden px-5 py-3 text-xs font-semibold text-gray-500 md:table-cell">Detalhes</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Quando</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentEvents.slice(0, 20).map((event, i) => {
                    const props = event.properties
                    const details = [
                      props?.platform && (PLATFORM_LABELS[props.platform as string] ?? props.platform),
                      props?.format_label,
                      props?.format_count != null && `${props.format_count} formatos`,
                      props?.card_count != null && `${props.card_count} cards`,
                      props?.ai === true && 'IA',
                    ].filter(Boolean).join(' · ')
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <EventBadge name={event.event_name} />
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-400">
                          {event.user_id ? event.user_id.slice(0, 8) + '…' : '—'}
                        </td>
                        <td className="hidden px-5 py-3 text-xs text-gray-500 md:table-cell">
                          {details || '—'}
                        </td>
                        <td className="px-5 py-3 text-right text-xs text-gray-400">
                          {relativeTime(event.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* ── Organizações ──────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Organizações</SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard title="Total de orgs" value={orgMetrics.total} />
            <StatCard title="Novas (30d)" value={orgMetrics.new30d} sub={`${orgMetrics.new7d} nos últimos 7d`} />
            <StatCard title="Membros ativos" value={orgMetrics.totalMembers} sub="com convite aceito" />
            <StatCard title="Aprovações pendentes" value={subsMetrics.pendingApprovals} sub="aguardando revisão" color="gray" />
          </div>

          {orgMetrics.topOrgs.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <div className="border-b border-gray-100 px-5 py-3">
                <p className="text-xs font-semibold text-gray-500">Top organizações por membros</p>
              </div>
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-gray-50">
                  {orgMetrics.topOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{org.name}</td>
                      <td className="px-5 py-3 text-right text-sm tabular-nums text-gray-500">
                        {fmt(org.memberCount)} membro{org.memberCount !== 1 ? 's' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Planos & Receita ──────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Planos &amp; Receita</SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard title="Free" value={Math.max(0, users.totalAuthUsers - subsMetrics.proActive)} sub="sem plano pago" color="gray" />
            <StatCard title="Pro" value={subsMetrics.proActive} sub="assinaturas ativas" />
            <StatCard title="Team" value={subsMetrics.teamActive} sub={`${fmt(subsMetrics.totalTeamSeats)} seats totais`} />
            <StatCard
              title="MRR estimado"
              value={(subsMetrics.mrrCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              sub="Pro × R$29,90 + Team × R$49,90"
              color="green"
            />
          </div>
        </section>

        {/* ── Gestão de Planos ──────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Gestão de planos</SectionTitle>
          <PlanManager users={planData.users} orgs={planData.orgs} />
        </section>

      </div>
    </main>
  )
}
