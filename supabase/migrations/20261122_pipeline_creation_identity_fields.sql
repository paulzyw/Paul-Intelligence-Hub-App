-- ==============================================================================
-- Migration: 20261122_pipeline_creation_identity_fields.sql
-- Module: RevOS Pipeline Assessment Engine - Direct Opportunity Creation Form
-- Purpose:
--   1. Adds/ensures `business_segment` (TEXT) and `creation_date` (DATE) columns
--      on `public.pipeline_opportunities`, `public.pipeline_form_records`, and
--      `public.pipeline_opportunity_handover_details` to store Opportunity Identity
--      fields from the Opportunity Creation Form.
--   2. Strictly additive and idempotent; preserves all existing rows and schemas.
--   3. Maintains Post-May 2026 Supabase Data API explicit GRANT permissions and RLS.
-- ==============================================================================

-- Step 1: Extend public.pipeline_opportunities (Additive & Non-destructive)
ALTER TABLE public.pipeline_opportunities
  ADD COLUMN IF NOT EXISTS business_segment TEXT,
  ADD COLUMN IF NOT EXISTS creation_date DATE;

CREATE INDEX IF NOT EXISTS idx_pipe_opps_creation_date
  ON public.pipeline_opportunities(creation_date);

-- Step 2: Extend public.pipeline_form_records (Additive & Non-destructive)
ALTER TABLE public.pipeline_form_records
  ADD COLUMN IF NOT EXISTS business_segment TEXT,
  ADD COLUMN IF NOT EXISTS creation_date DATE;

-- Step 3: Extend public.pipeline_opportunity_handover_details (Additive & Non-destructive)
ALTER TABLE public.pipeline_opportunity_handover_details
  ADD COLUMN IF NOT EXISTS business_segment TEXT,
  ADD COLUMN IF NOT EXISTS creation_date DATE;

-- Step 4: Post-May 2026 Supabase Data API Explicit GRANTs & RLS Policies
ALTER TABLE public.pipeline_opportunities ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.pipeline_opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunities TO service_role;

ALTER TABLE public.pipeline_form_records ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO service_role;

ALTER TABLE public.pipeline_opportunity_handover_details ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO service_role;
