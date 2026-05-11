import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('[middleware] Supabase env vars missing — url:', !!supabaseUrl, 'key:', !!supabaseKey)
      // Cannot authenticate; redirect /app to login, pass other routes
      if (request.nextUrl.pathname.startsWith('/app')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return NextResponse.next({ request })
    }

    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
    })

    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch (err) {
      console.error('[middleware] supabase.auth.getUser failed:', err)
    }

    const { pathname } = request.nextUrl
    const adminEmail = process.env.ADMIN_EMAIL
    const isAdmin = !!user && !!adminEmail && user.email === adminEmail

    // /app routes — any authenticated user
    if (!user && pathname.startsWith('/app')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // /admin routes (except /admin/login) — admin only
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      if (!user) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/app', request.url))
      }
    }

    // Redirect away from login pages when already authenticated
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/app', request.url))
    }
    if (user && pathname === '/admin/login') {
      const dest = isAdmin ? '/admin' : '/app'
      return NextResponse.redirect(new URL(dest, request.url))
    }

    return supabaseResponse
  } catch (err) {
    // Absolute fallback — never return 500 from middleware
    console.error('[middleware] unhandled error:', err)
    const { pathname } = request.nextUrl
    if (pathname.startsWith('/app')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: ['/app/:path*', '/login', '/admin/:path*', '/admin'],
}
