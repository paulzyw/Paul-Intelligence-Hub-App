-- ==============================================================================
-- Migration: 20261122_pipeline_assessments_source_provenance.sql
-- Module: RevOS Pipeline Assessment Engine - Source-Aware Assessment Traceability
-- Purpose:
--   1. Extends `public.pipeline_assessments` with additive provenance columns
--      recording Opportunity Source Category ('Inherited' vs 'Created'),
--      selected Initial Intelligence source type, source record identifier,
--      summary version (when Created), availability status, and structured
--      provenance metadata.
--   2. Strictly additive and idempotent; preserves all existing assessments,
--      PADF results, snapshots, and historical trajectories.
--   3. Maintains Post-May 2026 Supabase Data API explicit GRANTs and RLS.
-- ==============================================================================

ALTER TABLE public.pipeline_assessments
  ADD COLUMN IF NOT EXISTS opportunity_source_category TEXT,
  ADD COLUMN IF NOT EXISTS initial_intelligence_source_type TEXT,
  ADD COLUMN IF NOT EXISTS initial_intelligence_source_id TEXT,
  ADD COLUMN IF NOT EXISTS initial_intelligence_summary_version INTEGER,
  ADD COLUMN IF NOT EXISTS initial_intelligence_status TEXT,
  ADD COLUMN IF NOT EXISTS initial_intelligence_provenance JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_pipe_assess_source_category
  ON public.pipeline_assessments(opportunity_source_category);

CREATE INDEX IF NOT EXISTS idx_pipe_assess_init_source_type
  ON public.pipeline_assessments(initial_intelligence_source_type);

-- Ensure Post-May 2026 Supabase Data API permissions & RLS remain active
ALTER TABLE public.pipeline_assessments ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.pipeline_assessments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_assessments TO service_role;
