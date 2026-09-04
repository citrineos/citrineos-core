// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Server-side authentication proxy.
 *
 * Uses next-auth/jwt getToken() to validate the encrypted session cookie on
 * every matched request before any page renders or server action executes.
 * Unauthenticated requests are redirected to /login. Requests whose token
 * refresh failed (Keycloak session ended) are redirected with an error param.
 *
 * Protected: all routes except /login, /api/auth/**, /api/health, and
 * Next.js internal paths / static assets (see matcher below).
 */
export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // skip server side auth for generic auth provider
  if (
    !process.env.NEXT_PUBLIC_AUTH_PROVIDER ||
    process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'generic'
  ) {
    return NextResponse.next();
  }

  // No valid session — redirect to login
  if (!token) {
    console.debug('No token found, redirecting to /login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Token refresh failed (e.g. Keycloak SSO session expired) — force re-login
  if (token.error === 'RefreshAccessTokenError') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'SessionExpired');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     *   /login                  – the unauthenticated login page
     *   /api/auth/**            – NextAuth sign-in / callback / sign-out endpoints
     *   /api/health             – public health-check (load balancers, probes)
     *   /_next/static/**        – Next.js compiled assets
     *   /_next/image/**         – Next.js image optimisation endpoint
     *   /favicon.ico            – browser favicon
     *   /<file>.<ext>           – any root-level static file (svg, png, etc.)
     */
    '/((?!login|api/auth|api/health|_next/static|_next/image|favicon\\.ico|[^/]+\\.[^/]+$).*)',
  ],
};
