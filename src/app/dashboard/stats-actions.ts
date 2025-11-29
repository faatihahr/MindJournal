'use server';

import { createClient } from '@/lib/supabase/server';

export async function getMoodStats() {
  try {
    const supabase = await createClient();
    
    // Get user from server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { error: 'No authenticated user found' };
    }
    
    // Fetch moods data for the user
    const { data, error } = await supabase
      .from('moods')
      .select('intensity, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      return { error: 'Failed to fetch mood stats' };
    }
    
    // Calculate average intensity
    const moods = data || [];
    const averageIntensity = moods.length > 0 
      ? moods.reduce((sum, mood) => sum + mood.intensity, 0) / moods.length 
      : 0;
    
    return { 
      averageIntensity: Math.round(averageIntensity * 10) / 10, // Round to 1 decimal
      totalMoods: moods.length
    };
  } catch (error) {
    console.error('Server error:', error);
    return { error: 'Failed to fetch mood stats' };
  }
}
