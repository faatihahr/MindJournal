-- Upgrade Script for Smart Journal Database
-- This script adds missing tables and features to your existing entries table

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Add category_id column to entries table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE entries ADD COLUMN category_id UUID REFERENCES categories(id);
  END IF;
END $$;

-- Add tags column to entries table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entries' AND column_name = 'tags'
  ) THEN
    ALTER TABLE entries ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Create weekly_insights table
CREATE TABLE IF NOT EXISTS weekly_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary TEXT NOT NULL,
  top_themes TEXT[] DEFAULT '{}',
  mood_trend JSONB DEFAULT '[]',
  entry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Create moods table for detailed mood tracking
CREATE TABLE IF NOT EXISTS moods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE NOT NULL,
  mood VARCHAR(50) NOT NULL,
  intensity INTEGER DEFAULT 5 CHECK (intensity >= 1 AND intensity <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_insights_user_id ON weekly_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_insights_week_start ON weekly_insights(week_start);
CREATE INDEX IF NOT EXISTS idx_moods_user_id ON moods(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_entry_id ON moods(entry_id);

-- Enable RLS for new tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for weekly_insights
CREATE POLICY "Users can view own insights" ON weekly_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights" ON weekly_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON weekly_insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights" ON weekly_insights
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for moods
CREATE POLICY "Users can view own moods" ON moods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own moods" ON moods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moods" ON moods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own moods" ON moods
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to insert default categories for a user
CREATE OR REPLACE FUNCTION insert_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO categories (user_id, name, color) VALUES
    (p_user_id, 'Personal', '#6366f1'),
    (p_user_id, 'Work', '#10b981'),
    (p_user_id, 'Health', '#f59e0b'),
    (p_user_id, 'Family', '#ef4444'),
    (p_user_id, 'Learning', '#8b5cf6')
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for weekly_insights updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_weekly_insights_updated_at'
  ) THEN
    CREATE TRIGGER update_weekly_insights_updated_at BEFORE UPDATE ON weekly_insights
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create function to get user's entries count
CREATE OR REPLACE FUNCTION get_user_entries_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM entries
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add AI analysis fields to weekly_insights table
DO $$
BEGIN
  -- Add emotional_state column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'weekly_insights' AND column_name = 'emotional_state'
  ) THEN
    ALTER TABLE weekly_insights ADD COLUMN emotional_state TEXT;
  END IF;

  -- Add patterns column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'weekly_insights' AND column_name = 'patterns'
  ) THEN
    ALTER TABLE weekly_insights ADD COLUMN patterns TEXT[] DEFAULT '{}';
  END IF;

  -- Add recommendations column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'weekly_insights' AND column_name = 'recommendations'
  ) THEN
    ALTER TABLE weekly_insights ADD COLUMN recommendations TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Create indexes for new AI fields
CREATE INDEX IF NOT EXISTS idx_weekly_insights_emotional_state 
ON weekly_insights(emotional_state) WHERE emotional_state IS NOT NULL;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

SELECT 'Database upgrade complete! New tables and features added.' as message;
