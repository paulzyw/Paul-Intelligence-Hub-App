-- =========================================================================
-- Migration: 20261121_pipeline_source_field.sql
-- Module: RevOS Pipeline Assessment Engine - Source Field Persistence
-- Description:
--   1. Adds `source` column (defaulting to 'Inherited') to
--      `public.pipeline_opportunities`, `public.pipeline_inheritance`, and
--      `public.pipeline_form_records`.
--   2. Backfills existing Pipeline records inherited from the Opportunity
--      Qualification module with 'Inherited'.
--   3. Preserves Post-May 2026 Supabase Data API explicit GRANT permissions
--      and Row Level Security (RLS).
-- =========================================================================

-- Step 1: Add `source` column to Pipeline tables (Additive & Non-destructive)
ALTER TABLE public.pipeline_opportunities
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Inherited';

ALTER TABLE public.pipeline_inheritance
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Inherited';

ALTER TABLE public.pipeline_form_records
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Inherited';

-- Step 2: Backfill existing inherited records with 'Inherited'
UPDATE public.pipeline_opportunities
SET source = 'Inherited'
WHERE (source IS NULL OR BTRIM(source) = '')
  AND (
    opportunity_id IS NOT NULL
    OR lead_id IS NOT NULL
    OR source_system = 'RevOS_Opportunity_Qualification'
    OR COALESCE(metadata->>'upstream_source', '') ILIKE '%Inheritance%'
  );

UPDATE public.pipeline_inheritance
SET source = 'Inherited'
WHERE source IS NULL OR BTRIM(source) = '';

UPDATE public.pipeline_form_records
SET source = 'Inherited'
WHERE source IS NULL OR BTRIM(source) = '';

-- Step 3: Post-May 2026 Supabase Data API Grants & RLS (Explicit permissions)
ALTER TABLE public.pipeline_opportunities ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.pipeline_opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunities TO service_role;

ALTER TABLE public.pipeline_inheritance ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.pipeline_inheritance TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_inheritance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_inheritance TO service_role;

ALTER TABLE public.pipeline_form_records ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO service_role;
