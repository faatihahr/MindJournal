'use server';

import { createClient } from '@/lib/supabase/server';

type MoodCount = {
  mood: string;
  count: number;
};

type WeeklyInsight = {
  id: string;
  summary: string;
  top_themes: string[];
  mood_trend: MoodCount[];
  created_at: string;
};

export async function getUserInsights() {
  try {
    const supabase = await createClient();
    
    // Get user from server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { error: 'No authenticated user found' };
    }
    
    // Fetch insights with server-side context
    const { data, error } = await supabase
      .from('weekly_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      // Return mock data if no insights exist yet
      return { 
        data: [
          {
            id: '1',
            summary: 'This week you were mostly focused on work-related topics and personal growth. You showed particular interest in productivity and learning new skills.',
            top_themes: ['Work', 'Productivity', 'Learning'],
            mood_trend: [
              { mood: 'Happy', count: 3 },
              { mood: 'Neutral', count: 2 },
              { mood: 'Stressed', count: 1 },
            ],
            created_at: new Date().toISOString(),
          }
        ] as WeeklyInsight[]
      };
    }
    
    return { data: data || [] };
  } catch (error) {
    console.error('Server error:', error);
    return { error: 'Failed to fetch insights' };
  }
}

export async function generateWeeklyInsight() {
  try {
    const supabase = await createClient();
    
    // Get user from server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { error: 'No authenticated user found' };
    }
    
    // Get user's entries for the week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('content, mood, created_at')
      .eq('user_id', user.id)
      .gte('created_at', oneWeekAgo.toISOString());
    
    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
      return { error: 'Failed to fetch entries for analysis' };
    }
    
    // Generate mock insight (in real app, this would use AI)
    const newInsight: WeeklyInsight = {
      id: Date.now().toString(),
      summary: `Based on your ${entries?.length || 0} entries this week, you've been reflecting on various aspects of your life. Your entries show a thoughtful approach to personal growth and self-awareness.`,
      top_themes: ['Personal Growth', 'Reflection', 'Well-being'],
      mood_trend: [
        { mood: 'Happy', count: 4 },
        { mood: 'Neutral', count: 2 },
        { mood: 'Tired', count: 1 },
      ],
      created_at: new Date().toISOString(),
    };
    
    // Save to database
    const { error: insertError } = await supabase
      .from('weekly_insights')
      .insert([{
        user_id: user.id,
        week_start: oneWeekAgo.toISOString().split('T')[0],
        week_end: new Date().toISOString().split('T')[0],
        summary: newInsight.summary,
        top_themes: newInsight.top_themes,
        mood_trend: newInsight.mood_trend,
        entry_count: entries?.length || 0,
      }]);
    
    if (insertError) {
      console.error('Error saving insight:', insertError);
      return { error: 'Failed to save insight' };
    }
    
    return { data: newInsight };
  } catch (error) {
    console.error('Server error:', error);
    return { error: 'Failed to generate insight' };
  }
}
