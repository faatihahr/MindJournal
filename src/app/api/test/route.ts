import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('Test API: Starting...');
    
    const supabase = await createClient();
    console.log('Test API: Supabase client created');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Test API: User check result:', { user: user?.id, error: userError });
    
    if (userError || !user) {
      console.error('Test API: No user found:', userError);
      return NextResponse.json({ error: 'No authenticated user', details: userError }, { status: 401 });
    }
    
    // Test simple query
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('id, content')
      .eq('user_id', user.id)
      .limit(1);
    
    console.log('Test API: Entries query result:', { entries: entries?.length, error: entriesError });
    
    if (entriesError) {
      console.error('Test API: Query error:', entriesError);
      return NextResponse.json({ error: 'Query failed', details: entriesError }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      user: user.id, 
      entriesCount: entries?.length || 0 
    });
    
  } catch (error) {
    console.error('Test API: Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 });
  }
}
