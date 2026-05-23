// GET  — fetch (or auto-create) the brand kit for an org
// PUT  — update colors, fonts, and name (logo is uploaded directly to Storage)
// DELETE logo path — handled by the client uploading directly to Supabase Storage

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

interface Color { name: string; hex: string }
interface Font  { name: string; url: string; weight: string }

interface BrandKitBody {
  name?: string
  colors?: Color[]
  fonts?: Font[]
  logoPath?: string | null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch existing brand kit
    const { data: kit } = await supabase
      .from('brand_kits')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle()

    if (kit) {
      // Generate signed URL for the logo if it exists
      let logoUrl: string | null = null
      if (kit.logo_url) {
        const { data: signed } = await supabase.storage
          .from('brand-kits')
          .createSignedUrl(kit.logo_url, 60 * 60)
        logoUrl = signed?.signedUrl ?? null
      }

      return NextResponse.json({ kit: { ...kit, logoUrl } })
    }

    // Auto-create an empty brand kit for the org
    const db = createServiceClient()
    const { data: newKit, error } = await db
      .from('brand_kits')
      .insert({ organization_id: orgId, name: 'Brand Kit', colors: [], fonts: [] })
      .select('*')
      .single()

    if (error) {
      console.error('[brand-kit/GET] create failed:', error)
      return NextResponse.json({ error: 'Failed to create brand kit' }, { status: 500 })
    }

    return NextResponse.json({ kit: { ...newKit, logoUrl: null } })
  } catch (err) {
    console.error('[brand-kit/GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as BrandKitBody

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.name !== undefined) updatePayload.name = body.name
    if (body.colors !== undefined) updatePayload.colors = body.colors
    if (body.fonts !== undefined) updatePayload.fonts = body.fonts
    if (body.logoPath !== undefined) updatePayload.logo_url = body.logoPath

    // RLS enforces that only owner/admin/designer can update
    const { data: updated, error } = await supabase
      .from('brand_kits')
      .update(updatePayload)
      .eq('organization_id', orgId)
      .select('*')
      .single()

    if (error) {
      console.error('[brand-kit/PUT]', error)
      return NextResponse.json({ error: 'Failed to update brand kit' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, kit: updated })
  } catch (err) {
    console.error('[brand-kit/PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
