import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Create a response
    const response = NextResponse.json({ success: true });
    
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
      // Try multiple variations to ensure deletion
      response.cookies.delete(cookieName);
      response.cookies.set(cookieName, '', { 
        path: '/',
        expires: new Date(0),
        maxAge: 0,
        sameSite: 'lax'
      });
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
    });
    
    console.log('Server-side sign out: All cookies cleared aggressively');
    
    return response;
  } catch (error) {
    console.error('Sign out server error:', error);
    return NextResponse.json({ success: true });
  }
}
