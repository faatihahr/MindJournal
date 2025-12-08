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

    // If still tied, check for some specific indicators
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

function generatePrompt(content: string, language: string, style: string): string {
  // Define style-specific instructions
  const styleInstructions = {
    professional: language === 'indonesian'
      ? `Rapikan teks menjadi gaya profesional dan terstruktur - gunakan bahasa formal, struktur kalimat yang jelas, dan nada yang netral.`
      : `Make the text professional and well-structured - use formal language, clear sentence structure, and neutral tone.`,
    casual: language === 'indonesian'
      ? `Buat teks lebih kasual dan santai - gunakan kata-kata sehari-hari, singkatan yang umum, nada yang hangat seperti obrolan dengan teman dekat.`
      : `Make the text more casual and conversational - use everyday words, common contractions, and warm tone like chatting with a close friend.`,
    creative: language === 'indonesian'
      ? `Transformasi teks menjadi lebih kreatif dan ekspresif - tambahkan metafora, deskripsi yang hidup, bahasa yang lebih imajinatif sambil tetap mempertahankan esensi asli.`
      : `Transform the text into something more creative and expressive - add metaphors, vivid descriptions, and imaginative language while keeping the original essence intact.`,
    formal: language === 'indonesian'
      ? `Buat teks menggunakan gaya formal yang sangat resmi - gunakan kosakata yang akademis, struktur yang kompleks, dan bahasa yang sangat sopan.`
      : `Write in a highly formal, academic style - use sophisticated vocabulary, complex sentence structures, and very polite language.`,
    friendly: language === 'indonesian'
      ? `Buat teks hangat dan mendukung seperti saran dari teman baik - gunakan bahasa yang ramah, empati, dan nada yang memberikan dukungan dan motivasi.`
      : `Write in a warm and supportive tone like encouragement from a close friend or mentor - use friendly language, empathy, and supportive, motivational tone.`
  };

  const styleInstruction = styleInstructions[style as keyof typeof styleInstructions] || styleInstructions.professional;

  if (language === 'indonesian') {
    return `Silakan rapikan dan perbaiki entri jurnal berikut sesuai dengan gaya yang diminta. Ikuti panduan ini:
    - ${styleInstruction}
    - Perbaiki kesalahan tata bahasa dan ejaan
    - Tingkatkan struktur kalimat dan alur
    - Pertahankan makna dan psan inti
    - Buat lebih ringkas namun tetap ekspresif
    - Jangan tambahkan informasi baru yang tidak ada di teks asli

    Teks asli:
    "${content}"

    Kembalikan hanya versi yang diperbaiki tanpa teks atau penjelasan tambahan.`;
  } else {
    return `Please tidy up and improve the following journal entry in the requested style. Follow these guidelines:
    - ${styleInstruction}
    - Fix grammar and spelling errors
    - Improve sentence structure and flow
    - Maintain the original meaning and core message
    - Keep it concise but expressive
    - Don't add new information not present in the original text

    Original text:
    "${content}"

    Return only the improved version without any additional text or explanations.`;
  }
}

export async function POST(request: Request) {
  try {
    const { content, style = 'professional' } = await request.json();

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

    // Create prompt for tidying up journal content based on detected language and style
    const detectedLanguage = detectLanguage(content);
    const availableStyles = ['professional', 'casual', 'creative', 'formal', 'friendly'];
    const validStyle = availableStyles.includes(style) ? style : 'professional';
    const prompt = generatePrompt(content, detectedLanguage, validStyle);

    console.log('Detected language:', detectedLanguage);
    console.log('Selected style:', validStyle);
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
