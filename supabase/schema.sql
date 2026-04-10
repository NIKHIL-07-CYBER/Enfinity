-- ═══════════════════════════════════════════════════════════════════
-- Enfinity Adaptive Reader — Supabase Schema
-- Run this in the Supabase SQL Editor to set up all tables and RLS.
-- ═══════════════════════════════════════════════════════════════════

-- Reading sessions: tracks each reading session with duration, speed, etc.
CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_title TEXT,
  document_id UUID,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  total_duration_seconds INTEGER DEFAULT 0,
  paragraphs_read INTEGER DEFAULT 0,
  avg_wpm REAL DEFAULT 0,
  struggled_terms TEXT[] DEFAULT '{}',
  last_paragraph_id TEXT,
  scroll_y INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User documents: stores uploaded documents for cross-device sync
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_filename TEXT,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  paragraph_count INTEGER DEFAULT 0,
  summary TEXT,
  summary_start_paragraph INTEGER DEFAULT 0,
  summary_end_paragraph INTEGER DEFAULT -1,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ
);

-- User highlights: saved selections, annotations, and notes
CREATE TABLE IF NOT EXISTS user_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES user_documents(id) ON DELETE CASCADE,
  paragraph_id TEXT NOT NULL,
  word_index INTEGER,
  original_text TEXT NOT NULL,
  highlight_color TEXT,
  translation TEXT,
  definition TEXT,
  pronunciation TEXT,
  note_content TEXT,
  folder TEXT DEFAULT 'Unsorted',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reading analytics: daily aggregated reading metrics
CREATE TABLE IF NOT EXISTS reading_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES reading_sessions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  minutes_read INTEGER DEFAULT 0,
  words_read INTEGER DEFAULT 0,
  avg_wpm REAL DEFAULT 0,
  cfs_avg REAL DEFAULT 0,
  paragraphs_completed INTEGER DEFAULT 0
);

-- ═══════════════════════════════════════════════════════════════════
-- Row Level Security — each user can only access their own data
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_analytics ENABLE ROW LEVEL SECURITY;

-- Policies: users see and manage only their own rows
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users see own sessions') THEN
    CREATE POLICY "Users see own sessions" ON reading_sessions
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users see own documents') THEN
    CREATE POLICY "Users see own documents" ON user_documents
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users see own highlights') THEN
    CREATE POLICY "Users see own highlights" ON user_highlights
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users see own analytics') THEN
    CREATE POLICY "Users see own analytics" ON reading_analytics
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Indexes for performance
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_sessions_user ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON reading_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_user ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user ON user_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_doc ON user_highlights(document_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON reading_analytics(user_id, date DESC);
