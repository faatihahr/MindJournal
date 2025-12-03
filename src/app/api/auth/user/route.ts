import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get user from server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'No authenticated user found' }, { status: 401 });
    }
    
    // Get user metadata for name if available
    // Priority: user_metadata.name > user_metadata.full_name > email prefix > 'User'
    let userName = 'User';
    
    if (user.user_metadata?.name) {
      userName = user.user_metadata.name;
    } else if (user.user_metadata?.full_name) {
      userName = user.user_metadata.full_name;
    } else if (user.email) {
      // Use email prefix as fallback (e.g., "john.doe" from "john.doe@example.com")
      userName = user.email.split('@')[0];
      // Capitalize first letter
      userName = userName.charAt(0).toUpperCase() + userName.slice(1);
    }
    
    return NextResponse.json({
      email: user.email,
      name: userName
    });
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}
