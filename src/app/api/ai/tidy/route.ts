import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function detectLanguage(content: string): string {
  // More sophisticated language detection
  const lowerContent = content.toLowerCase().trim();
  
  // Common Indonesian words and phrases
  const indonesianWords = [
    'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'adalah', 'ini',
    'itu', 'saya', 'kamu', 'kami', 'mereka', 'tidak', 'bisa', 'akan', 'sudah',
    'belum', 'juga', 'lagi', 'sangat', 'lebih', 'bisa', 'harus', 'mau', 'ingin',
    'oleh', 'karena', 'jika', 'seperti', 'atau', 'tapi', 'namun', 'lalu', 'kemudian',
    'dulu', 'sekarang', 'nanti', 'kemarin', 'besok', 'hari', 'minggu', 'bulan', 'tahun',
    'saya', 'aku', 'gue', 'gw', 'kamu', 'ente', 'loe', 'lo', 'bapak', 'ibu', 'pak', 'bu',
    'selamat', 'terima', 'kasih', 'maaf', 'tolong', 'mohon', 'silahkan', 'jangan',
    'apa', 'bagaimana', 'kenapa', 'kapan', 'dimana', 'siapa', 'berapa', 'mana'
  ];
  
  // Common English words and phrases
  const englishWords = [
    'the', 'and', 'to', 'of', 'in', 'for', 'with', 'on', 'at', 'from', 'by',
    'about', 'as', 'is', 'was', 'are', 'were', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'can', 'must', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
    'we', 'they', 'it', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'our',
    'their', 'its', 'not', 'no', 'yes', 'so', 'but', 'or', 'if', 'then', 'when',
    'where', 'what', 'how', 'why', 'who', 'which', 'whose', 'whom', 'am', 'is', 'are',
    'hello', 'hi', 'hey', 'goodbye', 'bye', 'thanks', 'thank', 'please', 'sorry'
  ];

  // Indonesian-specific patterns
  const indonesianPatterns = [
    /\b(ng|ny|kh|sy)\b/gi,  // Common Indonesian consonant combinations
    /\b(saya|aku|gue|gw)\b/gi,  // First person pronouns
    /\b(kamu|ente|loe|lo)\b/gi,  // Second person pronouns
    /\b(bapak|pak|ibu|bu)\b/gi,  // Honorifics
    /\b(selamat|terima|kasih|maaf)\b/gi,  // Common phrases
    /\b(apa|bagaimana|kenapa|kapan|dimana|siapa)\b/gi,  // Question words
    /[aiueo][bcdfghjklmnpqrstvwxyz]/gi,  // Vowel-consonant patterns common in Indonesian
  ];

  // English-specific patterns
  const englishPatterns = [
    /\b(i|you|he|she|we|they)\b/gi,  // Pronouns
    /\b(hello|hi|hey|goodbye|bye|thanks|thank|please|sorry)\b/gi,  // Common phrases
    /\b(what|how|why|when|where|who|which)\b/gi,  // Question words
    /\b(am|is|are|was|were|be|been|being)\b/gi,  // To be verbs
    /\b(have|has|had|having)\b/gi,  // To have verbs
    /\th\b/gi,  // English 'th' sound
  ];

  // Count matches
  let indonesianScore = 0;
  let englishScore = 0;

  // Count word matches
  indonesianWords.forEach(word => {
    if (lowerContent.includes(word)) indonesianScore++;
  });

  englishWords.forEach(word => {
    if (lowerContent.includes(word)) englishScore++;
  });

  // Check pattern matches
  indonesianPatterns.forEach(pattern => {
    if (pattern.test(lowerContent)) indonesianScore += 2; // Weight patterns more heavily
  });

  englishPatterns.forEach(pattern => {
    if (pattern.test(lowerContent)) englishScore += 2;
  });

  // Special handling for very short texts
  if (lowerContent.split(' ').length <= 3) {
    // For very short texts, prioritize pattern matching over word counting
    if (indonesianScore > englishScore) return 'indonesian';
    if (englishScore > indonesianScore) return 'english';
    
    // If still tied, check for specific indicators
    if (/\b(hello|hi|hey)\b/gi.test(lowerContent)) return 'english';
    if (/\b(hai|halo|hai)\b/gi.test(lowerContent)) return 'indonesian';
    
    // Default to Indonesian for very short ambiguous texts
    return 'indonesian';
  }

  // For longer texts, use the scores
  if (indonesianScore > englishScore) {
    return 'indonesian';
  } else if (englishScore > indonesianScore) {
    return 'english';
  } else {
    // If tied, check for some specific indicators
    if (/\b(i|you|we|they)\b/gi.test(lowerContent)) return 'english';
    if (/\b(saya|aku|kamu|kami|mereka)\b/gi.test(lowerContent)) return 'indonesian';
    
    // Default to Indonesian
    return 'indonesian';
  }
}

function generatePrompt(content: string, language: string): string {
  if (language === 'indonesian') {
    return `Silakan perbaiki dan rapikan entri jurnal berikut agar lebih profesional dan terstruktur. Ikuti panduan ini:
    - Perbaiki kesalahan tata bahasa dan ejaan
    - Tingkatkan struktur kalimat dan alur
    - Pertahankan makna dan nada asli
    - Buat lebih ringkas namun ekspresif
    - Gunakan tanda baca dan kapitalisasi yang tepat
    - Organisir pemikiran dengan lebih baik jika perlu
    - Jangan tambahkan informasi baru atau ubah pesan inti
    
    Teks asli:
    "${content}"
    
    Kembalikan hanya versi yang diperbaiki tanpa teks atau penjelasan tambahan.`;
  } else {
    return `Please tidy up and improve the following journal entry to make it more professional and well-structured. Follow these guidelines:
    - Fix grammar and spelling errors
    - Improve sentence structure and flow
    - Maintain the original meaning and tone
    - Keep it concise but expressive
    - Use proper punctuation and capitalization
    - Organize thoughts better if needed
    - Don't add new information or change the core message
    
    Original text:
    "${content}"
    
    Return only the improved version without any additional text or explanations.`;
  }
}

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    
    if (!content || typeof content !== 'string') {
      console.error('Invalid content received:', { content });
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key check:', apiKey ? 'Key exists' : 'Key missing');
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Initialize Gemini AI
    const ai = new GoogleGenAI({});

    // Create prompt for tidying up journal content based on detected language
    const detectedLanguage = detectLanguage(content);
    const prompt = generatePrompt(content, detectedLanguage);
    
    console.log('Detected language:', detectedLanguage);
    console.log('Calling Gemini AI with content length:', content.length);

    // Generate response
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log('Gemini AI response received');

    if (!response || !response.text) {
      throw new Error('No response from AI');
    }

    return NextResponse.json({ tidiedText: response.text.trim() });
  } catch (error) {
    console.error('Error tidying text:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to process text with AI' },
      { status: 500 }
    );
  }
}
