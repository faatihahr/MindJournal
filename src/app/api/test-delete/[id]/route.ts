import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Test Delete API: Starting for entry:', id);
    
    const supabase = await createClient();
    console.log('Test Delete API: Supabase client created');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Test Delete API: User check result:', { user: user?.id, error: userError });
    
    if (userError || !user) {
      console.error('Test Delete API: No user found:', userError);
      return NextResponse.json({ error: 'No authenticated user', details: userError }, { status: 401 });
    }
    
    console.log('Test Delete API: User authenticated, proceeding with delete');
    
    // Test if entry exists and belongs to user
    const { data: entry, error: fetchError } = await supabase
      .from('entries')
      .select('id, user_id, content')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    console.log('Test Delete API: Entry check result:', { entry, error: fetchError });
    
    // Also check if entry exists at all (regardless of user)
    const { data: anyEntry, error: anyEntryError } = await supabase
      .from('entries')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();
    
    console.log('Test Delete API: Any entry check:', { anyEntry, error: anyEntryError });
    
    if (fetchError) {
      console.error('Test Delete API: Entry not found for user:', fetchError);
      return NextResponse.json({ 
        error: 'Entry not found or no permission', 
        details: fetchError,
        debug: {
          userId: user.id,
          entryId: id,
          anyEntry,
          anyEntryError
        }
      }, { status: 404 });
    }
    
    // Perform delete
    const { error: deleteError } = await supabase
      .from('entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    console.log('Test Delete API: Delete result:', { error: deleteError });
    
    if (deleteError) {
      console.error('Test Delete API: Delete failed:', deleteError);
      return NextResponse.json({ error: 'Delete failed', details: deleteError }, { status: 500 });
    }
    
    console.log('Test Delete API: Entry deleted successfully');
    return NextResponse.json({ success: true, deletedEntry: id });
    
  } catch (error) {
    console.error('Test Delete API: Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 });
  }
}
