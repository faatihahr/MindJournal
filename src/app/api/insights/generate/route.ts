import { NextResponse } from 'next/server';
import { generateWeeklyInsight } from '@/app/insights/actions';

export async function POST() {
  try {
    const result = await generateWeeklyInsight();
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
}
