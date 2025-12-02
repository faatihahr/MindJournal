import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

// Export the function for direct import
export async function generateInsights(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  try {
    const { entries } = await request.json();

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: 'Entries array is required and cannot be empty' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({});

    // Prepare entries text for analysis
    const entriesText = entries.map((entry, index) => 
      `Entry ${index + 1} (${entry.created_at}): ${entry.content} (Mood: ${entry.mood || 'Neutral'})`
    ).join('\n\n');

    const prompt = `You are a psychological insights assistant for a journaling app.
Analyze the following journal entries from the past 7 days and provide thoughtful psychological analysis.

TASK: Generate comprehensive weekly insights including:
1. Emotional state analysis
2. Psychological patterns detected
3. Personalized recommendations
4. Thematic analysis
5. Mood trend summary

ANALYSIS APPROACH:
- Look for emotional patterns and consistency
- Identify self-awareness and reflection indicators
- Detect work-life balance patterns
- Analyze social connections and relationships
- Identify growth mindset and personal development themes
- Consider stress levels and coping mechanisms
- Note emotional diversity and adaptability

RESPONSE FORMAT: Return ONLY a JSON object with these exact keys:
{
  "emotionalState": "Brief description of user's emotional state (e.g., 'emotionally balanced', 'consistently positive', 'emotionally expressive and adaptable')",
  "patterns": ["Array of 3-4 psychological patterns detected (e.g., 'High self-awareness and self-reflection', 'Focus on relationships and social connections')"],
  "recommendations": ["Array of 2-3 personalized, actionable recommendations based on the analysis"],
  "topThemes": ["Array of 3-5 main themes extracted from entries"],
  "summary": "Comprehensive paragraph summarizing the week's psychological insights in a supportive tone"
}

GUIDELINES:
- Be supportive and constructive in analysis
- Focus on growth and self-understanding
- Provide practical, actionable recommendations
- Keep language accessible and encouraging
- Consider both positive and challenging patterns
- If entries are in Indonesian, respond in Indonesian
- If entries are in English, respond in English

Journal entries to analyze:
"""${entriesText}"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    if (!response || !response.text) {
      throw new Error('No response from AI');
    }

    const raw = response.text.trim();
    
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw.replace(/```json/gi, '').replace(/```/g, '').trim());
    } catch (e) {
      console.error('Failed to parse AI response:', raw);
      throw new Error('Invalid AI response format');
    }

    // Validate response structure
    const requiredFields = ['emotionalState', 'patterns', 'recommendations', 'topThemes', 'summary'];
    const missingFields = requiredFields.filter(field => !parsed[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing fields in AI response:', missingFields);
      throw new Error('Incomplete AI response');
    }

    // Validate arrays
    if (!Array.isArray(parsed.patterns) || !Array.isArray(parsed.recommendations) || 
        !Array.isArray(parsed.topThemes) || typeof parsed.summary !== 'string') {
      throw new Error('Invalid data types in AI response');
    }

    return NextResponse.json({
      emotionalState: parsed.emotionalState,
      patterns: parsed.patterns.slice(0, 4), // Limit to 4 patterns
      recommendations: parsed.recommendations.slice(0, 3), // Limit to 3 recommendations
      topThemes: parsed.topThemes.slice(0, 5), // Limit to 5 themes
      summary: parsed.summary,
      raw
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
