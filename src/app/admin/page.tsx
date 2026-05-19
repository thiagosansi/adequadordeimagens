import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { RefreshButton } from './refresh-button'

// ─── Types ────────────────────────────────────────────────────────────────────

type EventRow = {
  event_name: string
  user_id: string | null
  properties: Record<string, unknown>
  created_at: string
}

type DownloadMetric = { total: number; last30d: number; last7d: number }

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
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  title,
  total,
  last30d,
  last7d,
  highlight = false,
}: {
  title: string
  total: number
  last30d: number
  last7d: number
  highlight?: boolean
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: highlight ? '#EFF6FF' : '#FFFFFF',
        border: `1px solid ${highlight ? '#BFDBFE' : '#E2E8F0'}`,
      }}
    >
      <p
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: '#64748B' }}
      >
        {title}
      </p>
      <p
        className="mt-1 text-3xl font-bold tabular-nums"
        style={{ color: highlight ? '#1D4ED8' : '#2563EB' }}
      >
        {fmt(total)}
      </p>
      <div className="mt-2 flex gap-3 text-xs" style={{ color: '#94A3B8' }}>
        <span>
          <span className="font-semibold" style={{ color: '#475569' }}>{fmt(last30d)}</span> 30d
        </span>
        <span>
          <span className="font-semibold" style={{ color: '#475569' }}>{fmt(last7d)}</span> 7d
        </span>
      </div>
    </div>
  )
}

