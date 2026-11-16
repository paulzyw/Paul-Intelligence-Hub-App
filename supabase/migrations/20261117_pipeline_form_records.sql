-- ==============================================================================
-- Migration: 20261117_pipeline_form_records.sql
-- Module: RevOS Pipeline Assessment Engine - Pipeline Form
-- Purpose: Dedicated and isolated Supabase persistence for Pipeline Form edits
--          without mutating upstream Opportunity Qualification or SQL tables.
-- Standards: Post-May 2026 Supabase Data API explicit GRANTs and Row Level Security (RLS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.pipeline_form_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id TEXT NOT NULL UNIQUE REFERENCES public.pipeline_opportunities(pipeline_id) ON DELETE CASCADE,
  opportunity_id TEXT,
  lead_id TEXT,
  company_name TEXT NOT NULL,
  opportunity_name TEXT NOT NULL,
  opportunity_owner TEXT DEFAULT 'Senior Enterprise AE',
  opportunity_stage TEXT DEFAULT 'Emerging Opportunity',
  estimated_revenue TEXT DEFAULT '$0',
  currency_symbol TEXT DEFAULT '$',
  deal_value NUMERIC DEFAULT 0,
  pipeline_stage TEXT DEFAULT 'Qualification',
  expected_close_date DATE,
  industry TEXT,
  revenue_motion TEXT,
  form_status TEXT DEFAULT 'Saved',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipe_form_records_pipeline_id
  ON public.pipeline_form_records(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipe_form_records_opp_id
  ON public.pipeline_form_records(opportunity_id);

-- Explicit Data API Permissions (Post-May 2026 Supabase Standard)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_form_records TO service_role;

ALTER TABLE public.pipeline_form_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon full access on pipeline_form_records" ON public.pipeline_form_records;
CREATE POLICY "Allow anon full access on pipeline_form_records"
  ON public.pipeline_form_records FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access on pipeline_form_records" ON public.pipeline_form_records;
CREATE POLICY "Allow authenticated full access on pipeline_form_records"
  ON public.pipeline_form_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access on pipeline_form_records" ON public.pipeline_form_records;
CREATE POLICY "Allow service_role full access on pipeline_form_records"
  ON public.pipeline_form_records FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Ensure pipeline_opportunities allows pipeline-level updates from Pipeline Form
GRANT SELECT, INSERT, UPDATE ON public.pipeline_opportunities TO anon;

DROP POLICY IF EXISTS "Allow anon insert on pipeline_opportunities" ON public.pipeline_opportunities;
CREATE POLICY "Allow anon insert on pipeline_opportunities"
  ON public.pipeline_opportunities FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on pipeline_opportunities" ON public.pipeline_opportunities;
CREATE POLICY "Allow anon update on pipeline_opportunities"
  ON public.pipeline_opportunities FOR UPDATE TO anon USING (true) WITH CHECK (true);
