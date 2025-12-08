import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Create a response
    const response = NextResponse.json({ success: true });
    
    // Get the current domain for cookie clearing
    const request = await import('next/headers').then(mod => mod.headers());
    const host = request.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    
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
    
    console.log(`Server-side sign out: All cookies cleared for domain: ${host}`);
    
    return response;
  } catch (error) {
    console.error('Sign out server error:', error);
    return NextResponse.json({ success: true });
  }
}
