import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip middleware for static files and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    
    console.log(`Middleware: ${request.nextUrl.pathname} - Session: ${session ? 'exists' : 'none'}`);

    // Skip middleware for sign out page to allow it to process
    if (request.nextUrl.pathname === '/auth/signout') {
      console.log('Middleware: Skipping signout page');
      return response;
    }

    // If user is not signed in and trying to access protected routes
    if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
      console.log('Middleware: No session, redirecting to login from dashboard');
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If user is signed in and trying to access auth pages (except signout)
    if (session && request.nextUrl.pathname.startsWith('/auth') && request.nextUrl.pathname !== '/auth/signout') {
      console.log('Middleware: User has session, redirecting from auth to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Additional check: if accessing login page with session, redirect to dashboard
    if (session && request.nextUrl.pathname === '/auth/login') {
      console.log('Middleware: User has session on login page, redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Allow access to insights page if authenticated
    if (session && (request.nextUrl.pathname === '/insights' || request.nextUrl.pathname.startsWith('/entries'))) {
      // Allow access to insights and entries pages
      return response;
    }
  } catch (error) {
    console.error('Middleware error:', error);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
