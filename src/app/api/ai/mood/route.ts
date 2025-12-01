import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

const MOODS = [
  { emoji: '🥰', label: 'very_happy' },
  { emoji: '😊', label: 'happy' },
  { emoji: '🙂', label: 'neutral' },
  { emoji: '☹️', label: 'sad' },
  { emoji: '😭', label: 'very_sad' },
  { emoji: '🤩', label: 'excited' },
  { emoji: '😰', label: 'anxious' },
  { emoji: '😡', label: 'angry' },
  { emoji: '😴', label: 'tired' },
  { emoji: '😘', label: 'love' },
  { emoji: '🤔', label: 'confused' },
  { emoji: '🙏', label: 'grateful' },
  { emoji: '🌟', label: 'hopeful' },
  { emoji: '😫', label: 'frustrated' },
  { emoji: '😌', label: 'calm' },
  { emoji: '😎', label: 'proud' },
];

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
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

    const moodOptions = MOODS.map(m => `${m.label} (${m.emoji})`).join(', ');

    const prompt = `You are a mood detection assistant for a journaling app.
Analyze the following journal entry and classify:
1. The PRIMARY emotional mood of the writer into EXACTLY ONE of these 16 options:
${moodOptions}
2. The intensity of that mood on a scale of 1-10 (where 1 = very mild, 10 = extremely intense)

Return a STRICT JSON object, no explanation, in this format:
{"label": "happy", "emoji": "😊", "intensity": 7}

Consider these factors for intensity:
- How strongly the emotions are expressed
- Use of emotional language, punctuation (!!!), or capital letters
- Length and detail of emotional descriptions
- Use of extreme words (very, extremely, totally, etc.)

Journal entry:
"""${content}"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    if (!response || !response.text) {
      throw new Error('No response from AI');
    }

    const raw = response.text.trim();

    let parsed: { label?: string; emoji?: string; intensity?: number } | null = null;
    try {
      parsed = JSON.parse(raw.replace(/```json/gi, '').replace(/```/g, '').trim());
    } catch (e) {
      parsed = null;
    }

    const fallback = { ...MOODS[0], intensity: 5 };

    if (!parsed || !parsed.label || !parsed.emoji || typeof parsed.intensity !== 'number' || parsed.intensity < 1 || parsed.intensity > 10) {
      return NextResponse.json({
        label: fallback.label,
        emoji: fallback.emoji,
        intensity: fallback.intensity,
        raw,
      });
    }

    const matched = MOODS.find(
      m => m.label.toLowerCase() === parsed!.label!.toLowerCase() || m.emoji === parsed!.emoji
    );

    const result = matched || fallback;

    return NextResponse.json({
      label: result.label,
      emoji: result.emoji,
      intensity: parsed.intensity,
      raw,
    });
  } catch (error) {
    console.error('Error detecting mood:', error);
    return NextResponse.json(
      { error: 'Failed to detect mood' },
      { status: 500 }
    );
  }
}
