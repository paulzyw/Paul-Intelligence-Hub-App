-- QUALIFICATION_INSIGHTS_SCHEMA.sql
-- Run this SQL in your Supabase SQL Editor to provision the table for Qualification Intelligence Executive Insights.
-- Follows RevOS project rules: includes explicit GRANTs for anon, authenticated, and service_role.

CREATE TABLE IF NOT EXISTS public.qualification_executive_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_campaign_id TEXT NOT NULL DEFAULT 'all',
  scope_campaign_name TEXT NOT NULL DEFAULT 'All Campaigns (Account-Wide)',
  scope_industry TEXT,
  scope_revenue_motion TEXT,
  total_leads_scoped INTEGER DEFAULT 0,
  assessed_leads_count INTEGER DEFAULT 0,
  analysis_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  insights_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast retrieval by scope and recency
CREATE INDEX IF NOT EXISTS idx_qual_insights_scope ON public.qualification_executive_insights (scope_campaign_id, generated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.qualification_executive_insights ENABLE ROW LEVEL SECURITY;

-- Explicit Data API Grants (Post-May 2026 Supabase Standard)
GRANT SELECT ON public.qualification_executive_insights TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qualification_executive_insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qualification_executive_insights TO service_role;
