'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createEntry(title: string, content: string, mood: string, categoryId: string, tags: string[], moodIntensity: number) {
  try {
    const supabase = await createClient();
    
    // Get user from server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { error: 'You must be logged in to create an entry' };
    }
    
    // Insert default categories for this user if they don't exist
    await supabase.rpc('insert_default_categories', { p_user_id: user.id });
    
    // Get the 'Personal' category ID for default if no category provided
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Personal')
        .single();
      finalCategoryId = categoryData?.id || null;
    }
    
    // Create entry with server-side user context
    const { data: entryData, error: entryError } = await supabase
      .from('entries')
      .insert([{ 
        user_id: user.id, 
        title,
        content,
        mood,
        category_id: finalCategoryId,
        tags
      }])
      .select('id')
      .single();
    
    if (entryError) {
      console.error('Database error:', entryError);
      return { error: 'Failed to create entry' };
    }
    
    // Also save mood to moods table for tracking
    if (entryData && mood) {
      const { error: moodError } = await supabase
        .from('moods')
        .insert([{
          user_id: user.id,
          entry_id: entryData.id,
          mood,
          intensity: moodIntensity
        }]);
      
      if (moodError) {
        console.error('Error saving mood to moods table:', moodError);
        // Don't return error here since entry was created successfully
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Server error:', error);
    return { error: 'Failed to create entry' };
  }
}
