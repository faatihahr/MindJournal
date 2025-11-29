import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('Debug: Getting all entries for current user');
    
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'No authenticated user', details: userError }, { status: 401 });
    }
    
    console.log('Debug: Current user ID:', user.id);
    
    // Get all entries for this user
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('id, content, created_at, user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (entriesError) {
      console.error('Debug: Query error:', entriesError);
      return NextResponse.json({ error: 'Query failed', details: entriesError }, { status: 500 });
    }
    
    console.log('Debug: Found entries:', entries?.length || 0);
    
    // Also check if there are any entries at all (for debugging)
    const { data: allEntries, error: allEntriesError } = await supabase
      .from('entries')
      .select('id, user_id, created_at')
      .limit(5);
    
    console.log('Debug: Sample of all entries:', allEntries?.length || 0);
    
    return NextResponse.json({
      success: true,
      userId: user.id,
      userEntriesCount: entries?.length || 0,
      userEntries: entries || [],
      allEntriesSample: allEntries || [],
      errors: {
        userError,
        entriesError,
        allEntriesError
      }
    });
    
  } catch (error) {
    console.error('Debug: Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 });
  }
}
