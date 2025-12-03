import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user's journal entries from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('content, mood, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (entriesError) {
      console.error('Database error:', entriesError);
      return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({
        predictions: [],
        message: 'No journal entries found for mood prediction'
      }, { status: 200 });
    }

    // Prepare data for AI analysis
    const journalData = entries.map(entry => ({
      content: entry.content,
      mood: entry.mood,
      date: entry.created_at
    }));

    // Call AI service for mood predictions
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI mood prediction specialist. Analyze journal entries and predict mood patterns for the next 7 days.

            Mood intensity scale:
            - 9-10: Very Happy (😄)
            - 7-8: Happy (😊) 
            - 5-6: Neutral (😐)
            - 3-4: Sad (☹️)
            - 1-2: Very Sad (😭)

            Analyze the journal entries for patterns, emotional trends, stress factors, and positive indicators. 
            Consider:
            - Recent emotional patterns
            - Work/school stress cycles
            - Social interactions
            - Sleep patterns mentioned
            - Exercise/activity levels
            - Weekend vs weekday patterns

            Return predictions as JSON array with mood intensity (1-10) for each of the next 7 days, starting from tomorrow.`
          },
          {
            role: 'user',
            content: `Here are my journal entries from the last 30 days with mood data:

            ${JSON.stringify(journalData, null, 2)}

            Please predict my mood intensity (1-10) for the next 7 days. Consider patterns in my emotional state, stress levels, and any recurring themes.`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', aiResponse.statusText);
      return NextResponse.json({ error: 'Failed to generate mood predictions' }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0]?.message?.content;

    if (!aiMessage) {
      return NextResponse.json({ error: 'No predictions generated' }, { status: 500 });
    }

    // Parse AI response
    let predictions;
    try {
      // Try to extract JSON array from the response
      const jsonMatch = aiMessage.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        predictions = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create simple predictions based on recent mood average
        const recentMoods = entries.slice(-7).map(e => {
          const moodIntensity = getMoodIntensity(e.mood);
          return moodIntensity;
        });
        const avgMood = recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length;
        
        predictions = Array(7).fill(0).map((_, i) => {
          // Add some variation around the average
          const variation = (Math.random() - 0.5) * 2;
          return Math.max(1, Math.min(10, Math.round(avgMood + variation)));
        });
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json({ error: 'Failed to parse mood predictions' }, { status: 500 });
    }

    // Convert intensity values to emojis
    const moodEmojis = predictions.map((intensity: number) => {
      if (intensity >= 9) return '😄';
      if (intensity >= 7) return '😊';
      if (intensity >= 5) return '😐';
      if (intensity >= 3) return '☹️';
      return '😭';
    });

    return NextResponse.json({
      predictions: predictions,
      emojis: moodEmojis,
      confidence: calculateConfidence(entries.length, predictions),
      basedOnEntries: entries.length
    });

  } catch (error) {
    console.error('Mood prediction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getMoodIntensity(mood?: string): number {
  if (!mood) return 5; // Default to neutral
  
  const moodMap: Record<string, number> = {
    '😄': 10, // Very Happy
    '😊': 8,  // Happy
    '😐': 5,  // Neutral
    '☹️': 3,  // Sad
    '😭': 1,  // Very Sad
    '🤩': 9,  // Excited
    '😰': 2,  // Anxious
    '😠': 2,  // Angry
    '😴': 4,  // Tired
    '🥰': 9,  // Love
    '😕': 4,  // Confused
    '🙏': 7,  // Grateful
    '🌟': 8,  // Hopeful
    '😤': 3,  // Frustrated
    '😌': 6,  // Calm
    '😎': 8,  // Proud
  };
  
  return moodMap[mood] || 5;
}

function calculateConfidence(entryCount: number, predictions: number[]): number {
  // Base confidence on data availability and consistency
  let confidence = 0.5; // Base 50%
  
  // More entries = higher confidence
  if (entryCount >= 30) confidence += 0.3;
  else if (entryCount >= 14) confidence += 0.2;
  else if (entryCount >= 7) confidence += 0.1;
  
  // Consistent predictions = higher confidence
  const avg = predictions.reduce((a, b) => a + b, 0) / predictions.length;
  const variance = predictions.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / predictions.length;
  
  if (variance < 2) confidence += 0.2;
  else if (variance < 4) confidence += 0.1;
  
  return Math.min(0.95, confidence); // Cap at 95%
}
