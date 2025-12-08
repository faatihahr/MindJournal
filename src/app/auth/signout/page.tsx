'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performSignout = async () => {
      try {
        console.log('Signout: Starting client-side signout process');
        
        // Clear client-side storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('theme');
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('supabase.auth.refreshToken');
        }
        
        console.log('Signout: Client storage cleared');
        
        // Call the signout API to clear server-side cookies
        const response = await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('Signout: API response status:', response.status);
        
        // Redirect to login page
        console.log('Signout: Redirecting to login page');
        router.push('/auth/login');
      } catch (error) {
        console.error('Signout error:', error);
        // Fallback: redirect to login page directly
        console.log('Signout: Error occurred, fallback redirect to login');
        router.push('/auth/login');
      }
    };

    performSignout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Signing out...</p>
      </div>
    </div>
  );
}
