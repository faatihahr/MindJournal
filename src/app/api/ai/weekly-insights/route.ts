import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entries, timeframe } = body;

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Entries are required' },
        { status: 400 }
      );
    }

    // Initialize Google AI
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    
    // Combine all entry content for analysis
    const allContent = entries.map((entry: any) => entry.content).join('\n\n');
    
    // Generate AI insights based on the entries
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
"""${allContent}"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    if (!response || !response.text) {
      throw new Error('No response from AI');
    }

    const raw = response.text.trim();
    
    // Parse JSON response
    let insightsData;
    try {
      insightsData = JSON.parse(raw);
    } catch (parseError) {
      // If JSON parsing fails, return as plain text
      insightsData = {
        emotionalState: "Analysis completed",
        patterns: ["Weekly review generated"],
        recommendations: ["Continue journaling for better insights"],
        topThemes: ["Personal reflection"],
        summary: raw
      };
    }

    return NextResponse.json({
      insights: insightsData,
      timeframe,
      entriesAnalyzed: entries.length,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating weekly insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