function SimpleCard({
  title,
  value,
  sub,
}: {
  title: string
  value: number
  sub?: string
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}
    >
      <p
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: '#64748B' }}
      >
        {title}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: '#1D4ED8' }}>
        {fmt(value)}
      </p>
      {sub && (
        <p className="mt-1 text-xs" style={{ color: '#94A3B8' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function DailyChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex h-28 items-end gap-px">
      {data.map(({ date, count }) => (
        <div key={date} className="group relative flex flex-1 flex-col items-center justify-end">
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: count > 0 ? `${Math.max(4, (count / max) * 100)}%` : '2px',
              backgroundColor: count > 0 ? '#2563EB' : '#E2E8F0',
            }}
            title={`${date}: ${count} evento${count !== 1 ? 's' : ''}`}
          />
        </div>
      ))}
    </div>
  )
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

  const metrics = await fetchMetrics()
  const { downloads, users, eventsPerDay, topPlatforms, topFormats, recentEvents } = metrics

  const totalDownloads =
    downloads.image.total +
    downloads.batch.total +
    downloads.allPlatforms.total +
    downloads.video.total +
    downloads.carousel.total

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>

      {/* Header */}
      <header
        className="sticky top-0 z-10 px-6 py-4"
        style={{
          backgroundColor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, #2563EB, #3b82f6)' }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 text-white"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <div>
              <p
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: '#94A3B8' }}
              >
                AdFrame
              </p>
              <h1 className="text-sm font-bold" style={{ color: '#0F172A' }}>
                Painel Administrativo
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <RefreshButton />
            <p
              className="hidden text-xs sm:block"
              style={{ color: '#64748B' }}
            >
              {user.email}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">

        {/* ── Downloads ───────────────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-baseline gap-3">
            <h2
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#64748B' }}
            >
              Downloads
            </h2>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}
            >
              {fmt(totalDownloads)} total
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <MetricCard
              title="Imagem"
              total={downloads.image.total}
              last30d={downloads.image.last30d}
              last7d={downloads.image.last7d}
            />
            <MetricCard
              title="Batch (.zip)"
              total={downloads.batch.total}
              last30d={downloads.batch.last30d}
              last7d={downloads.batch.last7d}
            />
            <MetricCard
              title="Todas plataformas"
              total={downloads.allPlatforms.total}
              last30d={downloads.allPlatforms.last30d}
              last7d={downloads.allPlatforms.last7d}
            />
            <MetricCard
              title="Vídeo"
              total={downloads.video.total}
              last30d={downloads.video.last30d}
              last7d={downloads.video.last7d}
            />
            <MetricCard
              title="Carrossel"
              total={downloads.carousel.total}
              last30d={downloads.carousel.last30d}
              last7d={downloads.carousel.last7d}
            />
          </div>
        </section>

        {/* ── Usuários ────────────────────────────────────────────────────── */}
        <section>
          <h2
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#64748B' }}
          >
            Usuários
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              title="Cadastros"
              total={users.totalAuthUsers}
              last30d={users.signups.last30d}
              last7d={users.signups.last7d}
              highlight
            />
            <MetricCard
              title="Logins"
              total={users.logins.total}
              last30d={users.logins.last30d}
              last7d={users.logins.last7d}
            />
            <SimpleCard
              title="Usuários ativos 7d"
              value={users.activeUsers7d}
              sub="usuários únicos com evento"
            />
            <SimpleCard
              title="Usuários ativos 30d"
              value={users.activeUsers30d}
              sub="usuários únicos com evento"
            />
          </div>
        </section>

        {/* ── Atividade + Top Plataformas + Top Formatos ──────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Chart */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
          >
            <h2 className="mb-0.5 text-sm font-semibold" style={{ color: '#0F172A' }}>
              Atividade — últimos 30 dias
            </h2>
            <p className="mb-5 text-xs" style={{ color: '#94A3B8' }}>
              {eventsPerDay.reduce((s, d) => s + d.count, 0)} eventos no período
            </p>
            <DailyChart data={eventsPerDay} />
            <div className="mt-2 flex justify-between text-xs" style={{ color: '#CBD5E1' }}>
              <span>{eventsPerDay[0]?.date?.slice(5) ?? ''}</span>
              <span>{eventsPerDay[eventsPerDay.length - 1]?.date?.slice(5) ?? ''}</span>
            </div>
          </div>

          {/* Top Plataformas */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: '#0F172A' }}>
              Top plataformas <span className="font-normal" style={{ color: '#94A3B8' }}>30d</span>
            </h2>
            {topPlatforms.length === 0 ? (
              <p className="text-xs" style={{ color: '#CBD5E1' }}>Sem dados ainda</p>
            ) : (
              <div className="space-y-3">
                {topPlatforms.map(([platform, count]) => {
                  const max = topPlatforms[0]?.[1] ?? 1
                  return (
                    <div key={platform}>
                      <div className="flex justify-between text-xs">
                        <span className="font-medium" style={{ color: '#0F172A' }}>
                          {PLATFORM_LABELS[platform] ?? platform}
                        </span>
                        <span className="tabular-nums" style={{ color: '#64748B' }}>
                          {fmt(count)}
                        </span>
                      </div>
                      <div
                        className="mt-1 h-1 w-full overflow-hidden rounded-full"
                        style={{ backgroundColor: '#F1F5F9' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(count / max) * 100}%`,
                            background: 'linear-gradient(90deg, #2563EB, #3b82f6)',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top Formatos */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: '#0F172A' }}>
              Top formatos <span className="font-normal" style={{ color: '#94A3B8' }}>30d</span>
            </h2>
            {topFormats.length === 0 ? (
              <p className="text-xs" style={{ color: '#CBD5E1' }}>Sem dados ainda</p>
            ) : (
              <div className="space-y-3">
                {topFormats.map(([id, { label, count }]) => {
                  const max = topFormats[0]?.[1]?.count ?? 1
                  return (
                    <div key={id}>
                      <div className="flex justify-between text-xs">
                        <span className="font-medium" style={{ color: '#0F172A' }}>{label}</span>
                        <span className="tabular-nums" style={{ color: '#64748B' }}>
                          {fmt(count)}
                        </span>
                      </div>
                      <div
                        className="mt-1 h-1 w-full overflow-hidden rounded-full"
                        style={{ backgroundColor: '#F1F5F9' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(count / max) * 100}%`,
                            background: 'linear-gradient(90deg, #2563EB, #3b82f6)',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Eventos recentes ─────────────────────────────────────────────── */}
        <section>
          <h2
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#64748B' }}
          >
            Eventos recentes
          </h2>
          <div
            className="overflow-hidden rounded-xl"
            style={{ border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
          >
            <table className="w-full text-left text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
                  <th className="px-4 py-3 font-semibold" style={{ color: '#475569' }}>Evento</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: '#475569' }}>Usuário</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: '#475569' }}>Detalhes</th>
                  <th className="px-4 py-3 text-right font-semibold" style={{ color: '#475569' }}>Quando</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-xs"
                      style={{ color: '#CBD5E1' }}
                    >
                      Nenhum evento registrado ainda. Use o produto para ver dados aqui.
                    </td>
                  </tr>
                ) : (
                  recentEvents.map((event, i) => {
                    const props = event.properties
                    const details = [
                      props?.platform && (PLATFORM_LABELS[props.platform as string] ?? props.platform),
                      props?.format_label,
                      props?.format_count != null && `${props.format_count} formatos`,
                      props?.card_count != null && `${props.card_count} cards`,
                      props?.ai === true && 'IA',
                    ]
                      .filter(Boolean)
                      .join(' · ')

                    return (
                      <tr
                        key={i}
                        className="transition-colors hover:bg-slate-50"
                        style={{ borderTop: '1px solid #F1F5F9' }}
                      >
                        <td className="px-4 py-2.5">
                          <span className="font-medium" style={{ color: '#0F172A' }}>
                            {EVENT_LABELS[event.event_name] ?? event.event_name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: '#94A3B8' }}>
                          {event.user_id ? event.user_id.slice(0, 8) + '…' : '—'}
                        </td>
                        <td className="px-4 py-2.5" style={{ color: '#64748B' }}>
                          {details || '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right" style={{ color: '#94A3B8' }}>
                          {relativeTime(event.created_at)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  )
}
