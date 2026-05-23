import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

interface OnboardingBody {
  fullName: string
  orgName?: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as OnboardingBody
    const { fullName, orgName } = body

    if (!fullName?.trim()) {
      return NextResponse.json({ error: 'fullName is required' }, { status: 400 })
    }

    const db = createServiceClient()

    // Upsert user profile — handles both new users (trigger ran) and legacy users (no row yet)
    const { error: profileError } = await db
      .from('user_profiles')
      .upsert({ id: user.id, full_name: fullName.trim() }, { onConflict: 'id' })

    if (profileError) {
      console.error('[onboarding] profile upsert failed:', profileError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Optionally create organization
    let orgId: string | null = null
    if (orgName?.trim()) {
      const base = orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const slug = `${base}-${Date.now()}`

      const { data: org, error: orgError } = await db
        .from('organizations')
        .insert({ name: orgName.trim(), slug, owner_id: user.id })
        .select('id')
        .single()

      if (orgError) {
        console.error('[onboarding] org creation failed:', orgError)
        // Non-fatal: profile was already saved
      } else if (org) {
        orgId = org.id
        const { error: memberError } = await db
          .from('organization_members')
          .insert({ organization_id: org.id, user_id: user.id, role: 'owner', joined_at: new Date().toISOString() })
        if (memberError) console.error('[onboarding] member insert failed:', memberError)
      }
    }

    return NextResponse.json({ ok: true, orgId })
  } catch (err) {
    console.error('[onboarding]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
