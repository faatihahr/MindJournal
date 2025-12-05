import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

const PREDEFINED_TAGS = [
  'Work',
  'Personal', 
  'Ideas',
  'Goals',
  'Reflection'
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

    const predefinedTagsList = PREDEFINED_TAGS.map(tag => `"${tag}"`).join(', ');

    const prompt = `You are a content tagging assistant for a journaling app. The journal entries may be in Indonesian or English.
Analyze the following journal entry and suggest relevant tags.

RULES:
1. Select ONLY from these predefined tags: ${predefinedTagsList}
2. Maximum 3 tags per entry
3. Tags must be relevant to the content
4. Return ONLY a JSON array, no explanation
5. If no predefined tags match, return an empty array []

Consider these patterns for tag selection (including Indonesian keywords):
- "Work": Job, career, office, projects, meetings, deadlines, colleagues, "project", "kerja", "kantor", "deadline", "tim", "kelompok", "pekerjaan", "profesi", "rapat", "klien", "tugas", "presentasi", "error", "perubahan", "masalah"
- "Personal": Family, friends, relationships, daily life, health, emotions, "keluarga", "teman", "hubungan", "kesehatan", "perasaan", "pribadi", "kehidupan", "asmara", "cinta", "rumah", "sakit", "badan", "meriang", "gigi"
- "Ideas": Creative thoughts, innovations, brainstorming, concepts, inspiration, "ide", "pikiran", "inspirasi", "konsep", "kreativitas", "inovasi", "brainstorming", "gagasan"
- "Goals": Plans, targets, achievements, milestones, resolutions, ambitions, "tujuan", "target", "rencana", "ambisi", "sasaran", "impian", "cita-cita", "prestasi"
- "Reflection": Self-analysis, learning, growth, memories, experiences, "refleksi", "pembelajaran", "pengalaman", "kenangan", "introspeksi", "evaluasi diri", "pertumbuhan", "pelajaran"

IMPORTANT: If content mentions "project", "error", "kerja", "deadline", "tim", "kelompok" - prioritize WORK tag.
If content mentions health issues like "sakit", "gigi", "badan", "meriang" - prioritize PERSONAL tag.
Consider multiple relevant tags, not just Personal.

EXAMPLES FOR REFERENCE:
- "Duh hari ini cape banget, banyak yang bikin pusing. Banyak perubahan di project aku dan errornya pun banyak" → ["Work", "Personal"]
- "Gigi gue sakit bgt anjir dari kemarin. Mana badan meriang gara-gara ujan" → ["Personal"]
- "Baru dapet ide brilian untuk project kerjaan" → ["Work", "Ideas"]

Journal entry:
"""${content}"""

Return format: ["Work", "Personal", "Ideas"]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    if (!response || !response.text) {
      throw new Error('No response from AI');
    }

    const raw = response.text.trim();
    
    let suggestedTags: string[] = [];
    try {
      const parsed = JSON.parse(raw.replace(/```json/gi, '').replace(/```/g, '').trim());
      if (Array.isArray(parsed)) {
        suggestedTags = parsed.filter(tag => 
          typeof tag === 'string' && 
          PREDEFINED_TAGS.includes(tag.trim())
        ).slice(0, 3);
      }
    } catch (e) {
      // If parsing fails, try to extract tags manually
      const tagMatches = raw.match(/\b(Work|Personal|Ideas|Goals|Reflection)\b/gi);
      if (tagMatches) {
        suggestedTags = [...new Set(tagMatches.map(tag => 
          tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()
        ))].slice(0, 3);
      }
    }

    return NextResponse.json({
      suggestedTags,
      predefinedTags: PREDEFINED_TAGS,
      raw
    });

  } catch (error) {
    console.error('Error generating tags:', error);
    return NextResponse.json(
      { error: 'Failed to generate tags' },
      { status: 500 }
    );
  }
}
