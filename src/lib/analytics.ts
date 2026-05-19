import { createClient } from '@/lib/supabase/client'

export type AnalyticsEventName =
  | 'download_image'
  | 'download_batch'
  | 'download_all_platforms'
  | 'download_video'
  | 'download_carousel'
  | 'user_signup'
  | 'user_login'
  | 'project_saved'

type EventProperties = Record<string, string | number | boolean | null | undefined>

/**
 * Fire-and-forget analytics tracking. Never throws — must not block user actions.
 */
export async function trackEvent(
  eventName: AnalyticsEventName,
  properties?: EventProperties,
): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('analytics_events').insert({
      user_id: user?.id ?? null,
      event_name: eventName,
      properties: properties ?? {},
    })
  } catch {
    // Non-critical — silently discard errors
  }
}
