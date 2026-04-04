-- Enfinity / Adaptive Reader — Supabase schema (run in SQL editor)

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
  last_paragraph_id TEXT,
  scroll_y INTEGER DEFAULT 0,
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES user_documents(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS reading_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES reading_sessions(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  minutes_read INTEGER DEFAULT 0,
  words_read INTEGER DEFAULT 0,
  avg_wpm REAL DEFAULT 0,
  cfs_avg REAL DEFAULT 0,
  paragraphs_completed INTEGER DEFAULT 0,
  UNIQUE (user_id, date)
);

ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_analytics ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (safe to re-run)
DROP POLICY IF EXISTS "Users see own data" ON reading_sessions;
DROP POLICY IF EXISTS "Users see own data" ON user_documents;
DROP POLICY IF EXISTS "Users see own data" ON user_highlights;
DROP POLICY IF EXISTS "Users see own data" ON reading_analytics;

-- reading_sessions
CREATE POLICY "reading_sessions_select" ON reading_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reading_sessions_insert" ON reading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reading_sessions_update" ON reading_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reading_sessions_delete" ON reading_sessions FOR DELETE USING (auth.uid() = user_id);

-- user_documents
CREATE POLICY "user_documents_select" ON user_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_documents_insert" ON user_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_documents_update" ON user_documents FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_documents_delete" ON user_documents FOR DELETE USING (auth.uid() = user_id);

-- user_highlights
CREATE POLICY "user_highlights_select" ON user_highlights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_highlights_insert" ON user_highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_highlights_update" ON user_highlights FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_highlights_delete" ON user_highlights FOR DELETE USING (auth.uid() = user_id);

-- reading_analytics
CREATE POLICY "reading_analytics_select" ON reading_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reading_analytics_insert" ON reading_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reading_analytics_update" ON reading_analytics FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reading_analytics_delete" ON reading_analytics FOR DELETE USING (auth.uid() = user_id);

