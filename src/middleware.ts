import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_SUBDOMAIN = 'admin.adframe.com.br'
const MAIN_ORIGIN = 'https://www.adframe.com.br'

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const isAdminSubdomain = host === ADMIN_SUBDOMAIN

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('[middleware] Supabase env vars missing — url:', !!supabaseUrl, 'key:', !!supabaseKey)
      if (isAdminSubdomain || request.nextUrl.pathname.startsWith('/app')) {
        return NextResponse.redirect(new URL('/login', isAdminSubdomain ? MAIN_ORIGIN : request.url))
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
          const sharedDomain =
            process.env.NODE_ENV === 'production' ? '.adframe.com.br' : undefined
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...(sharedDomain ? { domain: sharedDomain } : {}),
            }),
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

    // ── Admin subdomain: rewrite to /admin route ───────────────────────────
    if (isAdminSubdomain) {
      // Pass through Next.js internal assets and API routes without rewriting
      if (pathname.startsWith('/_next/') || pathname.startsWith('/api/') || pathname === '/favicon.ico') {
        return supabaseResponse
      }

      if (!user) {
        return NextResponse.redirect(`${MAIN_ORIGIN}/login`)
      }
      const adminEmails = (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
      if (!adminEmails.includes(user.email ?? '')) {
        return NextResponse.redirect(`${MAIN_ORIGIN}/app`)
      }
      // Rewrite: admin.adframe.com.br/ → /admin
      //          admin.adframe.com.br/metrics → /admin/metrics
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`
      const rewriteResponse = NextResponse.rewrite(rewriteUrl)
      const sharedDomain =
        process.env.NODE_ENV === 'production' ? '.adframe.com.br' : undefined
      supabaseResponse.cookies.getAll().forEach(({ name, value, ...opts }) => {
        rewriteResponse.cookies.set({ name, value, ...opts, ...(sharedDomain ? { domain: sharedDomain } : {}) })
      })
      return rewriteResponse
    }

    // ── Standard routes ────────────────────────────────────────────────────
    if (!user && (pathname.startsWith('/app') || pathname.startsWith('/invite'))) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url))
    }

    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/app', request.url))
    }

    if (pathname.startsWith('/admin')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      const adminEmails = (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
      if (!adminEmails.includes(user.email ?? '')) {
        return NextResponse.redirect(new URL('/app', request.url))
      }
    }

    return supabaseResponse
  } catch (err) {
    // Absolute fallback — never return 500 from middleware
    console.error('[middleware] unhandled error:', err)
    const { pathname } = request.nextUrl
    if (isAdminSubdomain || pathname.startsWith('/app') || pathname.startsWith('/admin')) {
      return NextResponse.redirect(
        isAdminSubdomain ? `${MAIN_ORIGIN}/login` : new URL('/login', request.url),
      )
    }
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    // Capture all routes on the admin subdomain
    {
      source: '/(.*)',
      has: [{ type: 'host', value: 'admin\\.adframe\\.com\\.br' }],
    },
    '/app/:path*',
    '/invite/:path*',
    '/admin/:path*',
    '/admin',
    '/login',
  ],
}
