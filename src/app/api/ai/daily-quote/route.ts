import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entries } = body;

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Entries are required' },
        { status: 400 }
      );
    }

    // Initialize Google AI
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    
    // Get today's date to ensure daily variation
    const today = new Date().toISOString().split('T')[0];
    
    // Combine recent entry content for analysis (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentEntries = entries.filter((entry: any) => 
      new Date(entry.created_at) >= sevenDaysAgo
    );
    
    const allContent = recentEntries.map((entry: any) => entry.content).join('\n\n');
    
    // Generate daily quote based on entries
    const prompt = `You are a thoughtful and inspirational quote generator for a journaling app.
Generate a personalized daily quote based on the user's recent journal entries.

TASK: Create an inspiring, personalized quote that resonates with the user's current life situation, emotions, and experiences.

CONTEXT:
- Today's date: ${today}
- User's recent journal entries from the past 7 days are provided below
- The quote should feel personal and relevant to their journey

ANALYSIS APPROACH:
- Identify dominant emotions and themes
- Recognize challenges and achievements
- Note growth areas and patterns
- Consider relationships, work, and personal development
- Adapt tone based on user's emotional state

QUOTE REQUIREMENTS:
- Length: 15-30 words (concise but meaningful)
- Tone: Supportive, encouraging, and authentic
- Style: Personalized and reflective
- Language: Match the language of the journal entries (Indonesian or English)
- Uniqueness: Use the date as a seed to generate different quotes daily

RESPONSE FORMAT: Return ONLY a JSON object with these exact keys:
{
  "quote": "The personalized inspirational quote",
  "author": "AI Personalized",
  "theme": "Main theme extracted from entries (e.g., 'growth', 'resilience', 'self-discovery')",
  "relevance": "Brief explanation of why this quote resonates with their current situation"
}

GUIDELINES:
- If user is struggling, focus on strength and resilience
- If user is growing, celebrate progress and potential
- If user is reflecting, encourage deeper insight
- If user is happy, amplify joy and gratitude
- Avoid generic platitudes - make it feel personal
- Keep it uplifting but realistic

Recent journal entries to analyze:
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
    let quoteData;
    try {
      quoteData = JSON.parse(raw);
    } catch (parseError) {
      // If JSON parsing fails, create fallback
      quoteData = {
        quote: "Every day is a new opportunity to grow and learn from your experiences.",
        author: "AI Personalized",
        theme: "growth",
        relevance: "Based on your journey of self-reflection"
      };
    }

    return NextResponse.json({
      quote: quoteData.quote,
      author: quoteData.author || "AI Personalized",
      theme: quoteData.theme || "inspiration",
      relevance: quoteData.relevance || "Personalized for your journey",
      date: today,
      entriesAnalyzed: recentEntries.length,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating daily quote:', error);
    return NextResponse.json(
      { error: 'Failed to generate quote' },
      { status: 500 }
    );
  }
}
