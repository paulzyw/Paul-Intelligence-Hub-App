-- =========================================================================
-- Migration: 20261121_mql_leads_country_state_product.sql
-- Description:
--   1. Adds `country`, `state_province`, and `product_solution` columns to
--      `public.mql_leads` to support split Location (Country + State/Province)
--      and Product/Solution fields on New Lead and Lead Details pages.
--   2. Backfills `country` and `state_province` from legacy `location` values
--      where applicable, preserving existing `location` data.
--   3. Preserves Post-May 2026 Supabase Data API explicit grants.
-- =========================================================================

-- Step 1: Add new columns to public.mql_leads (Additive & Non-destructive)
ALTER TABLE public.mql_leads
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS state_province TEXT,
  ADD COLUMN IF NOT EXISTS product_solution TEXT;

-- Step 2: Best-effort backfill of country/state_province from legacy location column
UPDATE public.mql_leads
SET
  state_province = CASE
    WHEN POSITION(',' IN location) > 0 THEN TRIM(SPLIT_PART(location, ',', 1))
    ELSE NULL
  END,
  country = CASE
    WHEN POSITION(',' IN location) > 0 THEN TRIM(SUBSTRING(location FROM POSITION(',' IN location) + 1))
    ELSE TRIM(location)
  END
WHERE location IS NOT NULL
  AND TRIM(location) <> ''
  AND (country IS NULL OR TRIM(country) = '')
  AND (state_province IS NULL OR TRIM(state_province) = '');

-- Step 3: Post-May 2026 Supabase Data API Grants (Explicit permissions)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mql_leads TO service_role;
