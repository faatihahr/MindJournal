import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('Auth callback: Processing request', { code: !!code, next, origin })

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('Auth callback: Exchange result', { 
        hasData: !!data, 
        error: error?.message,
        session: !!data.session 
      })
      
      if (!error && data.session) {
        console.log('Auth callback: Success, redirecting to dashboard')
        // Create response with session cookies
        const response = NextResponse.redirect(`${origin}${next}`)
        
        // Set session cookies manually
        if (data.session.access_token) {
          response.cookies.set('sb-access-token', data.session.access_token, {
            path: '/',
            maxAge: data.session.expires_in || 3600,
            httpOnly: true,
            sameSite: 'lax',
          })
        }
        
        if (data.session.refresh_token) {
          response.cookies.set('sb-refresh-token', data.session.refresh_token, {
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            httpOnly: true,
            sameSite: 'lax',
          })
        }
        
        return response
      } else {
        console.log('Auth callback: Exchange failed', error)
        return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error&details=${encodeURIComponent(error?.message || 'Unknown error')}`)
      }
    } catch (err) {
      console.error('Auth callback: Exception', err)
      return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error&details=${encodeURIComponent('Unexpected error')}`)
    }
  }

  console.log('Auth callback: No code provided, redirecting to login')
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
