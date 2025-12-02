import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

// Export the function for direct import
export async function generateSummary(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  try {
    const { entries, summaryType = 'weekly' } = await request.json();

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
      `Entry ${index + 1} (${new Date(entry.created_at).toLocaleDateString()}): ${entry.content} (Mood: ${entry.mood || 'Neutral'})`
    ).join('\n\n');

    // Analyze content to determine what kind of summary would be most helpful
    const contentText = entries.map(e => e.content.toLowerCase()).join(' ');
    
    let summaryPrompt = '';
    let summaryTitle = '';

    // Detect themes for personalized advice
    if (contentText.includes('grateful') || contentText.includes('gratitude') || contentText.includes('thank')) {
      summaryTitle = 'Gratitude Practice Guidance';
      summaryPrompt = `You are a compassionate gratitude coach for a journaling app.
Analyze the following journal entries and provide personalized gratitude practice guidance.

TASK: Generate warm, actionable guidance that:
1. Acknowledges their gratitude patterns
2. Suggests specific gratitude exercises
3. Provides gentle encouragement for deeper practice
4. Offers practical tips for maintaining gratitude habit

RESPONSE FORMAT: Return ONLY a JSON object with these exact keys:
{
  "title": "Brief title for the guidance",
  "summary": "A warm acknowledgment of their gratitude practice (1-2 paragraphs)",
  "recommendations": ["Array of 3-4 specific, actionable gratitude exercises or practices"],
  "encouragement": "A motivational message to continue their gratitude journey",
  "nextStep": "One specific action they can take today"
}

Guidelines:
- Be extremely supportive and encouraging
- Focus on practical, doable suggestions
- Suggest specific exercises (not just general advice)
- If entries are in Indonesian, respond in Indonesian
- If entries are in English, respond in English

Journal entries to analyze:
"""${entriesText}"""`;
    } else if (contentText.includes('work') || contentText.includes('job') || contentText.includes('career')) {
      summaryTitle = 'Career & Work-Life Balance Advice';
      summaryPrompt = `You are a career and wellness coach for a journaling app.
Analyze the following journal entries and provide personalized career guidance.

TASK: Generate practical career advice that:
1. Identifies work-related challenges and strengths
2. Suggests specific work-life balance strategies
3. Provides actionable career development tips
4. Offers stress management techniques for work

RESPONSE FORMAT: Return ONLY a JSON object with these exact keys:
{
  "title": "Brief title for the guidance",
  "summary": "An acknowledgment of their work situation (1-2 paragraphs)",
  "recommendations": ["Array of 3-4 specific work-life balance or career strategies"],
  "encouragement": "A motivational message about their professional journey",
  "nextStep": "One specific action they can take this week for work improvement"
}

Guidelines:
- Be practical and realistic with suggestions
- Balance professional advice with personal wellness
- Suggest specific techniques (not just general advice)
- If entries are in Indonesian, respond in Indonesian
- If entries are in English, respond in English

Journal entries to analyze:
"""${entriesText}"""`;
    } else if (contentText.includes('stress') || contentText.includes('anxious') || contentText.includes('worry')) {
      summaryTitle = 'Emotional Wellness Support';
      summaryPrompt = `You are a mental wellness supporter for a journaling app.
Analyze the following journal entries and provide gentle emotional wellness guidance.

TASK: Generate compassionate wellness advice that:
1. Acknowledges their emotional struggles with empathy
2. Suggests specific coping techniques
3. Provides self-care recommendations
4. Offers gentle encouragement and support

RESPONSE FORMAT: Return ONLY a JSON object with these exact keys:
{
  "title": "Brief title for the guidance",
  "summary": "A compassionate acknowledgment of their emotional state (1-2 paragraphs)",
  "recommendations": ["Array of 3-4 specific coping techniques or self-care practices"],
  "encouragement": "A gentle, supportive message of hope and strength",
  "nextStep": "One small, manageable self-care action for today"
}

Guidelines:
- Be extremely gentle and compassionate
- Focus on doable, small steps
- Suggest specific techniques (breathing, journaling prompts, etc.)
- If entries are in Indonesian, respond in Indonesian
- If entries are in English, respond in English

Journal entries to analyze:
"""${entriesText}"""`;
    } else {
      summaryTitle = 'Personal Growth Guidance';
      summaryPrompt = `You are a personal growth coach for a journaling app.
Analyze the following journal entries and provide personalized growth guidance.

TASK: Generate insightful growth advice that:
1. Identifies patterns in their personal development
2. Suggests specific growth opportunities
3. Provides practical self-improvement tips
4. Encourages continued self-reflection

RESPONSE FORMAT: Return ONLY a JSON object with these exact keys:
{
  "title": "Brief title for the guidance",
  "summary": "An acknowledgment of their growth journey (1-2 paragraphs)",
  "recommendations": ["Array of 3-4 specific personal growth practices or exercises"],
  "encouragement": "A motivational message about their personal development",
  "nextStep": "One specific growth action they can take this week"
}

Guidelines:
- Focus on practical growth opportunities
- Suggest specific exercises or practices
- Be encouraging and forward-looking
- If entries are in Indonesian, respond in Indonesian
- If entries are in English, respond in English

Journal entries to analyze:
"""${entriesText}"""`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: summaryPrompt,
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
    const requiredFields = ['title', 'summary', 'recommendations', 'encouragement', 'nextStep'];
    const missingFields = requiredFields.filter(field => !parsed[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing fields in AI response:', missingFields);
      throw new Error('Incomplete AI response');
    }

    // Validate arrays
    if (!Array.isArray(parsed.recommendations) || typeof parsed.summary !== 'string') {
      throw new Error('Invalid data types in AI response');
    }

    return NextResponse.json({
      title: parsed.title,
      summary: parsed.summary,
      recommendations: parsed.recommendations.slice(0, 4), // Limit to 4 recommendations
      encouragement: parsed.encouragement,
      nextStep: parsed.nextStep,
      summaryType,
      raw
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
