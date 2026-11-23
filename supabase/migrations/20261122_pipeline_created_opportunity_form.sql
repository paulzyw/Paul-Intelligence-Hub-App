-- ==============================================================================
-- Migration: 20261122_pipeline_created_opportunity_form.sql
-- Module: RevOS Pipeline Assessment Engine - Direct Opportunity Creation Form
-- Purpose:
--   1. Adds additive columns to `public.pipeline_opportunities` and
--      `public.pipeline_form_records` to persist direct ("Created") opportunity
--      creation inputs (Commercial Model & Section A-E Initial Context).
--   2. Adds additive columns to `public.pipeline_opportunity_handover_details`
--      so directly created opportunities store their Source = 'Created',
--      raw initial context, and reserved Initial Opportunity Context Summary
--      fields in the same isolated context table used by inherited deals.
--   3. Preserves Post-May 2026 Supabase Data API explicit GRANT permissions
--      and Row Level Security (RLS).
-- ==============================================================================

-- Step 1: Extend public.pipeline_opportunities (Additive & Non-destructive)
ALTER TABLE public.pipeline_opportunities
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Inherited',
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS campaign_assignment TEXT,
  ADD COLUMN IF NOT EXISTS business_segment TEXT,
  ADD COLUMN IF NOT EXISTS product_solution TEXT,
  ADD COLUMN IF NOT EXISTS commercial_model TEXT,
  ADD COLUMN IF NOT EXISTS initial_context JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS owner_email TEXT;

CREATE INDEX IF NOT EXISTS idx_pipe_opps_source
  ON public.pipeline_opportunities(source);

-- Step 2: Extend public.pipeline_form_records (Additive & Non-destructive)
ALTER TABLE public.pipeline_form_records
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Inherited',
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS campaign_assignment TEXT,
  ADD COLUMN IF NOT EXISTS business_segment TEXT,
  ADD COLUMN IF NOT EXISTS product_solution TEXT,
  ADD COLUMN IF NOT EXISTS commercial_model TEXT,
  ADD COLUMN IF NOT EXISTS initial_context JSONB DEFAULT '{}'::jsonb;

-- Step 3: Extend public.pipeline_opportunity_handover_details for Created source
--         and Initial Opportunity Context Summary storage (Additive & Non-destructive)
ALTER TABLE public.pipeline_opportunity_handover_details
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Inherited',
  ADD COLUMN IF NOT EXISTS initial_opportunity_context JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS initial_opportunity_context_summary JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS summary_status TEXT DEFAULT 'NOT_GENERATED',
  ADD COLUMN IF NOT EXISTS summary_error TEXT,
  ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pipe_handover_source
  ON public.pipeline_opportunity_handover_details(source);

CREATE INDEX IF NOT EXISTS idx_pipe_handover_summary_status
  ON public.pipeline_opportunity_handover_details(summary_status);

-- Step 4: Backfill existing rows cleanly without mutating Created records
UPDATE public.pipeline_opportunity_handover_details
SET source = 'Inherited'
WHERE (source IS NULL OR BTRIM(source) = '')
  AND COALESCE(source_module, '') = 'RevOS_Opportunity_Qualification';

-- Step 5: Post-May 2026 Supabase Data API Explicit GRANTs & RLS Policies
ALTER TABLE public.pipeline_opportunities ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.pipeline_opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunities TO service_role;

DROP POLICY IF EXISTS "Allow anon insert on pipeline_opportunities" ON public.pipeline_opportunities;
CREATE POLICY "Allow anon insert on pipeline_opportunities"
  ON public.pipeline_opportunities FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on pipeline_opportunities" ON public.pipeline_opportunities;
CREATE POLICY "Allow anon update on pipeline_opportunities"
  ON public.pipeline_opportunities FOR UPDATE TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.pipeline_form_records ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO service_role;

ALTER TABLE public.pipeline_opportunity_handover_details ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO service_role;
