-- =========================================================================
-- REVOS CONTENT AUTHOR ENHANCEMENT MIGRATION
-- Migration: 20261103_add_author_to_posts.sql
-- Description:
--   1. Adds `author_id` and `author` columns to `public.posts` table with 
--      default value 'Paul Wang'.
--   2. Backfills all existing insight articles and blog posts with author 'Paul Wang'.
--   3. Maintains compatibility with Supabase Post-May 2026 Data API permissions.
-- =========================================================================

-- Step 1: Add author_id and author columns to public.posts (Additive & Non-destructive)
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS author_id TEXT DEFAULT 'Paul Wang',
  ADD COLUMN IF NOT EXISTS author TEXT DEFAULT 'Paul Wang';

-- Step 2: Backfill all existing records to 'Paul Wang'
UPDATE public.posts 
SET 
  author_id = COALESCE(NULLIF(author_id, ''), 'Paul Wang'),
  author = COALESCE(NULLIF(author, ''), 'Paul Wang')
WHERE author_id IS NULL OR author_id = '' OR author IS NULL OR author = '';

-- Step 3: Create index on author_id for fast queries
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);

-- Step 4: Post-May 2026 Supabase Data API Grants (Explicit permissions)
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO service_role;
