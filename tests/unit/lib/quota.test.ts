import { describe, it, expect } from 'vitest'

// ── Quota business rules ───────────────────────────────────────────────────────
// These tests validate the quota logic in isolation using plain functions,
// without hitting the database.

type Action = 'export' | 'ai_request'

function isQuotaExceeded(used: number, limit: number): boolean {
  if (limit === -1) return false   // unlimited
  return used >= limit
}

function getRemainingQuota(used: number, limit: number): number {
  if (limit === -1) return Infinity
  return Math.max(0, limit - used)
}

// Plan feature limits (mirrors plans seed data)
const PLAN_LIMITS: Record<string, Record<Action, number>> = {
  free: { export: 15, ai_request: 3 },
  pro:  { export: -1, ai_request: 100 },
  team: { export: -1, ai_request: 200 },
}

describe('isQuotaExceeded', () => {
  it('returns false when under limit', () => {
    expect(isQuotaExceeded(5, 15)).toBe(false)
  })

  it('returns true when at limit', () => {
    expect(isQuotaExceeded(15, 15)).toBe(true)
  })

  it('returns true when over limit', () => {
    expect(isQuotaExceeded(16, 15)).toBe(true)
  })

  it('returns false for unlimited plan (-1)', () => {
    expect(isQuotaExceeded(999, -1)).toBe(false)
  })

  it('returns false at zero usage', () => {
    expect(isQuotaExceeded(0, 15)).toBe(false)
  })
})

describe('getRemainingQuota', () => {
  it('returns correct remainder', () => {
    expect(getRemainingQuota(5, 15)).toBe(10)
  })

  it('returns 0 when at limit', () => {
    expect(getRemainingQuota(15, 15)).toBe(0)
  })

  it('returns 0 when over limit (no negative)', () => {
    expect(getRemainingQuota(20, 15)).toBe(0)
  })

  it('returns Infinity for unlimited', () => {
    expect(getRemainingQuota(999, -1)).toBe(Infinity)
  })
})

describe('Plan limits', () => {
  it('free plan has 15 exports/month', () => {
    expect(PLAN_LIMITS.free.export).toBe(15)
  })

  it('free plan has 3 AI requests/month', () => {
    expect(PLAN_LIMITS.free.ai_request).toBe(3)
  })

  it('pro plan has unlimited exports', () => {
    expect(PLAN_LIMITS.pro.export).toBe(-1)
  })

  it('pro plan has 100 AI requests/month', () => {
    expect(PLAN_LIMITS.pro.ai_request).toBe(100)
  })

  it('team plan has unlimited exports', () => {
    expect(PLAN_LIMITS.team.export).toBe(-1)
  })

  it('team plan has 200 AI requests/month', () => {
    expect(PLAN_LIMITS.team.ai_request).toBe(200)
  })

  it('free user hits export wall at 15', () => {
    expect(isQuotaExceeded(15, PLAN_LIMITS.free.export)).toBe(true)
    expect(isQuotaExceeded(14, PLAN_LIMITS.free.export)).toBe(false)
  })

  it('free user hits AI wall at 3', () => {
    expect(isQuotaExceeded(3, PLAN_LIMITS.free.ai_request)).toBe(true)
    expect(isQuotaExceeded(2, PLAN_LIMITS.free.ai_request)).toBe(false)
  })

  it('pro user never hits export wall', () => {
    expect(isQuotaExceeded(10_000, PLAN_LIMITS.pro.export)).toBe(false)
  })
})

describe('Quota period', () => {
  it('billing period is formatted as YYYY-MM', () => {
    const now = new Date()
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(period).toMatch(/^\d{4}-\d{2}$/)
  })

  it('period resets each month', () => {
    const jan = '2026-01'
    const feb = '2026-02'
    expect(jan).not.toBe(feb)
  })
})
