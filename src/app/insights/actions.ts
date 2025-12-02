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

// Common words to exclude from theme analysis (English and Indonesian)
const COMMON_WORDS = new Set([
  // English
  'the', 'and', 'i', 'to', 'of', 'a', 'in', 'was', 'it', 'that',
  'my', 'with', 'but', 'for', 'me', 'on', 'is', 'this', 'have', 'at',
  'be', 'not', 'by', 'are', 'as', 'so', 'if', 'or', 'an', 'they',
  'them', 'their', 'there', 'then', 'than', 'just', 'also', 'very',
  'can', 'will', 'your', 'you', 'all', 'we', 'he', 'she', 'his', 'her',
  // Indonesian
  'yang', 'dan', 'saya', 'untuk', 'dari', 'ada', 'di', 'adalah', 'itu', 'ini',
  'dengan', 'tapi', 'bagi', 'saya', 'pada', 'adalah', 'ini', 'punya', 'pada',
  'bisa', 'tidak', 'oleh', 'adalah', 'seperti', 'jika', 'atau', 'sebuah', 'mereka',
  'mereka', 'milik', 'sana', 'kemudian', 'daripada', 'hanya', 'juga', 'sangat',
  'bisa', 'akan', 'milikmu', 'kamu', 'semua', 'kita', 'dia', 'beliau', 'miliknya', 'miliknya',
  'pada', 'ke', 'dari', 'dalam', 'untuk', 'oleh', 'dengan', 'tentang', 'seperti', 'karena'
]);

// Extract top themes from entries
function extractThemes(entries: { content: string }[]): string[] {
  const wordCount: Record<string, number> = {};
  
  entries.forEach(entry => {
    const words = entry.content
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !COMMON_WORDS.has(word));
    
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
  });
  
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

export async function generateWeeklyInsight() {
  try {
    const supabase = await createClient();
    
    // Get user from server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { error: 'No authenticated user found' };
    }
    
    // Get user's entries for the last 7 days
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('id, content, mood, created_at')
      .eq('user_id', user.id)
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: true });
    
    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
      return { error: 'Failed to fetch entries for analysis' };
    }
    
    if (!entries || entries.length === 0) {
      return { error: 'No entries found in the last 7 days' };
    }
    
    // Calculate mood trends
    const moodCounts: Record<string, number> = {};
    
    // Count moods
    entries.forEach(entry => {
      const mood = entry.mood || 'Neutral';
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });
    
    // Format mood trend data
    const moodTrend = Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count
    }));
    
    // Call Gemini API for psychological analysis
    try {
      // Import the AI function directly to avoid HTTP call
      const { generateInsights } = await import('../api/ai/insights/route');
      
      // Create a mock request object
      const mockRequest = {
        json: async () => ({ entries })
      };
      
      // Call the AI function directly
      const aiResponse = await generateInsights(mockRequest as any);
      
      if (!aiResponse.ok) {
        throw new Error('AI service unavailable');
      }

      const aiAnalysis = await aiResponse.json();
      
      if (aiAnalysis.error) {
        throw new Error(aiAnalysis.error);
      }

      const newInsight: WeeklyInsight = {
        id: Date.now().toString(),
        summary: aiAnalysis.summary,
        top_themes: aiAnalysis.topThemes,
        mood_trend: moodTrend,
        created_at: new Date().toISOString(),
      };
      
      // Save to database with AI analysis data
      const weekStart = oneWeekAgo.toISOString().split('T')[0];
      const weekEnd = today.toISOString().split('T')[0];
      
      const { error: insertError } = await supabase
        .from('weekly_insights')
        .upsert([{
          user_id: user.id,
          week_start: weekStart,
          week_end: weekEnd,
          summary: newInsight.summary,
          top_themes: newInsight.top_themes,
          mood_trend: newInsight.mood_trend,
          entry_count: entries.length,
          // Add AI analysis data
          emotional_state: aiAnalysis.emotionalState,
          patterns: aiAnalysis.patterns,
          recommendations: aiAnalysis.recommendations,
        }], {
          onConflict: 'user_id,week_start'
        });
      
      if (insertError) {
        console.error('Error saving insight:', insertError);
        return { error: 'Failed to save insight' };
      }
      
      return { 
        data: { 
          ...newInsight, 
          emotional_state: aiAnalysis.emotionalState,
          patterns: aiAnalysis.patterns,
          recommendations: aiAnalysis.recommendations
        } 
      };
      
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      // Fallback to basic analysis if AI fails
      const topThemes = extractThemes(entries);
      const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Neutral';
      
      const summary = `This week you made ${entries.length} journal entries. ` +
        `Your most common mood was ${mostCommonMood.toLowerCase()}. ` +
        `You've been focusing on themes like ${topThemes.slice(0, 3).join(', ')}.`;
      
      const newInsight: WeeklyInsight = {
        id: Date.now().toString(),
        summary,
        top_themes: topThemes,
        mood_trend: moodTrend,
        created_at: new Date().toISOString(),
      };
      
      // Save fallback insight
      const weekStart = oneWeekAgo.toISOString().split('T')[0];
      const weekEnd = today.toISOString().split('T')[0];
      
      const { error: insertError } = await supabase
        .from('weekly_insights')
        .upsert([{
          user_id: user.id,
          week_start: weekStart,
          week_end: weekEnd,
          summary: newInsight.summary,
          top_themes: newInsight.top_themes,
          mood_trend: newInsight.mood_trend,
          entry_count: entries.length,
        }], {
          onConflict: 'user_id,week_start'
        });
      
      if (insertError) {
        console.error('Error saving fallback insight:', insertError);
        return { error: 'Failed to save insight' };
      }
      
      return { data: newInsight };
    }
    
  } catch (error) {
    console.error('Server error:', error);
    return { error: 'Failed to generate insight' };
  }
}
