import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('Signout: Starting server-side signout process');
    
    // Create Supabase client and sign out
    const supabase = await createClient();
    
    // First check if there's an active session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session check error:', sessionError);
    }
    
    if (session) {
      console.log('Signout: Active session found, signing out...');
      // If session exists, try to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', error);
      } else {
        console.log('Supabase sign out successful');
      }
    } else {
      console.log('Signout: No active session found - user already signed out');
    }
    
    // Create a redirect response to login page
    const response = NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
    
    // Get the current domain for cookie clearing
    const request = await import('next/headers').then(mod => mod.headers());
    const host = request.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    
    console.log(`Signout: Clearing cookies for domain: ${host}`);
    
    // Clear ALL possible Supabase auth cookies with different variations
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token', 
      'supabase.auth.token',
      'supabase.auth.refreshToken',
      'sb-auth-token',
      'sb-refresh-token',
      'sb:token',
      'sb:refresh-token',
      'supabase-auth-token',
      'supabase-refresh-token',
      'token', // This is the actual cookie name!
      'sb-vgamvohgsqczszieiaoe-auth-token', // Project-specific cookie
      'sb-vgamvohgsqczszieiaoe-refresh-token'
    ];
    
    cookiesToClear.forEach(cookieName => {
      // Clear with root path
      response.cookies.delete(cookieName);
      response.cookies.set(cookieName, '', { 
        path: '/',
        expires: new Date(0),
        maxAge: 0,
        sameSite: 'lax'
      });
      
      // For localhost, clear with localhost domain
      if (isLocalhost) {
        response.cookies.set(cookieName, '', { 
          path: '/', 
          domain: 'localhost',
          expires: new Date(0),
          maxAge: 0,
          sameSite: 'lax'
        });
        response.cookies.set(cookieName, '', { 
          path: '/', 
          domain: '.localhost',
          expires: new Date(0),
          maxAge: 0,
          sameSite: 'lax'
        });
      } else {
        // For production, clear with current domain
        const domain = host.split(':')[0]; // Remove port if present
        response.cookies.set(cookieName, '', { 
          path: '/', 
          domain: domain,
          expires: new Date(0),
          maxAge: 0,
          sameSite: 'lax'
        });
        response.cookies.set(cookieName, '', { 
          path: '/', 
          domain: `.${domain}`,
          expires: new Date(0),
          maxAge: 0,
          sameSite: 'lax'
        });
      }
    });
    
    console.log('Signout: Server-side signout completed, redirecting to login');
    
    return response;
  } catch (error) {
    console.error('Signout server error:', error);
    // Even if there's an error, still redirect to login
    return NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
  }
}
