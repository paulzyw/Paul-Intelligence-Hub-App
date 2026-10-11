-- ==============================================================================
-- Migration: 20261011_sql_opportunity_promotions.sql
-- Description: Dedicated table to track SQL promoted to Opportunity status in Supabase
-- Standards: Supabase Data API Access (Explicit GRANTs and Row Level Security)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sql_opportunity_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT,
  opportunity_id TEXT,
  status TEXT DEFAULT 'Promoted',
  promoted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  promoted_by TEXT DEFAULT 'Sales Representative',
  notes TEXT DEFAULT 'Promoted via RevOS Opportunity Qualification Engine',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_sql_opportunity_promotions_opp UNIQUE (opportunity_id)
);

-- Indexes for ultra-fast lookup across all production environments
CREATE INDEX IF NOT EXISTS idx_sql_opp_promotions_lead_id ON public.sql_opportunity_promotions(lead_id);
CREATE INDEX IF NOT EXISTS idx_sql_opp_promotions_opp_id ON public.sql_opportunity_promotions(opportunity_id);

-- Explicit GRANT access for Data API (Post-May 2026 Supabase Requirement)
GRANT SELECT ON public.sql_opportunity_promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sql_opportunity_promotions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sql_opportunity_promotions TO service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.sql_opportunity_promotions ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies for sql_opportunity_promotions
DROP POLICY IF EXISTS "Allow anon read on sql_opportunity_promotions" ON public.sql_opportunity_promotions;
CREATE POLICY "Allow anon read on sql_opportunity_promotions" 
  ON public.sql_opportunity_promotions FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert on sql_opportunity_promotions" ON public.sql_opportunity_promotions;
CREATE POLICY "Allow anon insert on sql_opportunity_promotions" 
  ON public.sql_opportunity_promotions FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on sql_opportunity_promotions" ON public.sql_opportunity_promotions;
CREATE POLICY "Allow anon update on sql_opportunity_promotions" 
  ON public.sql_opportunity_promotions FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated full access to sql_opportunity_promotions" ON public.sql_opportunity_promotions;
CREATE POLICY "Allow authenticated full access to sql_opportunity_promotions" 
  ON public.sql_opportunity_promotions FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service_role full access to sql_opportunity_promotions" ON public.sql_opportunity_promotions;
CREATE POLICY "Allow service_role full access to sql_opportunity_promotions" 
  ON public.sql_opportunity_promotions FOR ALL TO service_role USING (true);
