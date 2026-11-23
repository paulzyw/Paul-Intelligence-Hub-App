-- ==============================================================================
-- Migration: 20261122_pipeline_initial_context_summary_lifecycle.sql
-- Module: RevOS Pipeline Assessment Engine - Initial Opportunity Context Summary
-- Purpose:
--   1. Extends `public.pipeline_opportunity_handover_details` with lifecycle,
--      versioning, history, input-hash staleness tracking, and Gemini provenance
--      columns for Initial Opportunity Context Summary generation on "Created"
--      opportunities.
--   2. Strictly additive and idempotent; preserves all existing inherited deal
--      data, PADF assessments, and existing rows without destructive changes.
--   3. Maintains Post-May 2026 Supabase Data API explicit GRANTs and RLS.
-- ==============================================================================

ALTER TABLE public.pipeline_opportunity_handover_details
  ADD COLUMN IF NOT EXISTS summary_version INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS summary_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS summary_input_hash TEXT,
  ADD COLUMN IF NOT EXISTS summary_model_identifier TEXT,
  ADD COLUMN IF NOT EXISTS summary_prompt_version TEXT;

CREATE INDEX IF NOT EXISTS idx_pipe_handover_summary_input_hash
  ON public.pipeline_opportunity_handover_details(summary_input_hash);

-- Ensure Post-May 2026 Supabase Data API permissions & RLS remain active
ALTER TABLE public.pipeline_opportunity_handover_details ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_opportunity_handover_details TO service_role;
