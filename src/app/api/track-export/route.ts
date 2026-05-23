// Tracks an export action and enforces the monthly export quota.
// Called by the client before triggering a download.
//
// Returns { ok: true } when the export is within quota (counter incremented).
// Returns { ok: false, quota: { upgradeRequired: true } } when quota is exceeded.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndConsumeQuota, resolveActiveEntity } from '@/lib/quota'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { entityType, entityId } = await resolveActiveEntity(user.id)
    const quota = await checkAndConsumeQuota(user.id, entityType, entityId, 'export')

    if (!quota.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Limite de exportações atingido para este período.',
          quota: { remaining: 0, limit: quota.limit, upgradeRequired: quota.upgradeRequired },
        },
        { status: 429 },
      )
    }

    return NextResponse.json({
      ok: true,
      quota: { remaining: quota.remaining, limit: quota.limit },
    })
  } catch (err) {
    console.error('[track-export]', err)
    return NextResponse.json({ ok: false, error: 'Erro interno' }, { status: 500 })
  }
}
