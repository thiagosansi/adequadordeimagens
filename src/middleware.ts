import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Temporary: surface env var issues in Vercel runtime logs
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) console.error('[middleware] NEXT_PUBLIC_SUPABASE_URL missing')
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) console.error('[middleware] NEXT_PUBLIC_SUPABASE_ANON_KEY missing')

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (err) {
    // Auth check failed (network, Supabase outage, etc.) — log and allow
    // the request through rather than returning 500. The page will handle
    // unauthenticated state on the client side.
    console.error('[middleware] supabase.auth.getUser failed:', err)
  }

  const { pathname } = request.nextUrl

  if (!user && pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/app/:path*', '/login'],
}
