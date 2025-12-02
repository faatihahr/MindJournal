import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

// Export the function for direct import
export async function generateEntrySummary(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  try {
    const { entry } = await request.json();

    if (!entry || !entry.content) {
      return NextResponse.json(
        { error: 'Entry content is required' },
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

    // Analyze content to determine what kind of guidance would be most helpful
    const contentText = entry.content.toLowerCase();
    
    let guidancePrompt = '';
    let guidanceTitle = '';

    // Detect themes for personalized guidance
    if (contentText.includes('grateful') || contentText.includes('gratitude') || contentText.includes('thank') || contentText.includes('bersyukur')) {
      guidanceTitle = 'Gratitude Reflection';
      guidancePrompt = `You are a compassionate gratitude coach for a journaling app.
Analyze this single journal entry and provide personalized gratitude guidance.

TASK: Generate warm, insightful guidance that:
1. Acknowledges their gratitude expression
2. Suggests a specific gratitude practice for today
3. Provides gentle encouragement for deeper appreciation
4. Offers a small gratitude-related challenge

RESPONSE FORMAT: Return ONLY a JSON object with these exact keys:
{
  "summary": "A warm acknowledgment of their gratitude expression (1-2 sentences)",
  "courage": "An encouraging message about their gratitude practice (1 sentence)",
  "advice": ["Array of 2-3 specific gratitude practices or reflections for today"],
  "challenge": "One small gratitude challenge they can do today"
}

Guidelines:
- Be extremely supportive and encouraging
- Focus on doable, small gratitude practices
- Suggest specific actions (not just general advice)
- If entry is in Indonesian, respond in Indonesian
- If entry is in English, respond in English

Journal entry:
"""${entry.content}"""`;
    } else if (contentText.includes('work') || contentText.includes('job') || contentText.includes('career') || contentText.includes('kerja') || contentText.includes('karir')) {
      guidanceTitle = 'Work & Career Insight';
      guidancePrompt = `You are a career and wellness coach for a journaling app.
Analyze this single journal entry and provide personalized career guidance.

TASK: Generate practical career guidance that:
1. Acknowledges their work-related thoughts
2. Provides encouragement for their professional journey
3. Suggests specific work-life balance tips
4. Offers a small work-related challenge

RESPONSE FORMAT: Return ONLY a JSON object with these exact keys:
{
  "summary": "An acknowledgment of their work situation (1-2 sentences)",
  "courage": "An encouraging message about their professional journey (1 sentence)",
  "advice": ["Array of 2-3 specific work-life balance or career tips"],
  "challenge": "One small work-related action they can take today"
}

Guidelines:
- Be practical and supportive
- Focus on doable, small steps
- Suggest specific techniques
- If entry is in Indonesian, respond in Indonesian
- If entry is in English, respond in English

Journal entry:
"""${entry.content}"""`;
    } else if (contentText.includes('stress') || contentText.includes('anxious') || contentText.includes('worry') || contentText.includes('stres') || contentText.includes('cemas')) {
      guidanceTitle = 'Emotional Support';
      guidancePrompt = `You are a mental wellness supporter for a journaling app.
Analyze this single journal entry and provide gentle emotional guidance.

TASK: Generate compassionate wellness guidance that:
1. Acknowledges their emotional state with empathy
2. Provides gentle courage and support
3. Suggests specific coping techniques
4. Offers a small self-care challenge

RESPONSE FORMAT: Return ONLY a JSON object with these exact keys:
{
  "summary": "A compassionate acknowledgment of their emotional state (1-2 sentences)",
  "courage": "A gentle, supportive message of strength (1 sentence)",
  "advice": ["Array of 2-3 specific coping techniques or self-care practices"],
  "challenge": "One small, manageable self-care action for today"
}

Guidelines:
- Be extremely gentle and compassionate
- Focus on doable, small steps
- Suggest specific techniques (breathing, reflection, etc.)
- If entry is in Indonesian, respond in Indonesian
- If entry is in English, respond in English

Journal entry:
"""${entry.content}"""`;
    } else if (contentText.includes('sad') || contentText.includes('happy') || contentText.includes('angry') || contentText.includes('sedih') || contentText.includes('senang') || contentText.includes('marah')) {
      guidanceTitle = 'Emotional Check-in';
      guidancePrompt = `You are an emotional wellness guide for a journaling app.
Analyze this single journal entry and provide emotional support.

TASK: Generate thoughtful emotional guidance that:
1. Acknowledges their emotional expression
2. Provides courage for emotional processing
3. Suggests emotional wellness practices
4. Offers a small emotional awareness challenge

RESPONSE FORMAT: Return ONLY a JSON object with these exact keys:
{
  "summary": "An acknowledgment of their emotional expression (1-2 sentences)",
  "courage": "An encouraging message about emotional processing (1 sentence)",
  "advice": ["Array of 2-3 emotional wellness practices"],
  "challenge": "One small emotional awareness action for today"
}

Guidelines:
- Be supportive and validating
- Focus on emotional awareness and processing
- Suggest specific emotional practices
- If entry is in Indonesian, respond in Indonesian
- If entry is in English, respond in English

Journal entry:
"""${entry.content}"""`;
    } else {
      guidanceTitle = 'Daily Reflection';
      guidancePrompt = `You are a personal reflection guide for a journaling app.
Analyze this single journal entry and provide thoughtful daily guidance.

TASK: Generate insightful daily guidance that:
1. Summarizes their reflection
2. Provides encouragement for their awareness
3. Suggests specific reflection practices
4. Offers a small daily challenge

RESPONSE FORMAT: Return ONLY a JSON object with these exact keys:
{
  "summary": "An acknowledgment of their reflection (1-2 sentences)",
  "courage": "An encouraging message about their self-awareness (1 sentence)",
  "advice": ["Array of 2-3 specific reflection or growth practices"],
  "challenge": "One small reflection challenge for today"
}

Guidelines:
- Be thoughtful and encouraging
- Focus on self-awareness and growth
- Suggest specific practices
- If entry is in Indonesian, respond in Indonesian
- If entry is in English, respond in English

Journal entry:
"""${entry.content}"""`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: guidancePrompt,
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
    const requiredFields = ['summary', 'courage', 'advice', 'challenge'];
    const missingFields = requiredFields.filter(field => !parsed[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing fields in AI response:', missingFields);
      throw new Error('Incomplete AI response');
    }

    // Validate arrays
    if (!Array.isArray(parsed.advice) || typeof parsed.summary !== 'string') {
      throw new Error('Invalid data types in AI response');
    }

    return NextResponse.json({
      title: guidanceTitle,
      summary: parsed.summary,
      courage: parsed.courage,
      advice: parsed.advice.slice(0, 3), // Limit to 3 advice
      challenge: parsed.challenge,
      raw
    });

  } catch (error) {
    console.error('Error generating entry guidance:', error);
    return NextResponse.json(
      { error: 'Failed to generate guidance' },
      { status: 500 }
    );
  }
}
