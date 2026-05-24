import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app'

  let redirectPath = next
  const pendingCookies: Array<{ name: string; value: string; options: object }> = []

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              pendingCookies.push({ name, value, options }),
            )
          },
        },
      },
    )

    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // New OAuth user (Google etc.): created_at ≈ last_sign_in_at → send to onboarding
    if (data.session?.user && next === '/app') {
      const user = data.session.user
      const created = new Date(user.created_at).getTime()
      const lastSign = new Date(user.last_sign_in_at ?? user.created_at).getTime()
      if (Math.abs(created - lastSign) < 10_000) {
        redirectPath = '/app/onboarding'
      }
    }
  }

  const response = NextResponse.redirect(`${origin}${redirectPath}`)
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
  return response
}
