import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function getActiveOrgId(request: Request): string | null {
  const cookie = request.headers.get('cookie') ?? ''
  const match = cookie.match(/(?:^|;\s*)adframe-workspace=([^;]*)/)
  return match ? decodeURIComponent(match[1] ?? '') || null : null
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = getActiveOrgId(request)

  const db = createServiceClient()
  const period = new Date().toISOString().slice(0, 7)

  // Check first export
  const { data: usageRow } = await db
    .from('usage_counters')
    .select('count')
    .eq('entity_type', 'user')
    .eq('entity_id', user.id)
    .eq('action', 'export')
    .eq('period', period)
    .maybeSingle()

  const hasExport = (usageRow?.count ?? 0) > 0

  // Check member invited (org must have > 1 member)
  let hasMemberInvited = false
  let brandKitConfigured = false

  if (orgId) {
    const { count: memberCount } = await db
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)

    hasMemberInvited = (memberCount ?? 0) > 1

    const { data: kitRow } = await db
      .from('brand-kits')
      .select('id, colors, fonts, logo_url')
      .eq('organization_id', orgId)
      .maybeSingle()

    if (kitRow) {
      const colors = (kitRow.colors as unknown[]) ?? []
      const fonts = (kitRow.fonts as unknown[]) ?? []
      brandKitConfigured = colors.length > 0 || fonts.length > 0 || !!kitRow.logo_url
    }
  }

  return NextResponse.json({
    accountCreated: true,
    hasExport,
    hasMemberInvited,
    brandKitConfigured,
    orgId,
  })
}
