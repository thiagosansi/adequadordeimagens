import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics'

export async function login(email: string, password: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  void trackEvent('user_login')
}

export async function signUp(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  void trackEvent('user_signup')
  // Returns session when email confirmation is disabled in Supabase Dashboard
  return data.session
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function resetPassword(email: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
  })
  if (error) throw error
}

export async function signInWithGoogle(next?: string) {
  const supabase = createClient()
  const redirectTo = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  if (error) throw error
}

export async function getUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
