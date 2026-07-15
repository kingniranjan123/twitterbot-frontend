import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res }, {
        supabaseUrl: 'https://tmosrdszzpgfdbexstbu.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtb3NyZHN6enBnZmRiZXhzdGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTQ3NTMyOSwiZXhwIjoyMDU1MDUxMzI5fQ.cUiNxjRcnwuelk9XHbRiRgpL88U43OBJbum82vnQlk8'
    })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    const { pathname } = req.nextUrl

    // Allow auth routes
    if (pathname.startsWith('/auth')) {
        if (session) {
            return NextResponse.redirect(new URL('/', req.url))
        }
        return res
    }

    // Protect other routes
    if (!session) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    return res
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - auth (Allow auth routes)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
