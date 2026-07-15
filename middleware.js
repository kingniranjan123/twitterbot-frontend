import { NextResponse } from 'next/server'

export async function middleware(req) {
    const res = NextResponse.next()
    
    // Check for the simple auth_token cookie set by the login page
    const hasAuthToken = req.cookies.has('auth_token')
    
    const { pathname } = req.nextUrl

    // Allow auth routes
    if (pathname.startsWith('/auth')) {
        if (hasAuthToken) {
            return NextResponse.redirect(new URL('/', req.url))
        }
        return res
    }

    // Protect other routes
    if (!hasAuthToken) {
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
