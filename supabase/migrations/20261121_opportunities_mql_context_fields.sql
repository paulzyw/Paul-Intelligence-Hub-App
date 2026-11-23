-- =========================================================================
-- Migration: 20261121_opportunities_mql_context_fields.sql
-- Description:
--   1. Adds `country`, `campaign_assignment`, `business_segment`, and
--      `product_solution` columns to `public.opportunities` and
--      `public.opportunity_form_records` so values retrieved from the MQL
--      Qualification module can be persisted and updated from the
--      Opportunity Form in the SQL Qualification module.
--   2. Preserves Post-May 2026 Supabase Data API explicit GRANT permissions.
-- =========================================================================

-- Step 1: Add columns to public.opportunities (Additive & Non-destructive)
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS campaign_assignment TEXT,
  ADD COLUMN IF NOT EXISTS business_segment TEXT,
  ADD COLUMN IF NOT EXISTS product_solution TEXT;

-- Step 2: Add columns to public.opportunity_form_records if present
ALTER TABLE public.opportunity_form_records
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS campaign_assignment TEXT,
  ADD COLUMN IF NOT EXISTS business_segment TEXT,
  ADD COLUMN IF NOT EXISTS product_solution TEXT;

-- Step 3: Post-May 2026 Supabase Data API Grants (Explicit permissions)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO service_role;

GRANT SELECT ON public.opportunity_form_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_form_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_form_records TO service_role;
