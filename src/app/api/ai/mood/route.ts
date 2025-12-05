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

    const ai = new GoogleGenAI({ apiKey });

    const moodOptions = MOODS.map(m => `${m.label} (${m.emoji})`).join(', ');

    const prompt = `You are a mood detection assistant for a journaling app. The journal entries may be in Indonesian or English.
Analyze the following journal entry and classify:
1. The PRIMARY emotional mood of the writer into EXACTLY ONE of these 16 options:
${moodOptions}
2. The intensity of that mood on a scale of 1-10 (where 1 = very mild, 10 = extremely intense)

IMPORTANT LANGUAGE GUIDELINES:
- Pay close attention to Indonesian emotional words and phrases. Prioritize negative emotions when present.
- Explicitly map: "capek/lelah" = tired, "pusing" = frustrated/anxious, "sedih" = sad, "marah" = angry, "senang" = happy, "bahagia" = happy, "gembira" = happy, "cemas" = anxious, "gelisah" = anxious, "kecewa" = sad, "bangga" = proud, "syukur" = grateful, "berharap" = hopeful, "tenang" = calm, "bingung" = confused, "frustrasi" = frustrated, "sakit" = tired/sad/frustrated (depending on context).
- Phrases like "capek banget", "lelah", "banyak yang bikin pusing", "errornya pun banyak", "gigi gue sakit bgt" clearly indicate TIRED, FRUSTRATED, or SAD mood. NEVER classify these as happy.
- Analyze the actual emotional content and context, not just surface-level words. If any strong negative sentiment is detected, the mood should reflect that, not a positive mood.
- Consider context: project problems, errors, deadlines = tired/frustrated; physical discomfort/illness = tired/sad/frustrated; achievements, success = happy/proud; family/friends = personal/love/grateful

Return a STRICT JSON object, no explanation, in this format:
{"label": "tired", "emoji": "😴", "intensity": 7}

Consider these factors for intensity:
- How strongly the emotions are expressed
- Use of emotional language, punctuation (!!!), or capital letters
- Length and detail of emotional descriptions
- Use of extreme words (very, extremely, totally, banget, sekali, etc.)

EXAMPLES FOR REFERENCE:
- "Duh hari ini cape banget, banyak yang bikin pusing" → tired/frustrated
- "Gigi gue sakit bgt anjir" → tired/sad  
- "Senang banget hari ini, dapat promosi" → happy/proud

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
