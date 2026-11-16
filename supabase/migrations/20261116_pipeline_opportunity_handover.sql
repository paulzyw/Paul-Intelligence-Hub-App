-- ==============================================================================
-- Migration: 20261116_pipeline_opportunity_handover.sql
-- Module: RevOS Pipeline Assessment Engine - Opportunity Handover Detail
-- Framework: Pipeline Assessment Data Inheritance Framework v1.0 (PADIF)
-- Purpose: Dedicated and isolated storage for Opportunity Handover Detail
--          inherited from Opportunity Qualification without mutating upstream tables.
-- Standards: Post-May 2026 Supabase Data API explicit GRANTs and Row Level Security (RLS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.pipeline_opportunity_handover_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id TEXT NOT NULL UNIQUE REFERENCES public.pipeline_opportunities(pipeline_id) ON DELETE CASCADE,
  opportunity_id TEXT,
  lead_id TEXT,
  source_session_id TEXT,
  source_result_id TEXT,

  -- Governance & PADIF Provenance
  source_module TEXT NOT NULL DEFAULT 'RevOS_Opportunity_Qualification',
  framework_version TEXT NOT NULL DEFAULT 'PADIF_v1.0',
  handover_lifecycle_state TEXT NOT NULL DEFAULT 'INHERITED', -- INHERITED, REVALIDATED, SUPERSEDED, INVALIDATED

  -- Three Core Opportunity Handover Sections
  qualification_continuity JSONB NOT NULL DEFAULT '{}'::jsonb,
  canonical_classification JSONB NOT NULL DEFAULT '{}'::jsonb,
  upstream_handover_risks JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Complete PADIF v1.0 Snapshot Payload (I1-I4)
  padif_package JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_notes TEXT,

  -- Timestamps
  inherited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revalidated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast Pipeline Assessment lookups
CREATE INDEX IF NOT EXISTS idx_pipe_handover_pipeline_id
  ON public.pipeline_opportunity_handover_details(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipe_handover_opp_id
  ON public.pipeline_opportunity_handover_details(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_pipe_handover_lead_id
  ON public.pipeline_opportunity_handover_details(lead_id);
CREATE INDEX IF NOT EXISTS idx_pipe_handover_lifecycle
  ON public.pipeline_opportunity_handover_details(handover_lifecycle_state);

-- Explicit Data API Permissions (Post-May 2026 Supabase Standard)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.pipeline_opportunity_handover_details ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DROP POLICY IF EXISTS "Allow anon read on pipeline_opportunity_handover_details" ON public.pipeline_opportunity_handover_details;
CREATE POLICY "Allow anon read on pipeline_opportunity_handover_details"
  ON public.pipeline_opportunity_handover_details FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert on pipeline_opportunity_handover_details" ON public.pipeline_opportunity_handover_details;
CREATE POLICY "Allow anon insert on pipeline_opportunity_handover_details"
  ON public.pipeline_opportunity_handover_details FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on pipeline_opportunity_handover_details" ON public.pipeline_opportunity_handover_details;
CREATE POLICY "Allow anon update on pipeline_opportunity_handover_details"
  ON public.pipeline_opportunity_handover_details FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access on pipeline_opportunity_handover_details" ON public.pipeline_opportunity_handover_details;
CREATE POLICY "Allow authenticated full access on pipeline_opportunity_handover_details"
  ON public.pipeline_opportunity_handover_details FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access on pipeline_opportunity_handover_details" ON public.pipeline_opportunity_handover_details;
CREATE POLICY "Allow service_role full access on pipeline_opportunity_handover_details"
  ON public.pipeline_opportunity_handover_details FOR ALL TO service_role USING (true) WITH CHECK (true);
