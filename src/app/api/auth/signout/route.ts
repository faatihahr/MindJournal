import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // First check if there's an active session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session check error:', sessionError);
    }
    
    if (session) {
      // If session exists, try to sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        return NextResponse.json(
          { error: 'Failed to sign out' },
          { status: 500 }
        );
      }
      
      console.log('Sign out successful');
    } else {
      // If no session, that's fine - user is already signed out
      console.log('No active session found - user already signed out');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sign out server error:', error);
    // Even if there's an error, we want to clear client state
    return NextResponse.json({ success: true, message: 'Client cleared' });
  }
}
