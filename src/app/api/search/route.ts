import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get user from server-side session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'No authenticated user found' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const mood = searchParams.get('mood');
    const category = searchParams.get('category');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    console.log('API Search params:', { query, mood, category, dateFrom, dateTo, sortBy });

    // Build the base query
    let dbQuery = supabase
      .from('entries')
      .select(`
        *,
        categories (
          name,
          color
        )
      `, { count: 'exact' })
      .eq('user_id', user.id);

    // Apply full-text search if query is provided
    if (query.trim()) {
      // Use PostgreSQL full-text search
      dbQuery = dbQuery.or(`content.ilike.%${query}%,tags.cs.{${query}}`);
    }

    // Apply mood filter
    if (mood) {
      dbQuery = dbQuery.eq('mood', mood);
    }

    // Apply category filter
    if (category) {
      dbQuery = dbQuery.eq('categories.name', category);
    }

    // Apply date range filter
    if (dateFrom) {
      dbQuery = dbQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      dbQuery = dbQuery.lte('created_at', dateTo);
    }

    // Apply sorting
    switch (sortBy) {
      case 'relevance':
        if (query.trim()) {
          // For relevance, we'll order by a combination of text matching and recency
          dbQuery = dbQuery.order('created_at', { ascending: false });
        } else {
          dbQuery = dbQuery.order('created_at', { ascending: false });
        }
        break;
      case 'date_desc':
        dbQuery = dbQuery.order('created_at', { ascending: false });
        break;
      case 'date_asc':
        dbQuery = dbQuery.order('created_at', { ascending: true });
        break;
      case 'mood':
        dbQuery = dbQuery.order('mood', { ascending: true });
        break;
      default:
        dbQuery = dbQuery.order('created_at', { ascending: false });
    }

    // Apply pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data: entries, error, count } = await dbQuery;

    console.log('Database query result:', { entries: entries?.length, error, count });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to search entries' }, { status: 500 });
    }

    // Calculate relevance scores for search results
    let scoredEntries = entries || [];
    if (query.trim() && sortBy === 'relevance') {
      scoredEntries = scoredEntries.map(entry => {
        let score = 0;
        const queryLower = query.toLowerCase();
        
        // Score based on content matches
        const contentMatches = (entry.content.toLowerCase().match(new RegExp(queryLower, 'g')) || []).length;
        score += contentMatches * 2;
        
        // Score based on tag matches
        const tagMatches = entry.tags?.filter((tag: string) => 
          tag.toLowerCase().includes(queryLower)
        ).length || 0;
        score += tagMatches * 3;
        
        // Score based on recency (newer entries get higher scores)
        const daysSinceCreation = Math.floor((Date.now() - new Date(entry.created_at).getTime()) / (1000 * 60 * 60 * 24));
        score += Math.max(0, 10 - daysSinceCreation) * 0.5;
        
        return { ...entry, relevanceScore: score };
      });
      
      // Sort by relevance score
      scoredEntries.sort((a, b) => (b as any).relevanceScore - (a as any).relevanceScore);
    }

    return NextResponse.json({
      entries: scoredEntries,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: {
        query,
        mood,
        category,
        dateFrom,
        dateTo,
        sortBy
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Failed to search entries' }, { status: 500 });
  }
}
