'use server';

import { createClient } from '@/lib/supabase/server';

export async function addCategory(name: string, color: string) {
  try {
    const supabase = await createClient();
    
    // Get user from server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { error: 'You must be logged in to add a category' };
    }
    
    // Insert category with server-side user context
    const { data, error } = await supabase
      .from('categories')
      .insert([{ 
        user_id: user.id, 
        name: name.trim(),
        color
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return { error: 'Failed to add category' };
    }
    
    return { data };
  } catch (error) {
    console.error('Server error:', error);
    return { error: 'Failed to add category' };
  }
}
