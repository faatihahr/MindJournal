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
    
    console.log('Raw moods data:', data);
    
    if (error) {
      console.error('Database error:', error);
      return { error: 'Failed to fetch mood stats' };
    }
    
    // Calculate average intensity
    const moods = data || [];
    console.log('Processed moods:', moods);
    console.log('Number of moods:', moods.length);
    
    if (moods.length > 0) {
      const intensities = moods.map(mood => mood.intensity);
      console.log('All intensities:', intensities);
      
      const sum = moods.reduce((sum, mood) => sum + mood.intensity, 0);
      const averageIntensity = sum / moods.length;
      
      console.log('Sum of intensities:', sum);
      console.log('Calculated average:', averageIntensity);
      console.log('Rounded average:', Math.round(averageIntensity * 10) / 10);
      
      return { 
        averageIntensity: Math.round(averageIntensity * 10) / 10, // Round to 1 decimal
        totalMoods: moods.length
      };
    } else {
      console.log('No mood data found');
      return { 
        averageIntensity: 0,
        totalMoods: 0
      };
    }
  } catch (error) {
    console.error('Server error:', error);
    return { error: 'Failed to fetch mood stats' };
  }
}
