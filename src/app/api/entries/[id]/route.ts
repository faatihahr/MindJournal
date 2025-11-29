import { NextResponse } from 'next/server';
import { deleteEntry } from '@/app/entries/[id]/actions';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('API: Deleting entry:', id);
    const result = await deleteEntry(id);
    
    console.log('Delete result:', result);
    
    if (result?.error) {
      console.error('API: Delete failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    console.log('API: Entry deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
