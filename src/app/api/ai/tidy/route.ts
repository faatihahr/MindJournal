import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    // In a real app, you would call an AI API here
    // For now, we'll just do some basic formatting
    const tidiedText = content
      .split('. ')
      .map(sentence => {
        if (!sentence) return '';
        return sentence.charAt(0).toUpperCase() + sentence.slice(1);
      })
      .filter(Boolean)
      .join('. ') + (content.endsWith('.') ? '' : '.');

    return NextResponse.json({ tidiedText });
  } catch (error) {
    console.error('Error tidying text:', error);
    return NextResponse.json(
      { error: 'Failed to process text' },
      { status: 500 }
    );
  }
}
