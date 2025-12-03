'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

type JournalEntry = {
  id: string;
  title?: string;
  content: string;
  mood?: string;
  category_id?: string;
  categories?: {
    name: string;
    color: string;
  };
  tags?: string[];
  created_at: string;
  updated_at: string;
};

export async function getEntry(id: string) {
  try {
    const supabase = await createClient();
    
    // Get user from server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { error: 'No authenticated user found' };
    }
    
    // Fetch entry with server-side context
    const { data, error } = await supabase
      .from('entries')
      .select(`
        *,
        categories (
          name,
          color
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Database error:', error);
      if (error.code === 'PGRST116') {
        return { error: 'Entry not found' };
      }
      return { error: 'Failed to fetch entry' };
    }
    
    return { data: data as JournalEntry };
  } catch (error) {
    console.error('Server error:', error);
    return { error: 'Failed to fetch entry' };
  }
}

export async function updateEntry(id: string, title: string, content: string, mood: string, tags: string[], categoryId?: string) {
  try {
    const supabase = await createClient();
    
    // Get user from server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { error: 'No authenticated user found' };
    }
    
    // Update entry with server-side context
    const { error } = await supabase
      .from('entries')
      .update({ 
        title,
        content,
        mood,
        tags,
        category_id: categoryId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Database error:', error);
      return { error: 'Failed to update entry' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Server error:', error);
    return { error: 'Failed to update entry' };
  }
}

export async function deleteEntry(id: string) {
  try {
    console.log('Action: Deleting entry:', id);
    const supabase = await createClient();
    
    // Get user from server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Action: No authenticated user:', userError);
      return { error: 'No authenticated user found' };
    }
    
    console.log('Action: User authenticated:', user.id);
    
    // Delete entry with server-side context
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Action: Database error:', error);
      return { error: 'Failed to delete entry' };
    }
    
    console.log('Action: Entry deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Action: Server error:', error);
    return { error: 'Failed to delete entry' };
  }
}
