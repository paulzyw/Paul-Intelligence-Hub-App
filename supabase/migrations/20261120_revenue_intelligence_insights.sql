-- Migration: 20261120_revenue_intelligence_insights.sql
-- Persistent storage for Gemini Revenue Intelligence Insights on the Pipeline Assessment Dashboard
-- Complies with RevOS Post-May 2026 explicit GRANT and RLS standard

CREATE TABLE IF NOT EXISTS public.pipeline_revenue_intelligence_reports (
  report_id TEXT PRIMARY KEY,
  scope_hash TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'workspace_default',
  scope_label TEXT NOT NULL DEFAULT 'Full Portfolio',
  applied_filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  portfolio_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  report_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  analysis_status TEXT NOT NULL DEFAULT 'ready'
    CHECK (analysis_status IN ('ready', 'partial', 'insufficient_data')),
  prompt_version TEXT NOT NULL DEFAULT '1.0',
  reasoning_spec_version TEXT NOT NULL DEFAULT '1.0',
  rules_version TEXT NOT NULL DEFAULT 'v1.1',
  model_identifier TEXT NOT NULL DEFAULT 'gemini-3.1-flash-lite',
  is_saved BOOLEAN NOT NULL DEFAULT true,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rev_intel_reports_scope_hash
  ON public.pipeline_revenue_intelligence_reports (user_id, scope_hash, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_rev_intel_reports_saved_latest
  ON public.pipeline_revenue_intelligence_reports (user_id, is_saved, generated_at DESC);

-- Explicit Data API Grants (Post-May 2026 Supabase Standard)
GRANT SELECT ON public.pipeline_revenue_intelligence_reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_revenue_intelligence_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_revenue_intelligence_reports TO service_role;

-- Enable Row Level Security
ALTER TABLE public.pipeline_revenue_intelligence_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on pipeline_revenue_intelligence_reports"
  ON public.pipeline_revenue_intelligence_reports;
CREATE POLICY "Allow anon select on pipeline_revenue_intelligence_reports"
  ON public.pipeline_revenue_intelligence_reports
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated read/write own pipeline_revenue_intelligence_reports"
  ON public.pipeline_revenue_intelligence_reports;
CREATE POLICY "Allow authenticated read/write own pipeline_revenue_intelligence_reports"
  ON public.pipeline_revenue_intelligence_reports
  FOR ALL TO authenticated
  USING (user_id = 'workspace_default' OR user_id = auth.uid()::text)
  WITH CHECK (user_id = 'workspace_default' OR user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Allow service_role full access to pipeline_revenue_intelligence_reports"
  ON public.pipeline_revenue_intelligence_reports;
CREATE POLICY "Allow service_role full access to pipeline_revenue_intelligence_reports"
  ON public.pipeline_revenue_intelligence_reports
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
