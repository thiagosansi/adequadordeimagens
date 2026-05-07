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

    if (!user && pathname.startsWith('/app')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/app', request.url))
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
  matcher: ['/app/:path*', '/login'],
}
