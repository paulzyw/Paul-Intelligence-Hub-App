-- =========================================================================
-- Migration: 20261121_pipeline_context_fields.sql
-- Module: RevOS Pipeline Assessment Engine - Pipeline Form & Opportunities
-- Description:
--   1. Adds `country`, `campaign_assignment`, `business_segment`, and
--      `product_solution` columns to `public.pipeline_form_records` and
--      `public.pipeline_opportunities` so values initially retrieved from
--      the Opportunity Qualification module can be persisted and updated
--      from the Pipeline Form.
--   2. Preserves Post-May 2026 Supabase Data API explicit GRANT permissions
--      and Row Level Security (RLS).
-- =========================================================================

-- Step 1: Add columns to public.pipeline_form_records (Additive & Non-destructive)
ALTER TABLE public.pipeline_form_records
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS campaign_assignment TEXT,
  ADD COLUMN IF NOT EXISTS business_segment TEXT,
  ADD COLUMN IF NOT EXISTS product_solution TEXT;

-- Step 2: Add columns to public.pipeline_opportunities (Additive & Non-destructive)
ALTER TABLE public.pipeline_opportunities
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS campaign_assignment TEXT,
  ADD COLUMN IF NOT EXISTS business_segment TEXT,
  ADD COLUMN IF NOT EXISTS product_solution TEXT;

-- Step 3: Post-May 2026 Supabase Data API Grants & RLS (Explicit permissions)
ALTER TABLE public.pipeline_form_records ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO service_role;

ALTER TABLE public.pipeline_opportunities ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.pipeline_opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunities TO service_role;
