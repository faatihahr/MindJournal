'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createEntry(content: string) {
  try {
    const supabase = await createClient();
    
    // Get user from server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { error: 'You must be logged in to create an entry' };
    }
    
    // Insert default categories for this user if they don't exist
    await supabase.rpc('insert_default_categories', { p_user_id: user.id });
    
    // Get the 'Personal' category ID for default
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Personal')
      .single();
    
    // Create entry with server-side user context
    const { error } = await supabase
      .from('entries')
      .insert([{ 
        user_id: user.id, 
        content,
        mood: 'neutral',
        category_id: categoryData?.id || null
      }]);
    
    if (error) {
      console.error('Database error:', error);
      return { error: 'Failed to create entry' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Server error:', error);
    return { error: 'Failed to create entry' };
  }
}
