'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get('code')
      const next = searchParams.get('next') ?? '/dashboard'

      console.log('Client-side auth callback: Processing', { code: !!code, next })

      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          console.log('Client-side auth callback: Result', { 
            hasData: !!data, 
            error: error?.message,
            session: !!data.session 
          })
          
          if (!error && data.session) {
            console.log('Client-side auth callback: Success, redirecting to dashboard')
            router.push(next)
            return
          } else {
            console.log('Client-side auth callback: Exchange failed', error)
            setError(error?.message || 'Unknown error')
          }
        } catch (err) {
          console.error('Client-side auth callback: Exception', err)
          setError('Unexpected error occurred')
        }
      } else {
        setError('No authorization code provided')
      }

      setLoading(false)
      
      // Redirect to login with error after a short delay
      setTimeout(() => {
        router.push(`/auth/login?error=auth_callback_error&details=${encodeURIComponent(error || 'Unknown error')}`)
      }, 2000)
    }

    handleAuthCallback()
  }, [router, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing authentication...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    )
  }

  return null
}
