-- ==============================================================================
-- Migration: 20261123_pipeline_summary_industry_revenue_motion.sql
-- Module: RevOS Pipeline Assessment Engine - Initial Opportunity Context Summary
-- Purpose:
--   1. Adds dedicated locked classification columns (`industry`, `industry_id`,
--      `revenue_motion`, `revenue_motion_id`) to `public.pipeline_opportunity_handover_details`
--      so the Initial Opportunity Context Summary persists Industry & Revenue Motion
--      explicitly for downstream Assessment Gemini reasoning.
--   2. Backfills existing rows safely from `initial_opportunity_context`,
--      `canonical_classification`, and `public.pipeline_opportunities`.
--   3. Preserves Post-May 2026 Supabase Data API explicit GRANTs and RLS.
-- ==============================================================================

-- Step 1: Extend public.pipeline_opportunity_handover_details (Additive & Idempotent)
ALTER TABLE public.pipeline_opportunity_handover_details
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS industry_id TEXT,
  ADD COLUMN IF NOT EXISTS revenue_motion TEXT,
  ADD COLUMN IF NOT EXISTS revenue_motion_id TEXT;

CREATE INDEX IF NOT EXISTS idx_pipe_handover_industry
  ON public.pipeline_opportunity_handover_details(industry);

CREATE INDEX IF NOT EXISTS idx_pipe_handover_revenue_motion
  ON public.pipeline_opportunity_handover_details(revenue_motion);

-- Step 2: Backfill existing rows from saved initial context / canonical classification / pipeline_opportunities
UPDATE public.pipeline_opportunity_handover_details h
SET
  industry = COALESCE(
    NULLIF(BTRIM(h.industry), ''),
    NULLIF(BTRIM(h.initial_opportunity_context->>'industry'), ''),
    NULLIF(BTRIM(h.canonical_classification->'commercial_context'->>'industry_name'), ''),
    NULLIF(BTRIM(p.industry_name), '')
  ),
  industry_id = COALESCE(
    NULLIF(BTRIM(h.industry_id), ''),
    NULLIF(BTRIM(h.initial_opportunity_context->>'industry_id'), ''),
    NULLIF(BTRIM(h.canonical_classification->'commercial_context'->>'canonical_industry_id'), ''),
    NULLIF(BTRIM(p.industry_id), '')
  ),
  revenue_motion = COALESCE(
    NULLIF(BTRIM(h.revenue_motion), ''),
    NULLIF(BTRIM(h.initial_opportunity_context->>'revenue_motion'), ''),
    NULLIF(BTRIM(h.canonical_classification->'commercial_context'->>'revenue_motion_name'), ''),
    NULLIF(BTRIM(p.revenue_motion_name), '')
  ),
  revenue_motion_id = COALESCE(
    NULLIF(BTRIM(h.revenue_motion_id), ''),
    NULLIF(BTRIM(h.initial_opportunity_context->>'revenue_motion_id'), ''),
    NULLIF(BTRIM(h.canonical_classification->'commercial_context'->>'canonical_revenue_motion_id'), ''),
    NULLIF(BTRIM(p.revenue_motion_id), '')
  )
FROM public.pipeline_opportunities p
WHERE p.pipeline_id = h.pipeline_id
  AND (
    h.industry IS NULL OR BTRIM(h.industry) = ''
    OR h.industry_id IS NULL OR BTRIM(h.industry_id) = ''
    OR h.revenue_motion IS NULL OR BTRIM(h.revenue_motion) = ''
    OR h.revenue_motion_id IS NULL OR BTRIM(h.revenue_motion_id) = ''
  );

-- Step 3: Post-May 2026 Supabase Data API Explicit GRANTs & RLS Policies
ALTER TABLE public.pipeline_opportunity_handover_details ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO service_role;
