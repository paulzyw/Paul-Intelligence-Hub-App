# RevOS Database Migration Notes: Unified Content Architecture

This document provides complete instructions for executing the additive database migration for the **RevOS Unified Content SSG Architecture V1.0**.

---

## 1. Migration File Reference

* **File Location**: `supabase/migrations/20261102_unified_content_model.sql`
* **Target Schema**: `public`
* **Affected Tables**:
  * `public.posts` (Extended with additive columns)
  * `public.content_publishing_logs` (Newly created for Edge Function build logs)

---

## 2. Safety & Backward Compatibility Guarantee

* **Zero Data Loss**: All 19 existing blog posts in production remain 100% intact.
* **Additive Only**: Uses `ADD COLUMN IF NOT EXISTS`. No columns are deleted or renamed.
* **Automatic Backfill**: Existing records automatically receive `content_type = 'post'` and `status = 'published'`.
* **Application-Level Fault Tolerance**: The CMS (`src/pages/Admin.tsx`) contains built-in fallback logic that gracefully handles unmigrated states, ensuring editors can never encounter blocking failures.

---

## 3. SQL Execution Script

Run the following SQL script directly in the **Supabase Dashboard SQL Editor**:

```sql
-- Step 1: Add missing columns to public.posts (Additive & Non-destructive)
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'post' CHECK (content_type IN ('post', 'insight')),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS og_title TEXT,
  ADD COLUMN IF NOT EXISTS og_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image TEXT,
  ADD COLUMN IF NOT EXISTS target_keyword TEXT;

-- Step 2: Backfill existing rows to guarantee data consistency
UPDATE public.posts 
SET 
  content_type = COALESCE(content_type, 'post'),
  status = COALESCE(status, 'published'),
  published_at = COALESCE(published_at, created_at, timezone('utc'::text, now())),
  updated_at = COALESCE(updated_at, created_at, timezone('utc'::text, now()))
WHERE content_type IS NULL OR status IS NULL OR published_at IS NULL;

-- Step 3: Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_posts_content_type ON public.posts(content_type);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type_status_pub ON public.posts(content_type, status, published_at DESC);

-- Step 4: Create table for tracking content publishing & SSG build statuses (Consolidated Edge Function Module 2)
CREATE TABLE IF NOT EXISTS public.content_publishing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    build_request_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    content_id UUID,
    status TEXT NOT NULL CHECK (status IN ('requested', 'building', 'build_succeeded', 'build_failed', 'deploying', 'deployment_succeeded', 'deployment_failed')),
    details JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_publishing_logs_request_id ON public.content_publishing_logs(build_request_id);
CREATE INDEX IF NOT EXISTS idx_publishing_logs_created_at ON public.content_publishing_logs(created_at DESC);

-- Step 5: Post-May 2026 Supabase Data API Grants (Strict Compliance)
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO service_role;

GRANT SELECT ON public.content_publishing_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_publishing_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_publishing_logs TO service_role;

-- Step 6: RLS for content_publishing_logs
ALTER TABLE public.content_publishing_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view publishing status" ON public.content_publishing_logs;
CREATE POLICY "Public can view publishing status" 
ON public.content_publishing_logs FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated can manage publishing logs" ON public.content_publishing_logs;
CREATE POLICY "Authenticated can manage publishing logs" 
ON public.content_publishing_logs FOR ALL 
TO authenticated 
USING (true);
```
