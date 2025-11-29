'use server';

import { createClient } from '@/lib/supabase/server';

export async function getUserEntries() {
  try {
    const supabase = await createClient();
    
    // Get user from server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { error: 'No authenticated user found' };
    }
    
    // Fetch entries with server-side context
    const { data, error } = await supabase
      .from('entries')
      .select(`
        *,
        categories (
          name,
          color
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      return { error: 'Failed to fetch entries' };
    }
    
    return { data: data || [] };
  } catch (error) {
    console.error('Server error:', error);
    return { error: 'Failed to fetch entries' };
  }
}
